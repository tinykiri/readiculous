import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable
} from 'react-native';
import moment from 'moment';
import { useQuery } from '@tanstack/react-query';
import { getCalendarData } from '@/api/user-books';
import { useAuth } from '@/src/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTAINER_PADDING = 20;
const CELL_WIDTH_PIXELS = (SCREEN_WIDTH - (CONTAINER_PADDING * 2)) / 7;

interface DayLog {
  cover: string;
  isStart?: boolean;
  isEnd?: boolean;
  isMiddle?: boolean;
}

export function ReadingCalendar() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const { data: calendarResponse, isLoading } = useQuery({
    queryKey: ["calendar-data", user?.id, selectedYear],
    queryFn: () => getCalendarData(user!.id, selectedYear),
    enabled: !!user?.id,
  });

  const books = calendarResponse?.books;
  const availableYears = calendarResponse?.availableYears || [moment().year()];

  const { logs, bestStreak, yearStats } = useMemo(() => {
    if (!books) return { logs: {} as Record<string, DayLog>, bestStreak: 0, yearStats: { booksRead: 0, daysRead: 0 } };

    const logsMap: Record<string, DayLog> = {};
    const readingDates: string[] = [];
    let booksReadInYear = 0;

    books.forEach((book) => {
      if (book.started_at && book.photo_url) {
        const start = moment(book.started_at);
        const end = book.finished_at ? moment(book.finished_at) : null;

        if (end && end.year() === selectedYear) {
          booksReadInYear++;
        }

        if (end) {
          const current = start.clone();
          while (current.isSameOrBefore(end, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            const isStart = current.isSame(start, 'day');
            const isEnd = current.isSame(end, 'day');
            const isMiddle = !isStart && !isEnd;

            logsMap[dateStr] = {
              cover: book.photo_url!,
              isStart,
              isEnd,
              isMiddle
            };

            readingDates.push(dateStr);
            current.add(1, 'days');
          }
        } else {
          const dateStr = start.format('YYYY-MM-DD');
          logsMap[dateStr] = { cover: book.photo_url!, isStart: true, isEnd: true };
          readingDates.push(dateStr);
        }
      }
    });

    const uniqueDates = [...new Set(readingDates)].sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let previousDate: moment.Moment | null = null;

    const daysInSelectedYear = uniqueDates.filter(d => moment(d).year() === selectedYear).length;

    uniqueDates.forEach((dateStr) => {
      const currentDate = moment(dateStr);
      if (previousDate) {
        const diff = currentDate.diff(previousDate, 'days');
        if (diff === 1) currentStreak++;
        else currentStreak = 1;
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      previousDate = currentDate;
    });

    return {
      logs: logsMap,
      bestStreak: maxStreak,
      yearStats: { booksRead: booksReadInYear, daysRead: daysInSelectedYear }
    };
  }, [books, selectedYear]);

  const months = Array.from({ length: 12 }, (_, i) => moment().year(selectedYear).month(i));
  const startOfMonth = selectedMonth.clone().startOf('month');
  const daysInMonth = selectedMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day();

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(moment().year(year).month(selectedMonth.month()));
    setShowYearPicker(false);
  };

  const handleMonthSelect = (month: moment.Moment) => {
    setSelectedMonth(month);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color="#FF6B8B" />
      </View>
    );
  }

  const isCurrentYear = selectedYear === moment().year();

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.streakLabel}>
            {isCurrentYear ? 'Active Reading Streak' : `${selectedYear} Reading Stats`}
          </Text>
          {isCurrentYear ? (
            <View style={styles.streakCountContainer}>
              <Text style={styles.streakNumber}>{bestStreak}</Text>
              <Text style={styles.streakText}>days</Text>
            </View>
          ) : (
            <View style={styles.yearStatsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.streakNumber}>{yearStats.booksRead}</Text>
                <Text style={styles.streakText}>books</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.streakNumber}>{yearStats.daysRead}</Text>
                <Text style={styles.streakText}>days</Text>
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.yearSelector}
          onPress={() => setShowYearPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.yearSelectorText}>{selectedYear}</Text>
          <View style={styles.headerIcon}>
            <IconSymbol name="chevron.down" size={16} color="#FF6B8B" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScrollContent}
        >
          {months.map((month, index) => {
            const isSelected = month.format('MMM YYYY') === selectedMonth.format('MMM YYYY');
            const isCurrentMonth = month.format('MMM YYYY') === moment().format('MMM YYYY');
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthPill,
                  isSelected && styles.monthPillActive,
                  !isSelected && isCurrentMonth && styles.monthPillCurrent
                ]}
                onPress={() => handleMonthSelect(month)}
              >
                <Text style={[
                  styles.monthText,
                  isSelected && styles.monthTextActive,
                  !isSelected && isCurrentMonth && styles.monthTextCurrent
                ]}>
                  {month.format('MMM')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Week Header */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty Cells for Start Padding */}
        {Array.from({ length: startDayOfWeek }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}

        {/* Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateStr = selectedMonth.clone().date(day).format('YYYY-MM-DD');
          const log = logs[dateStr];
          const isToday = dateStr === moment().format('YYYY-MM-DD');

          return (
            <View
              key={day}
              style={[
                styles.dayCell,
                log && styles.dayCellPink,
                log?.isStart && styles.startCap,
                log?.isEnd && styles.endCap,
                log?.isMiddle && styles.middleSegment,
                isToday && !log && styles.dayCellToday
              ]}
            >
              <Text style={[
                styles.dayNumber,
                log && styles.dayNumberDark,
                isToday && !log && styles.dayNumberPink
              ]}>
                {day}
              </Text>

              {log?.cover && (
                <Image
                  source={{ uri: log.cover }}
                  style={styles.bookCover}
                  resizeMode="cover"
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowYearPicker(false)}
        >
          <Pressable style={styles.yearPickerContainer}>
            <View style={styles.yearPickerHeader}>
              <View style={styles.yearPickerTitleRow}>
                <IconSymbol name="calendar" size={20} color="#FF6B8B" />
                <Text style={styles.yearPickerTitle}>Reading History</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowYearPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={16} color="#8B7355" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.yearList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.yearListContent}
            >
              {availableYears.map((year) => {
                const isSelected = year === selectedYear;
                const isCurrent = year === moment().year();
                return (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearItem,
                      isSelected && styles.yearItemSelected
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text style={[
                      styles.yearItemText,
                      isSelected && styles.yearItemTextSelected
                    ]}>
                      {year}
                    </Text>
                    {isCurrent && !isSelected && (
                      <Text style={styles.currentLabel}>now</Text>
                    )}
                    {isSelected && (
                      <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: CONTAINER_PADDING,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerIcon: {
    backgroundColor: '#FFF0F5',
    padding: 6,
    borderRadius: 8,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  yearSelectorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B8B',
  },
  streakLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    fontWeight: '500'
  },
  streakCountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  yearStatsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6B8B',
    lineHeight: 36
  },
  streakText: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '600'
  },
  monthSelectorContainer: {
    marginBottom: 20,
    marginHorizontal: -20
  },
  monthScrollContent: {
    paddingHorizontal: 20,
    gap: 12
  },
  monthPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  monthPillActive: {
    backgroundColor: '#FF6B8B',
    borderColor: '#FF6B8B'
  },
  monthPillCurrent: {
    borderColor: '#FF6B8B',
    backgroundColor: '#FFF',
    borderWidth: 1
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355'
  },
  monthTextActive: {
    color: '#FFFFFF'
  },
  monthTextCurrent: {
    color: '#FF6B8B'
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    width: '100%',
  },
  weekDayText: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
    color: '#B0A090',
    fontWeight: '600'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    rowGap: 10,
  },
  dayCell: {
    width: '14.2857%',
    height: CELL_WIDTH_PIXELS * 1.3,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: 4,
  },
  dayCellPink: {
    backgroundColor: '#FF6B8B',
  },
  startCap: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: -0.5,
    width: '14.4%',
    zIndex: 1,
  },
  endCap: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginLeft: -0.5,
    width: '14.4%',
    zIndex: 1,
  },
  middleSegment: {
    borderRadius: 0,
    marginHorizontal: -0.5,
    width: '14.6%',
    zIndex: 0,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#FF6B8B',
    borderStyle: 'dashed',
    borderRadius: 12
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 2
  },
  dayNumberDark: {
    color: '#2D3436'
  },
  dayNumberPink: {
    color: '#FF6B8B'
  },
  bookCover: {
    width: '70%',
    height: '60%',
    borderRadius: 4,
    marginTop: 2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 52, 54, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: SCREEN_WIDTH * 0.75,
    maxHeight: 380,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  yearPickerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  closeButton: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 10,
  },
  yearList: {
    maxHeight: 280,
  },
  yearListContent: {
    gap: 8,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
  },
  yearItemSelected: {
    backgroundColor: '#FF6B8B',
  },
  yearItemText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3436',
  },
  yearItemTextSelected: {
    color: '#FFFFFF',
  },
  currentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B0A090',
  },
});