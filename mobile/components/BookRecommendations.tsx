import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useBookRecommendations } from '../hooks/useBookRecommendations';

interface Props {
  userId: string;
}

interface ParsedBook {
  googleId: string;
  title: string;
  author: string;
  description?: string;
  thumbnail?: string;
  categories: string[];
  averageRating?: number;
  pageCount?: number;
  publishedDate?: string;
  language?: string;
  publisher?: string;
  matchReason?: string;
}

export const BookRecommendations: React.FC<Props> = ({ userId }) => {
  const { recommendations, loading, userPreferences, getSmartRecommendations } =
    useBookRecommendations(userId);

  useEffect(() => {
    if (userId) {
      getSmartRecommendations();
    }
  }, [userId, getSmartRecommendations]);

  const renderRecommendation = ({ item }: { item: ParsedBook }) => (
    <TouchableOpacity style={styles.bookCard}>
      {item.thumbnail && (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author}>{item.author}</Text>
        {item.averageRating && (
          <Text style={styles.rating}>⭐ {item.averageRating.toFixed(1)}</Text>
        )}
        <Text style={styles.matchReason} numberOfLines={2}>
          {item.matchReason}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconContainer}>
          <View style={styles.cowSpot1} />
          <View style={styles.cowSpot2} />
          <ActivityIndicator size="large" color="#FF6B8B" />
        </View>
        <Text style={styles.loadingText}>Finding books you’ll love…</Text>
        <Text style={styles.loadingSubText}>Matching your reading taste</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Recommendations Section */}
      <View style={styles.recommendationsBlock}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        {recommendations.length > 0 ? (
          <FlatList
            data={recommendations}
            renderItem={renderRecommendation}
            keyExtractor={(item) => item.googleId}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        ) : (
          <Text style={styles.noRecommendations}>
            Rate more books to unlock smart recommendations!
          </Text>
        )}
      </View>

      {/* Refresh */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={getSmartRecommendations}
      >
        <Text style={styles.refreshButtonText}>Refresh Recommendations</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFF8F3",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#FFF8F3",
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
    opacity: 0.08,
  },
  cowSpot2: {
    position: "absolute",
    width: 15,
    height: 12,
    backgroundColor: "#2D3436",
    borderRadius: 8,
    bottom: 12,
    right: 18,
    opacity: 0.08,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
  },
  loadingSubText: {
    fontSize: 14,
    color: "#8B7355",
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F5E6D3",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  cowSpotDecor: {
    position: "absolute",
    backgroundColor: "rgba(255, 107, 139, 0.13)",
    borderRadius: 50,
  },
  spotTop: {
    width: 80,
    height: 80,
    top: -20,
    right: 20,
  },
  spotBottom: {
    width: 50,
    height: 50,
    bottom: -15,
    left: 35,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 12,
  },
  insight: {
    fontSize: 14,
    color: "#8B7355",
    marginBottom: 4,
  },
  recommendationsBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3436",
    marginLeft: 20,
    marginBottom: 14,
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: 150,
    padding: 12,
    marginRight: 14,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  thumbnail: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#FFF5F7",
  },
  bookInfo: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: "#8B7355",
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: "#FFA500",
    marginBottom: 4,
  },
  matchReason: {
    fontSize: 10,
    color: "#8B7355",
    fontStyle: "italic",
  },
  noRecommendations: {
    textAlign: "center",
    color: "#8B7355",
    fontSize: 14,
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: "#FF6B8B",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    height: 60,
    marginHorizontal: 20,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
