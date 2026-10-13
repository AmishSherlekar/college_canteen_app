import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ActivityIndicator, View } from 'react-native';

function RootGuard() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments as string[])[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login' as any);
    } else {
      if (inAuthGroup) {
        const role = profile?.role ?? 'student';
        if (role === 'staff') {
          router.replace('/(tabs)/scanner' as any);
        } else {
          router.replace('/(tabs)/home' as any);
        }
      }
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1F1A' }}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootGuard />
      </CartProvider>
    </AuthProvider>
  );
}
