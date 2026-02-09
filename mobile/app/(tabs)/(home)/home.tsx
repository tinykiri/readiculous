import { ScrollView, StyleSheet, Text, View, ActivityIndicator, SafeAreaView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getLastTenBooks } from "@/api/user-books";
import Slider from "@/components/Slider";
import type { Book } from "@/src/types";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import { BookRecommendations } from "@/components/BookRecommendations";
import { RandomBookPicker } from "@/app/randomizer/random-book-picker";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function HomeScreen() {
  const router = useRouter()
  const headerHeight = useHeaderHeight();
  const { session, user, loading } = useAuth();

  const [isRouletteVisible, setRouletteVisible] = useState(false);

  const userId = user?.id || session?.user?.id;

  const { data: lastTenBooks, isLoading: isLoadingLastTenBooks } = useQuery<Book[]>({
    queryKey: ["last-ten-books", userId],
    queryFn: () => getLastTenBooks(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)/sign-in');
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fc647c" />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  if (isLoadingLastTenBooks) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <View style={styles.cowSpot1} />
            <View style={styles.cowSpot2} />
            <ActivityIndicator size="large" color="#FF6B8B" />
          </View>
          <Text style={styles.loadingText}>Loading your books</Text>
          <Text style={styles.loadingSubtext}>Almost ready to graze...</Text>
        </View>
      </View>
    )
  }

  const totalBooks = lastTenBooks?.length || 0;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: headerHeight }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeCard}>
            <View>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.greeting}>Hey there, Reader!</Text>
                <Text style={styles.username}>{user?.username}</Text>
                <View style={styles.motivationBadge}>
                  <Text style={styles.motivationText}>Happy Reading</Text>
                </View>
              </View>
              <View style={[styles.cowSpotDecor, styles.spotTop]} />
              <View style={[styles.cowSpotDecor, styles.spotBottom]} />
              <View style={[styles.cowSpotDecor, styles.spotMiddle]} />
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/user-profile/${user?.id}`)}
              style={{
                position: "relative",
              }}
            >
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 50,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#FF6B8B",
                shadowColor: "#FF6B8B",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
                overflow: "hidden",
              }}>
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: user?.avatar_url }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 50,
                    }}
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/user-avatar.png")}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 50,
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Books Section */}
        {lastTenBooks && lastTenBooks.length > 0 ? (
          <View style={styles.recentBooksSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Your Book Library</Text>
                <View style={styles.bookCountBadge}>
                  <Text style={styles.bookCountText}>{totalBooks} books</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>Recent reads from your library</Text>
            </View>

            <View style={styles.sliderWrapper}>
              <Slider data={lastTenBooks} />
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateWrapper}>
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIcon}>
                <View style={styles.cowHead}>
                  <View style={styles.cowEar1} />
                  <View style={styles.cowEar2} />
                  <View style={styles.cowSnout} />
                </View>
              </View>
              <Text style={styles.emptyStateTitle}>You haven't read anything yet</Text>
              <Text style={styles.emptyStateDescription}>
                Start your reading journey and watch your bookshelf fill up!
              </Text>
              <TouchableOpacity
                style={styles.emptyStateCTA}
                onPress={() => router.push("/add-new-book")}
              >
                <Text style={styles.emptyStateCTAText}>Add your first book</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Randomizer */}
        <TouchableOpacity
          style={styles.rouletteCard}
          onPress={() => setRouletteVisible(true)}
          activeOpacity={0.9}
        >
          <View style={[styles.cardSpot, styles.spotTopRight]} />
          <View style={[styles.cardSpot, styles.spotBottomLeft]} />

          <View style={styles.rouletteContent}>
            <View style={styles.textContainer}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>WHAT TO READ NEXT?</Text>
              </View>
              <Text style={styles.rouletteTitle}>Book Roulette</Text>
              <Text style={styles.rouletteSubtitle}>Let fate pick your next adventure</Text>
            </View>
            <View style={styles.iconCircle}>
              <IconSymbol name="dice.fill" size={32} color="#FF6B8B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Book Recommendations */}
        {userId && <BookRecommendations userId={userId} />}

        {/* Random Book Picker */}
        <RandomBookPicker
          visible={isRouletteVisible}
          onClose={() => setRouletteVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  )
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
  scrollContent: {
    paddingBottom: 100,
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
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  welcomeTextContainer: {
    zIndex: 2,
  },
  greeting: {
    fontSize: 16,
    color: "#FFE5EC",
    fontWeight: "500",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  motivationBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  motivationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cowSpotDecor: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 50,
  },
  spotTop: {
    width: 80,
    height: 80,
    top: -20,
    right: 30,
  },
  spotBottom: {
    width: 60,
    height: 60,
    bottom: -15,
    right: 80,
  },
  spotMiddle: {
    width: 40,
    height: 40,
    top: 40,
    right: -10,
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 28,
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
  statCardSpot: {
    position: "absolute",
    width: 25,
    height: 20,
    backgroundColor: "#2D3436",
    borderRadius: 15,
    opacity: 0.03,
    bottom: -5,
    right: -5,
  },
  statIconContainer: {
    marginBottom: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  streakIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#FFA500",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  bookIcon: {
    width: 20,
    height: 24,
    backgroundColor: "#6B8BFF",
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#5A7FFF",
  },
  pageIcon: {
    width: 20,
    height: 26,
    backgroundColor: "#8BFF6B",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#7AEE5A",
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
  rouletteCard: {
    backgroundColor: "#FF6B8B",
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  rouletteContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  badgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  rouletteTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  rouletteSubtitle: {
    fontSize: 14,
    color: "#FFE5EC",
    fontWeight: "500",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cardSpot: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 100,
  },
  spotTopRight: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  spotBottomLeft: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -20,
  },
  recentBooksSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3436",
    marginRight: 10,
  },
  bookCountBadge: {
    backgroundColor: "#FFE5EC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD4E1",
  },
  bookCountText: {
    color: "#FF6B8B",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#8B7355",
  },
  sliderWrapper: {
    marginBottom: 20,
  },
  progressBarn: {
    marginHorizontal: 20,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  barnRoof: {
    height: 40,
    backgroundColor: "#D2691E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "relative",
  },
  barnRoofPeak: {
    position: "absolute",
    top: -15,
    left: "50%",
    marginLeft: -30,
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#D2691E",
  },
  barnBody: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#F5E6D3",
  },
  barnTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  barnDescription: {
    fontSize: 14,
    color: "#8B7355",
    marginBottom: 12,
  },
  barnProgress: {
    height: 8,
    backgroundColor: "#F5E6D3",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  barnProgressFill: {
    height: "100%",
    backgroundColor: "#8BCA5B",
    borderRadius: 4,
  },
  barnProgressText: {
    fontSize: 12,
    color: "#8B7355",
    fontWeight: "500",
    textAlign: "center",
  },
  emptyStateWrapper: {
    paddingHorizontal: 20,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF5F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  cowHead: {
    width: 50,
    height: 40,
    backgroundColor: "#2D3436",
    borderRadius: 25,
    opacity: 0.1,
    position: "relative",
  },
  cowEar1: {
    position: "absolute",
    width: 15,
    height: 20,
    backgroundColor: "#2D3436",
    borderRadius: 10,
    top: -10,
    left: 5,
  },
  cowEar2: {
    position: "absolute",
    width: 15,
    height: 20,
    backgroundColor: "#2D3436",
    borderRadius: 10,
    top: -10,
    right: 5,
  },
  cowSnout: {
    position: "absolute",
    width: 25,
    height: 15,
    backgroundColor: "#FF6B8B",
    borderRadius: 10,
    bottom: 5,
    left: "50%",
    marginLeft: -12.5,
    opacity: 0.3,
  },
  emptyStateTitle: {
    fontSize: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD4E1",
  },
  emptyStateCTAText: {
    color: "#FF6B8B",
    fontSize: 14,
    fontWeight: "600",
  },
});