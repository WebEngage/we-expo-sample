import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

/** Static promo strip shown between the categories and the product grid on Home. */
export function PromoBanner() {
  const router = useRouter();
  return (
    <Pressable style={styles.banner} onPress={() => router.push('/cart')} testID="home-promo-banner">
      <View style={styles.icon}>
        <Ionicons name="pricetag" size={22} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Use WELCOME10 at checkout</Text>
        <Text style={styles.sub}>10% off your first order. Free shipping above $100.</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FDE7B0',
    minHeight: 72,
  },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
