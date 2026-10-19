// Must stay first: defines the Android background push task at module scope.
import '@/analytics/webengageBackgroundTask';

import { Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setTrackedScreen } from '@/analytics/inlinePlacements';
import { setDeepLinkReady } from '@/analytics/routeDeepLink';
import { SIGNED_OUT_SCREENS, screenDataFor, screenNameFor } from '@/analytics/screens';
import WebEngageManager from '@/analytics/WebEngageManager';
import { enableDevMode as enableInboxDevMode, initWENotificationInbox } from '@/analytics/webengageInbox';
import { enableDevMode as enablePersonalizationDevMode, initWePersonalization } from '@/analytics/webengagePersonalization';
import { useWebEngageAndroidPush } from '@/analytics/useWebEngageAndroidPush';
import { InlinePrimer } from '@/components/InlineSlots';
import { ToastHost } from '@/components/ToastHost';
import { colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const { hydrated, user, cart, totals, coupon, isGuest, orders } = useApp();
  const pathname = usePathname();
  const segments = useSegments();
  const routeKey = segments.join('/');

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Latest values for Screen Data, read when a screen is tracked (not a trigger).
  const screenCtx = useRef({ cart, cartTotal: totals.total, coupon, isGuest, orders });
  useEffect(() => {
    screenCtx.current = { cart, cartTotal: totals.total, coupon, isGuest, orders };
  });

  // Screen tracking: one call per route, from the root layout. Held back until the
  // stored session has loaded, and until the route matches the sign-in state, so the
  // transient launch redirects are never reported.
  const lastTracked = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!hydrated) return;
    const name = screenNameFor(segments, pathname);
    if (!name || lastTracked.current === pathname) return;
    if (SIGNED_OUT_SCREENS.includes(name) === (user !== null)) return;
    lastTracked.current = pathname;
    WebEngageManager.trackScreen(name, screenDataFor(name, pathname, screenCtx.current));
    setTrackedScreen(name); // In-Line placements mount only after screen() has named their screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, pathname, routeKey, user]);

  // A push or in-app link tapped before the navigator is usable is held until now.
  useEffect(() => {
    setDeepLinkReady(hydrated && user !== null);
  }, [hydrated, user]);

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
        <Stack.Screen name="inline/screen1" options={{ title: 'Screen 1 · Text view' }} />
        <Stack.Screen name="inline/screen3" options={{ title: 'Screen 3 · Custom view' }} />
        <Stack.Screen name="inline/screen4" options={{ title: 'Screen 4 · Throws' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    WebEngageManager.init();
    WebEngageManager.registerCallbacks();
    initWePersonalization();
    initWENotificationInbox();
    if (__DEV__) {
      enablePersonalizationDevMode();
      enableInboxDevMode();
    }
  }, []);
  useWebEngageAndroidPush();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <InlinePrimer />
          <Navigator />
          <ToastHost />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
