import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8F3' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FF6B8B',
          tabBarInactiveTintColor: '#B8C0CC',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          tabBarLabelStyle: {
            fontFamily: 'System',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}>
        <Tabs.Screen
          name="(home)"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={{
                padding: 8,
                borderRadius: 16,
                backgroundColor: focused ? '#FFE5EC' : 'transparent',
              }}>
                <IconSymbol
                  size={24}
                  name="house.fill"
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(add-new-book)"
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('add-new-book');
            },
          })}
          options={{
            title: '',
            tabBarIcon: ({ color }) => (
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FF6B8B',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                shadowColor: '#FF6B8B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}>
                <IconSymbol
                  size={28}
                  name="plus"
                  color="#FFFFFF"
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(user-library)"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <View style={{
                padding: 8,
                borderRadius: 16,
                backgroundColor: focused ? '#FFE5EC' : 'transparent',
              }}>
                <IconSymbol
                  size={24}
                  name="books.vertical.fill"
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}