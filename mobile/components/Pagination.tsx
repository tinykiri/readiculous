import { Book } from "@/src/types";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";

type PaginationProps = {
  items: Book[];
  pagindationIndex: number;
  scrollX: SharedValue<number>;
}

const { width } = Dimensions.get('screen');

function PaginationDot({
  index,
  pagindationIndex,
  scrollX
}: {
  index: number;
  pagindationIndex: number;
  scrollX: SharedValue<number>;
}) {
  const pgAnimationStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [8, 14, 8],
      Extrapolate.CLAMP
    );

    return {
      width: dotWidth,
    }
  });

  return (
    <Animated.View
      style={[
        styles.dots,
        pgAnimationStyle,
        { backgroundColor: pagindationIndex === index ? 'white' : '#787878' }
      ]}
    />
  );
}

export default function Pagination({ items, pagindationIndex, scrollX }: PaginationProps) {

  return (
    <View style={styles.container}>
      {items.map((_, index) => (
        <PaginationDot
          key={index}
          index={index}
          pagindationIndex={pagindationIndex}
          scrollX={scrollX}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    backgroundColor: "#787878",
    height: 8,
    width: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
});