import React, { useEffect, useRef, useState, useCallback } from "react";
import { Dimensions, View, ViewToken } from "react-native";
import { Book } from "../src/types";
import SliderItem from "./SliderItem";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue
} from "react-native-reanimated";
import Pagination from "./Pagination";

const { width } = Dimensions.get('screen');

export default function Slider({ data }: { data: Book[] }) {
  const [sliderData, setSliderData] = useState(data);
  const [paginationIndex, setPaginationIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const ref = useAnimatedRef<Animated.FlatList<any>>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const offset = useSharedValue(0);

  useEffect(() => {
    setSliderData(data);
  }, [data]);

  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
    onMomentumEnd: (e) => {
      offset.value = e.contentOffset.x;
    }
  });

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [offset, width, sliderData.length]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (
        viewableItems[0]?.index !== undefined &&
        viewableItems[0]?.index !== null
      ) {
        setPaginationIndex(viewableItems[0].index % data.length);
      }
    }
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig,
      onViewableItemsChanged: onViewableItemsChanged.current,
    },
  ]);

  const renderItem = useCallback(({ item, index }: { item: Book, index: number }) => {
    return (
      <SliderItem
        id={item.id}
        book_id={item.id}
        index={index}
        title={item.title}
        author={item.author}
        photoUrl={item.photo_url}
        scrollX={scrollX}
      />
    );
  }, [scrollX]);

  const keyExtractor = useCallback((_: any, index: number) => index.toString(), []);

  const handleEndReached = useCallback(() => {
    setSliderData(prevData => [...prevData, ...data]);
  }, [data]);

  return (
    <View>
      <Animated.FlatList
        data={sliderData}
        ref={ref}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={onScrollHandler}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
      />
      <Pagination
        items={data}
        pagindationIndex={paginationIndex}
        scrollX={scrollX}
      />
    </View>
  );
}