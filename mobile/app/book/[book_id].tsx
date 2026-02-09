import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
  View,
  SafeAreaView
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  addQuote,
  editComment,
  editRating,
  getBookInfo,
  removeComment,
  removeQuote,
} from "@/api/user-books";
import { Book } from "@/src/types";
import moment from "moment";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { GestureHandlerRootView, RectButton, Swipeable } from "react-native-gesture-handler";
import { IconSymbol } from "@/components/ui/IconSymbol";
import StarRating from "@/components/ui/StarRating";
import RotatingLoader from "@/components/ui/RotatingLoader";

const commentSchema = z.object({
  comment_section: z.string(),
  rating: z.number(),
});

export default function SpecificBookScreen() {
  const { user } = useAuth();
  const { book_id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: bookInfo, isLoading } = useQuery<Book>({
    queryKey: ["individual-book-info", book_id, user?.id],
    queryFn: () => getBookInfo(user!.id, Number(book_id)),
    enabled: !!book_id && !!user?.id
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [addNewQuote, setAddNewQuote] = useState(false);
  const [quote, setQuote] = useState('');
  const [isDeletingQuote, setIsDeletingQuote] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const tabs = ['information', 'quotes'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const navigation = useNavigation();

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment_section: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const { control, formState: { isSubmitting }, reset } = form;

  if (isLoading) {
    return (
      <RotatingLoader
        message="Loading book details"
        subMessage="Getting your reading info..."
        fullScreen={true}
      />
    );
  }

  const handlePress = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  const handleAddComment = async () => {
    setIsAddingComment(true);
    try {
      await addComment(user?.id!, Number(book_id)!, form.getValues().comment_section);
      reset();
      setIsPressed(false);
      await queryClient.invalidateQueries({
        queryKey: ["individual-book-info", book_id]
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleEditComment = async () => {
    try {
      await editComment(user?.id!, Number(book_id)!, form.getValues().comment_section);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["individual-book-info", book_id]
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAddQuote = async () => {
    setIsAddingQuote(true);
    try {
      await addQuote(user!.id, Number(book_id)!, quote);
      setAddNewQuote(false);
      setQuote('');
      await queryClient.invalidateQueries({
        queryKey: ["individual-book-info", book_id]
      });
    } catch (error) {
      console.error('Error adding quote:', error);
    } finally {
      setIsAddingQuote(false);
    }
  };

  const handleRemoveQuote = async (quoteId: number) => {
    setIsDeletingQuote(true);
    try {
      await removeQuote(user!.id, Number(book_id)!, quoteId);
      await queryClient.invalidateQueries({
        queryKey: ["individual-book-info", book_id]
      });
    } finally {
      setIsDeletingQuote(false);
    }
  }

  const handleChangeRating = async (rating: number) => {
    await editRating(user?.id!, Number(book_id), rating);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["individual-book-info", book_id] }),
      queryClient.invalidateQueries({ queryKey: ["last-ten-books"] }),
      queryClient.invalidateQueries({ queryKey: ["books-data"] }),
    ]);
  }

  const handleRemoveComment = async (commentId: number) => {
    setIsDeletingComment(true);
    try {
      await removeComment(user?.id!, Number(book_id), commentId);
      setIsEditing(false);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["individual-book-info", book_id]
      });
    } finally {
      setIsDeletingComment(false);
    }
  }

  const renderRightActionsForQuotes = (quoteId: number, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [-0, 0],
    });

    return (
      <RectButton style={styles.rightAction} onPress={() => handleRemoveQuote(quoteId)}>
        <Animated.View style={[styles.deleteBox, { transform: [{ translateX: trans }] }]}>
          <View style={styles.deleteIconWrapper}>
            <IconSymbol name="trash" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.deleteText}>Remove</Text>
        </Animated.View>
      </RectButton>
    );
  };

  const renderRightActionsForComments = (commentId: string, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [-0, 0],
    });

    return (
      <RectButton style={styles.rightAction} onPress={() => handleRemoveComment(Number(commentId))}>
        <Animated.View style={[styles.deleteBox, { transform: [{ translateX: trans }] }]}>
          <View style={styles.deleteIconWrapper}>
            <IconSymbol name="trash" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.deleteText}>Remove</Text>
        </Animated.View>
      </RectButton>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDeletingQuote && (
        <RotatingLoader
          message="Removing Quote"
          subMessage="Please wait..."
          fullScreen={false}
        />
      )}
      {isDeletingComment && (
        <RotatingLoader
          message="Removing Comment"
          subMessage="Please wait..."
          fullScreen={false}
        />
      )}
      {isAddingQuote && (
        <RotatingLoader
          message="Adding Quote"
          subMessage="Please wait..."
          fullScreen={false}
        />
      )}
      {isAddingComment && (
        <RotatingLoader
          message="Adding Comment"
          subMessage="Please wait..."
          fullScreen={false}
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#2D3436" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Details</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroBackground}>
              <Image
                source={bookInfo?.photo_url ? { uri: bookInfo?.photo_url } : require("@/assets/images/no-book-cover.png")}
                style={styles.heroBackgroundImage}
                blurRadius={20}
              />
              <View style={styles.heroOverlay} />
            </View>

            <View style={styles.bookCoverContainer}>
              {bookInfo?.finished_at && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>✓ Finished</Text>
                </View>
              )}
              {!bookInfo?.finished_at && (
                <View style={[styles.statusBadge, styles.readingBadge]}>
                  <Text style={styles.statusText}>Reading</Text>
                </View>
              )}
              <Image
                source={bookInfo?.photo_url ? { uri: bookInfo?.photo_url } : require("@/assets/images/no-book-cover.png")}
                style={styles.bookCover}
                resizeMode='cover'
              />
              <View style={styles.bookCoverShadow} />
            </View>

            <View style={styles.bookInfoCard}>
              <Text style={styles.bookTitle} numberOfLines={2}>{bookInfo?.title}</Text>
              <Text style={styles.bookAuthor}>by {bookInfo?.author}</Text>

              <View style={styles.ratingContainer}>
                <Controller
                  control={control}
                  name="rating"
                  render={({ field: { onChange } }) => (
                    <StarRating
                      key={bookInfo?.rating}
                      rating={bookInfo?.rating || 0}
                      size={28}
                      readonly={false}
                      onRatingChange={(newRating: number) => {
                        onChange(newRating);
                        handleChangeRating(newRating);
                      }}
                    />
                  )}
                />
              </View>

              <View style={styles.dateContainer}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Started</Text>
                  <Text style={styles.dateText}>{moment(bookInfo?.started_at).format('MMM DD, YYYY')}</Text>
                </View>
                {bookInfo?.finished_at && (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Finished</Text>
                    <Text style={styles.dateText}>{moment(bookInfo?.finished_at).format('MMM DD, YYYY')}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.cowSpot, styles.spotTopLeft]} />
            <View style={[styles.cowSpot, styles.spotBottomRight]} />
          </View>

          {/* Tabs */}
          <View style={styles.tabsWrapper}>
            <View style={styles.tabsContainer}>
              {tabs.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={[styles.tabButton, activeTab === item && styles.activeTabButton]}>
                    <Text style={[
                      styles.tabText,
                      activeTab === item && styles.activeTabText
                    ]}>
                      {item === 'information' ? 'Information' : 'Quotes'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {activeTab === 'information' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Your Comments</Text>

                {bookInfo?.comment_section ? (
                  <View>
                    {isEditing ? (
                      <View style={styles.editContainer}>
                        <Controller
                          control={control}
                          name="comment_section"
                          render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                              style={styles.textInput}
                              placeholder="Edit your comment..."
                              placeholderTextColor="#8B7355"
                              value={value ?? ''}
                              multiline
                              scrollEnabled={false}
                              onChangeText={onChange}
                              onBlur={onBlur}
                            />
                          )}
                        />
                        <View style={styles.buttonRow}>
                          <TouchableOpacity
                            onPress={() => { setIsEditing(false); reset(); }}
                            style={[styles.actionButton, styles.cancelButton]}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => { handleEditComment(); setIsEditing(false); }}
                            style={[styles.actionButton, styles.primaryButton]}
                          >
                            <Text style={styles.primaryButtonText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <GestureHandlerRootView>
                        <Swipeable
                          key={bookInfo?.comment_section}
                          renderRightActions={(progress, dragX) => renderRightActionsForComments(bookInfo.comment_section!, progress, dragX)}
                        >
                          <View style={styles.commentCard}>
                            <Text style={styles.commentText}>{bookInfo?.comment_section}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                setIsEditing(true);
                                form.setValue('comment_section', bookInfo?.comment_section || '');
                              }}
                              style={styles.editIcon}
                            >
                              <IconSymbol name="pencil" size={20} color="#FF6B8B" />
                            </TouchableOpacity>
                          </View>
                        </Swipeable>
                      </GestureHandlerRootView>
                    )}
                  </View>
                ) : (
                  <View>
                    <View style={styles.emptyStateContainer}>
                      <View style={styles.emptyIcon}>
                        <Text style={styles.emptyIconText}>💭</Text>
                      </View>
                      <Text style={styles.emptyTitle}>No comments yet</Text>
                      <Text style={styles.emptySubtitle}>Share your thoughts about this book</Text>
                    </View>

                    {!isPressed ? (
                      <TouchableOpacity
                        onPress={() => setIsPressed(true)}
                        style={[styles.actionButton, styles.primaryButton, styles.largeButton]}
                      >
                        <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Add Comment</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.addCommentContainer}>
                        <Controller
                          control={control}
                          name="comment_section"
                          render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                              style={styles.textInput}
                              placeholder="Share your thoughts about this book..."
                              placeholderTextColor="#8B7355"
                              value={value}
                              multiline
                              scrollEnabled={false}
                              onChangeText={onChange}
                              onBlur={onBlur}
                            />
                          )}
                        />
                        <View style={styles.buttonRow}>
                          <TouchableOpacity
                            onPress={() => { setIsPressed(false); reset(); }}
                            style={[styles.actionButton, styles.cancelButton]}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={handleAddComment}
                            disabled={isSubmitting}
                          >
                            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Adding...' : 'Add'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Quotes */}
            {activeTab === 'quotes' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Memorable Quotes</Text>

                {bookInfo?.memorable_quotes?.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyIcon}>
                      <Text style={styles.emptyIconText}>📖</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No quotes saved</Text>
                    <Text style={styles.emptySubtitle}>Capture memorable passages from this book</Text>
                  </View>
                ) : (
                  <GestureHandlerRootView>
                    {bookInfo?.memorable_quotes?.map((quote) => (
                      <Swipeable
                        key={quote?.id}
                        renderRightActions={(progress, dragX) => renderRightActionsForQuotes(quote?.id, progress, dragX)}
                      >
                        <View style={styles.quoteCard}>
                          <View style={styles.quoteMarkLeft}>
                            <Text style={styles.quoteMark}>"</Text>
                          </View>
                          <Text style={styles.quoteText}>{quote?.content}</Text>
                          <View style={styles.quoteMarkRight}>
                            <Text style={styles.quoteMark}>"</Text>
                          </View>
                        </View>
                      </Swipeable>
                    ))}
                  </GestureHandlerRootView>
                )}

                {addNewQuote ? (
                  <View style={styles.addQuoteContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter a memorable quote..."
                      placeholderTextColor="#8B7355"
                      value={quote}
                      multiline
                      scrollEnabled={false}
                      onChangeText={setQuote}
                    />
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        onPress={() => setAddNewQuote(false)}
                        style={[styles.actionButton, styles.cancelButton]}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleAddQuote}
                        style={[styles.actionButton, styles.primaryButton]}
                      >
                        <Text style={styles.primaryButtonText}>Add Quote</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setAddNewQuote(true)}
                    style={[styles.actionButton, styles.primaryButton, styles.largeButton]}
                  >
                    <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Add Quote</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    position: 'relative',
    marginBottom: 24,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 139, 0.8)',
  },
  bookCoverContainer: {
    alignItems: 'center',
    paddingTop: 40,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 30,
    right: '30%',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readingBadge: {
    backgroundColor: '#FFA500',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookCover: {
    width: 160,
    height: 240,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  bookCoverShadow: {
    position: 'absolute',
    bottom: -10,
    width: 140,
    height: 10,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 70,
    transform: [{ scaleX: 1 }],
  },
  bookInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 16,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  dateItem: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  cowSpot: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
  },
  spotTopLeft: {
    width: 80,
    height: 80,
    top: 20,
    left: -20,
  },
  spotBottomRight: {
    width: 60,
    height: 60,
    bottom: 20,
    right: -10,
  },
  tabsWrapper: {
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FF6B8B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B8B',
  },
  commentText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#2D3436',
    marginRight: 12,
  },
  editIcon: {
    padding: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 24,
  },
  editContainer: {
    gap: 12,
  },
  addCommentContainer: {
    width: '100%',
    gap: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2D3436',
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B8B',
    shadowColor: '#FF6B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFE5EC',
  },
  largeButton: {
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FF6B8B',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 12,
    borderRadius: 20,
    position: 'relative',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFE5EC',
  },
  quoteMarkLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  quoteMarkRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  quoteMark: {
    fontSize: 36,
    color: '#FFE5EC',
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2D3436',
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  addQuoteContainer: {
    gap: 12,
    marginTop: 16,
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
});