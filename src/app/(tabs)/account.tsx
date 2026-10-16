import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

type IconName = keyof typeof Ionicons.glyphMap;

export default function Account() {
  const router = useRouter();
  const { user, isGuest, logout, orders, wishlist, unreadCount } = useApp();

  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'G';

  const items: { icon: IconName; label: string; detail?: string; href: string; guestHidden?: boolean; testID: string }[] = [
    { icon: 'person-outline', label: 'Edit profile', href: '/profile-edit', guestHidden: true, testID: 'account-profile' },
    { icon: 'receipt-outline', label: 'My orders', detail: `${orders.length}`, href: '/orders', testID: 'account-orders' },
    { icon: 'heart-outline', label: 'Wishlist', detail: `${wishlist.length}`, href: '/wishlist', testID: 'account-wishlist' },
    { icon: 'location-outline', label: 'Saved addresses', href: '/addresses', testID: 'account-addresses' },
    { icon: 'notifications-outline', label: 'Notifications', detail: unreadCount ? `${unreadCount} new` : undefined, href: '/inbox', testID: 'account-inbox' },
    { icon: 'options-outline', label: 'Notification settings', href: '/notification-settings', testID: 'account-notification-settings' },
  ];

  const onLogout = () =>
    Alert.alert(isGuest ? 'Leave guest session?' : 'Log out?', isGuest ? 'Your cart will be cleared.' : undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: isGuest ? 'Leave' : 'Log out', style: 'destructive', onPress: logout },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[card, styles.profile]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} testID="account-name">
            {isGuest ? 'Guest' : `${user?.firstName} ${user?.lastName}`.trim()}
          </Text>
          <Text style={styles.email}>{isGuest ? 'Browsing without an account' : user?.email}</Text>
        </View>
      </View>

      {isGuest && (
        <View style={[card, { gap: 10 }]}>
          <Text style={styles.cta}>Log in to save your orders, wishlist and addresses.</Text>
          <Button title="Log in or sign up" onPress={logout} testID="account-login-signup" />
        </View>
      )}

      <View style={[card, { padding: 0 }]}>
        {items
          .filter((i) => !(isGuest && i.guestHidden))
          .map((item, idx, arr) => (
            <Pressable
              key={item.label}
              style={[styles.item, idx < arr.length - 1 && styles.itemBorder]}
              onPress={() => router.push(item.href as never)}
              testID={item.testID}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={styles.itemLabel}>{item.label}</Text>
              {item.detail && <Text style={styles.itemDetail}>{item.detail}</Text>}
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
      </View>

      {!isGuest && <Button title="Log out" variant="danger" icon="log-out-outline" onPress={onLogout} testID="account-logout" />}
      {isGuest && <Button title="Leave guest session" variant="ghost" onPress={onLogout} testID="account-logout" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  email: { color: colors.muted, marginTop: 2 },
  cta: { color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemLabel: { flex: 1, fontSize: 15, color: colors.text },
  itemDetail: { color: colors.muted, fontSize: 13 },
});
