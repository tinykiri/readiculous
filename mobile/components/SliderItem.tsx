import { memo } from "react";
import { Book } from "@/src/types";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useRouter } from "expo-router";

type SliderItemProps = Book & {
  scrollX: SharedValue<number>;
  index: number;
  photoUrl?: string;
  book_id: number;
};

const { width } = Dimensions.get('screen');

function SliderItem({ title, photoUrl, author, index, scrollX, book_id }: SliderItemProps) {
  const router = useRouter();

  const rnAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [width * -0.25, 0, width * 0.25],
            Extrapolate.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.9, 1, 0.9],
            Extrapolate.CLAMP
          )
        }
      ]
    }
  });

  return (
    <Animated.View style={[styles.itemContainer, rnAnimatedStyle]}>
      <TouchableOpacity onPress={() => router.push(`/book/${book_id}`)}>
        {
          photoUrl && photoUrl !== '' ? (
            <Image src={photoUrl} style={styles.image} />
          ) : (
            <Image source={require("@/assets/images/no-book-cover.png")} style={styles.image} />
          )
        }
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.author}>by {author}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  itemContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    width: width,
  },
  image: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: '#F5E6D3',
    borderRadius: 20
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  author: {
    fontSize: 16,
    color: '#8B7355'
  }
});

export default memo(SliderItem);