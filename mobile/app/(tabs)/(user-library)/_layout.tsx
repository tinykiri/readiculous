import { SearchProvider } from "@/components/shared/SearchContextType";
import { Stack } from "expo-router";

const UserLibraryLayout = () => {
  return (
    <SearchProvider>
      <Stack>
        <Stack.Screen
          name="user-library"
          options={{
            headerShown: true,
            headerLargeTitle: true,
            headerLargeTitleStyle: {
              fontFamily: 'System',
              fontSize: 34,
              fontWeight: '700',
              color: '#2D3436',
            },
            headerTitle: 'Your Library',
            headerTitleStyle: {
              fontFamily: 'System',
              fontSize: 17,
              fontWeight: '600',
              color: '#2D3436',
            },
            headerStyle: {
              backgroundColor: '#FFF8F3',
            },
            headerTintColor: '#FF6B8B',
            headerShadowVisible: false,
            headerBlurEffect: 'light',
            headerTransparent: false,
            headerBackTitle: 'Back',
            headerBackTitleStyle: {
              fontFamily: 'System',
              fontSize: 16,
            },
          }}
        />
      </Stack>
    </SearchProvider>
  );
};

export default UserLibraryLayout;