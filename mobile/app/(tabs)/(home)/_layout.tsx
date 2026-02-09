import { Stack } from "expo-router";

const HomeLayout = () => {

  return (
    <Stack>
      <Stack.Screen
        name="home"
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            fontFamily: "System",
            fontSize: 34,
            fontWeight: "700",
            color: "#2D3436",
          },
          headerTitle: "Readiculous",
          headerBlurEffect: "light",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "600",
            color: "#2D3436",
          },
          headerStyle: {
            backgroundColor: '#FFF8F3',
          },
          headerShadowVisible: false,
          headerTintColor: "#FF6B8B",
        }}
      />
    </Stack>
  );
};

export default HomeLayout;