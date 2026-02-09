import type { Book } from "@/src/types";
import { StyleSheet, View, Text, Alert, Image, Animated, Pressable, SafeAreaView, FlatList } from "react-native";
import { getBooks, removeBook } from "@/api/user-books";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { GestureHandlerRootView, RectButton, Swipeable } from "react-native-gesture-handler";
import { IconSymbol } from "@/components/ui/IconSymbol";
import StarRating from "@/components/ui/StarRating";
import RotatingLoader from "@/components/ui/RotatingLoader";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSearchContext } from "@/components/shared/SearchContextType";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useCallback, useState } from "react";
import { Skeleton } from "@/components/LibrarySkeleton";
import Reanimated, { FadeInDown } from 'react-native-reanimated';

export default function UserLibraryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const { searchText, setSearchText } = useSearchContext();
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search your books...',
        textColor: '#2D3436',
        onChangeText: (event: any) => {
          const text = event.nativeEvent.text;
          setSearchText(text);
        },
      },
    });
  }, [navigation, setSearchText]);

  const { data: booksData, isLoading, refetch, isRefetching } = useQuery<{ books: Book[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["books-data", user?.id],
    queryFn: () => getBooks(user!.id),
    enabled: !!user?.id,
  });

  const books = booksData?.books || [];

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const filteredBooks = books?.filter((book) => {
    if (!searchText.trim()) return true;
    const query = searchText.toLowerCase();
    return (
      book.title!.toLowerCase().includes(query) ||
      book.author!.toLowerCase().includes(query)
    );
  });

  const sortedBooks = filteredBooks?.sort((a, b) => b.id - a.id);

  const handleRemoveBooks = async (bookId: number) => {
    const bookToRemove = books?.find(book => book.id === bookId);
    const bookTitle = bookToRemove?.title || "this book";

    Alert.alert(
      "Remove Book",
      `Are you sure you want to remove "${bookTitle}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await removeBook(user?.id!, bookId);
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["last-ten-books"] }),
                queryClient.invalidateQueries({ queryKey: ["books-data"] }),
              ]);
              refetch();
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (bookId: number, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [-0, 0],
    });

    return (
      <RectButton style={styles.rightAction} onPress={() => handleRemoveBooks(bookId)}>
        <Animated.View style={[styles.deleteBox, { transform: [{ translateX: trans }] }]}>
          <View style={styles.deleteIconWrapper}>
            <IconSymbol name="trash" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.deleteText}>Remove</Text>
        </Animated.View>
      </RectButton>
    );
  };

  const renderBookItem = useCallback(({ item: book, index }: { item: Book; index: number }) => {
    return (
      <Reanimated.View
        entering={FadeInDown.delay(index < 6 ? index * 100 : 0).springify()}
      >
        <Swipeable
          renderRightActions={(progress, dragX) => renderRightActions(book.id, progress, dragX)}
        >
          <Pressable
            onPress={() => router.push(`/book/${book.id}`)}
            style={({ pressed }) => [
              styles.bookCard,
              pressed && styles.bookCardPressed
            ]}
          >
            <View style={styles.bookContent}>
              <View style={styles.bookCoverContainer}>
                <Image
                  source={book.photo_url ? { uri: book.photo_url } : require("@/assets/images/no-book-cover.png")}
                  style={styles.bookCover}
                  resizeMode="cover"
                />
                <View style={styles.coverSpot} />
              </View>

              <View style={styles.bookInfo}>
                <View style={styles.bookTextContent}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    by {book.author}
                  </Text>
                </View>

                <View style={styles.ratingContainer}>
                  <StarRating rating={book?.rating || 0} size={20} />
                </View>
              </View>

              <View style={styles.arrowContainer}>
                <IconSymbol name="chevron.right" size={20} color="#C4B5A0" />
              </View>
            </View>
          </Pressable>
        </Swipeable>
      </Reanimated.View>
    );
  }, [router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.booksGrid, { paddingTop: headerHeight }]}>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.bookContent}>
                <View style={styles.bookCoverContainer}>
                  <Skeleton width={80} height={120} />
                </View>
                <View style={styles.bookInfo}>
                  <View style={styles.bookTextContent}>
                    <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
                  </View>
                  <View style={styles.ratingSkeletonContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <View key={star} style={styles.starSkeleton} />
                    ))}
                  </View>
                </View>
                <View style={styles.arrowContainer}>
                  <Skeleton width={20} height={20} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: headerHeight }]}>
      {isDeleting && (
        <RotatingLoader
          message="Removing Book"
          subMessage="Please wait..."
          fullScreen={false}
        />
      )}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FlatList
          data={sortedBooks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBookItem}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.contentContainer, styles.booksGrid]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}

          ListEmptyComponent={
            <View style={styles.emptyStateWrapper}>
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIcon}>
                  <View style={styles.cowHead}>
                    <View style={styles.cowEar1} />
                    <View style={styles.cowEar2} />
                    <View style={styles.cowSnout} />
                    <View style={styles.cowEye1} />
                    <View style={styles.cowEye2} />
                  </View>
                </View>
                <Text style={styles.emptyStateTitle}>
                  {searchText.trim() ? 'No Books Found' : 'Empty Library'}
                </Text>
                <Text style={styles.emptyStateDescription}>
                  {searchText.trim()
                    ? 'Try using different search terms'
                    : 'Add your first book to get started.'
                  }
                </Text>
                {!searchText.trim() && (
                  <Pressable
                    style={styles.emptyStateCTA}
                    onPress={() => router.push('/add-new-book')}
                  >
                    <Text style={styles.emptyStateCTAText}>Add First Book</Text>
                  </Pressable>
                )}
              </View>
            </View>
          }

          ListFooterComponent={
            sortedBooks && sortedBooks.length > 0 ? (
              <View style={styles.statsSection}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{sortedBooks.length}</Text>
                  <Text style={styles.statLabel}>Total Books</Text>
                  <View style={styles.statSpot} />
                </View>
              </View>
            ) : null
          }
        />
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F3",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF8F3",
  },
  contentContainer: {
    paddingBottom: 32,
  },
  booksGrid: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    position: "relative",
  },
  cowSpot1: {
    position: "absolute",
    width: 20,
    height: 15,
    backgroundColor: "#2D3436",
    borderRadius: 10,
    top: 10,
    left: 15,
    opacity: 0.1,
  },
  cowSpot2: {
    position: "absolute",
    width: 15,
    height: 12,
    backgroundColor: "#2D3436",
    borderRadius: 8,
    bottom: 12,
    right: 18,
    opacity: 0.1,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#8B7355",
  },
  headerSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  headerCard: {
    backgroundColor: "#FF6B8B",
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerContent: {
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFE5EC",
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  headerSpot: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 50,
  },
  spotTopRight: {
    width: 80,
    height: 80,
    top: -20,
    right: 30,
  },
  spotBottomLeft: {
    width: 60,
    height: 60,
    bottom: -15,
    left: 40,
  },
  spotMiddle: {
    width: 40,
    height: 40,
    top: 50,
    right: -10,
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
    marginBottom: 2,
  },
  bookCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  bookContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  bookCoverContainer: {
    position: "relative",
    borderWidth: 1,
    borderColor: '#F5E6D3',
    borderRadius: 12,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F5E6D3",
  },
  coverSpot: {
    position: "absolute",
    width: 25,
    height: 20,
    backgroundColor: "#2D3436",
    borderRadius: 15,
    opacity: 0.03,
    bottom: -5,
    right: -5,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
  },
  bookTextContent: {
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#2D3436",
    letterSpacing: 0.2,
  },
  bookAuthor: {
    fontSize: 14,
    color: "#8B7355",
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: "flex-start",
  },
  arrowContainer: {
    padding: 8,
    backgroundColor: "#FFF8F3",
    borderRadius: 12,
  },
  rightAction: {
    backgroundColor: '#FFE5EC',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 20,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#FFD4E1',
  },
  deleteBox: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteText: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateWrapper: {
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 24,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF5F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  cowHead: {
    width: 60,
    height: 50,
    backgroundColor: "#2D3436",
    borderRadius: 30,
    opacity: 0.1,
    position: "relative",
  },
  cowEar1: {
    position: "absolute",
    width: 18,
    height: 25,
    backgroundColor: "#2D3436",
    borderRadius: 10,
    top: -12,
    left: 8,
  },
  cowEar2: {
    position: "absolute",
    width: 18,
    height: 25,
    backgroundColor: "#2D3436",
    borderRadius: 10,
    top: -12,
    right: 8,
  },
  cowSnout: {
    position: "absolute",
    width: 30,
    height: 18,
    backgroundColor: "#FF6B8B",
    borderRadius: 15,
    bottom: 8,
    left: "50%",
    marginLeft: -15,
    opacity: 0.3,
  },
  cowEye1: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "#2D3436",
    borderRadius: 4,
    top: 15,
    left: 15,
  },
  cowEye2: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "#2D3436",
    borderRadius: 4,
    top: 15,
    right: 15,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyStateCTA: {
    backgroundColor: "#FFE5EC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD4E1",
  },
  emptyStateCTAText: {
    color: "#FF6B8B",
    fontSize: 14,
    fontWeight: "600",
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
    position: "relative",
    overflow: "hidden",
  },
  statIconContainer: {
    marginBottom: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  bookIcon: {
    width: 20,
    height: 24,
    backgroundColor: "#6B8BFF",
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#5A7FFF",
  },
  heartIcon: {
    width: 24,
    height: 22,
    backgroundColor: "#FF6B8B",
    borderRadius: 12,
    transform: [{ rotate: "-45deg" }],
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8B7355",
    fontWeight: "500",
  },
  statSpot: {
    position: "absolute",
    width: 25,
    height: 20,
    backgroundColor: "#2D3436",
    borderRadius: 15,
    opacity: 0.03,
    bottom: -5,
    right: -5,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
    marginBottom: 12,
  },
  ratingSkeletonContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starSkeleton: {
    width: 22,
    height: 22,
    backgroundColor: '#F5E6D3',
    borderRadius: 11,
  },
});