import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface RotatingLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export default function RotatingLoader({
  message = "Loading...",
  subMessage = "Please wait",
  fullScreen = true,
}: RotatingLoaderProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const content = (
    <View style={styles.loadingContent}>
      <View style={styles.loadingIconContainer}>
        <Animated.Image
          source={require("@/assets/images/loading-icon.png")}
          style={[styles.loadingIcon, animatedStyle]}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.loadingText}>{message}</Text>
      <Text style={styles.loadingSubtext}>{subMessage}</Text>
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenContainer}>{content}</View>;
  }

  return <View style={styles.overlayContainer}>{content}</View>;
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 243, 0.95)",
    zIndex: 999,
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
  },
  loadingIcon: {
    width: 40,
    height: 40,
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
});
