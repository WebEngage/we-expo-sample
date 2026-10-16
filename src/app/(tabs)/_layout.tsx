import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

type IconName = keyof typeof Ionicons.glyphMap;

const tabIcon = (name: IconName, focused: IconName) =>
  function TabIcon({ color, size, focused: isFocused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={isFocused ? focused : name} size={size} color={color} />;
  };

function InboxButton() {
  const router = useRouter();
  const { unreadCount } = useApp();
  return (
    <Pressable onPress={() => router.push('/inbox')} style={styles.bell} hitSlop={8} testID="home-inbox-button">
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} testID="home-inbox-badge">
            {unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function TabsLayout() {
  const { cartCount } = useApp();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'WE Shop',
          tabBarLabel: 'Home',
          tabBarButtonTestID: 'tab-home',
          tabBarIcon: tabIcon('home-outline', 'home'),
          headerRight: () => <InboxButton />,
          headerRightContainerStyle: { paddingRight: 16 },
        }}
      />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarButtonTestID: 'tab-search', tabBarIcon: tabIcon('search-outline', 'search') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarButtonTestID: 'tab-cart',
          tabBarIcon: tabIcon('cart-outline', 'cart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarButtonTestID: 'tab-account', tabBarIcon: tabIcon('person-outline', 'person') }} />
      <Tabs.Screen name="test-lab" options={{ title: 'Test Lab', tabBarButtonTestID: 'tab-test-lab', tabBarIcon: tabIcon('flask-outline', 'flask') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bell: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
