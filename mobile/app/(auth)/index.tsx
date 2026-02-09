import { router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function AuthIndex() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (session) {
      router.replace('/(tabs)/(home)/home');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [session, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <ActivityIndicator size="large" color="#fc647c" />
    </View>
  );
}