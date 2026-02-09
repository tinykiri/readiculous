import { Animated, View } from "react-native";

export const Skeleton = ({ width, height, style }: { width: number | string, height: number, style?: any }) => {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#F5E6D3',
          borderRadius: 8,
          overflow: 'hidden'
        },
        style
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        }}
      />
    </View>
  );
};