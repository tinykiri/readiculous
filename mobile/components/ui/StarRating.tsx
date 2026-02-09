import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconSymbol } from "./IconSymbol";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  size = 22,
  color = "#f1c40f",
  emptyColor = "#E0E0E0",
  readonly = true,
  onRatingChange,
}: StarRatingProps) {
  const [currentRating, setCurrentRating] = useState(rating);

  const displayRating = readonly ? rating : currentRating;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  const handlePress = (index: number, isHalf: boolean) => {
    if (readonly) return;

    const newRating = isHalf ? index + 0.5 : index + 1;
    setCurrentRating(newRating);
    onRatingChange?.(newRating);
  };

  const renderStar = (index: number) => {
    let iconName: "star.fill" | "star.leadinghalf.filled" | "star" = "star";
    let iconColor = emptyColor;

    if (index < fullStars) {
      iconName = "star.fill";
      iconColor = color;
    } else if (index === fullStars && hasHalfStar) {
      iconName = "star.leadinghalf.filled";
      iconColor = color;
    }

    if (readonly) {
      return (
        <IconSymbol
          key={index}
          name={iconName}
          size={size}
          color={iconColor}
        />
      );
    }

    return (
      <View key={index} style={styles.starTouchArea}>
        <TouchableOpacity
          onPress={() => handlePress(index, true)}
          style={styles.halfTouch}
          activeOpacity={0.7}
        />
        <TouchableOpacity
          onPress={() => handlePress(index, false)}
          style={styles.halfTouch}
          activeOpacity={0.7}
        />
        <View style={styles.starIcon} pointerEvents="none">
          <IconSymbol
            name={iconName}
            size={size}
            color={iconColor}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 2,
  },
  starTouchArea: {
    position: "relative",
    flexDirection: "row",
  },
  halfTouch: {
    width: 14,
    height: 30,
    zIndex: 1,
  },
  starIcon: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
