import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WebEngageManager from '@/analytics/WebEngageManager';
import { ToastHost } from '@/components/ToastHost';
import { colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const { hydrated, user } = useApp();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // The navigator stays mounted while state loads; the native splash screen covers the gap.
  const signedIn = user !== null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Log in' }} />
        <Stack.Screen name="signup" options={{ title: 'Create account' }} />
      </Stack.Protected>

      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: '' }} />
        <Stack.Screen name="category/[slug]" options={{ title: 'Products' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="order-confirmation/[id]" options={{ title: 'Order placed', headerBackVisible: false }} />
        <Stack.Screen name="orders/index" options={{ title: 'My orders' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Order details' }} />
        <Stack.Screen name="wishlist" options={{ title: 'Wishlist' }} />
        <Stack.Screen name="addresses" options={{ title: 'Saved addresses' }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="notification-settings" options={{ title: 'Notification settings' }} />
        <Stack.Screen name="inbox" options={{ title: 'Notifications' }} />
        <Stack.Screen name="push-test" options={{ title: 'Extension test' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    WebEngageManager.init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Navigator />
          <ToastHost />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
