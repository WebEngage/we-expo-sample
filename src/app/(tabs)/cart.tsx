import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, Field, QuantityStepper, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getProduct } from '@/data/products';
import { money } from '@/utils/format';

export default function Cart() {
  const router = useRouter();
  const { cart, totals, coupon, updateQty, removeFromCart, applyCoupon, removeCoupon, showToast } = useApp();
  const [code, setCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (cart.length === 0) {
    return (
      <EmptyState icon="cart-outline" title="Your cart is empty" subtitle="Looks like you haven't added anything yet.">
        <Button
          title="Shop Now"
          onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: 'all' } })}
          style={{ marginTop: 8 }}
          testID="cart-shop-now"
        />
      </EmptyState>
    );
  }

  const onApply = () => {
    const res = applyCoupon(code);
    setCouponMsg({ ok: res.ok, text: res.message ?? '' });
    if (res.ok) setCode('');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        {cart.map((item) => {
          const p = getProduct(item.productId);
          if (!p) return null;
          return (
            <View key={item.key} style={[card, styles.line]} testID={`cart-line-${item.productId}`}>
              <Image source={{ uri: p.image }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.variant}>{[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}</Text>
                <Text style={styles.price}>{money(p.price * item.qty)}</Text>
                <View style={styles.lineActions}>
                  <QuantityStepper qty={item.qty} onChange={(q) => updateQty(item.key, q)} testID={`cart-qty-${item.productId}`} />
                  <Pressable
                    onPress={() => {
                      removeFromCart(item.key);
                      showToast('Removed from cart');
                    }}
                    hitSlop={8}
                    testID={`cart-remove-${item.productId}`}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <View style={[card, { gap: 10 }]}>
          <Text style={styles.sectionTitle}>Coupon</Text>
          {coupon ? (
            <View style={styles.appliedRow}>
              <Text style={styles.applied}>{coupon} applied</Text>
              <Pressable
                onPress={() => {
                  removeCoupon();
                  setCouponMsg(null);
                }}
                testID="cart-coupon-remove">
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Field label="Have a code?" placeholder="WELCOME10" autoCapitalize="characters" value={code} onChangeText={setCode} testID="cart-coupon-input" />
                </View>
                <Button title="Apply" variant="secondary" onPress={onApply} testID="cart-coupon-apply" />
              </View>
              {couponMsg && <Text style={{ color: couponMsg.ok ? colors.success : colors.danger, fontSize: 13 }}>{couponMsg.text}</Text>}
            </>
          )}
        </View>

        <View style={[card, { gap: 8 }]}>
          <Text style={styles.sectionTitle}>Price details</Text>
          <Row label="Subtotal" value={money(totals.subtotal)} />
          {totals.discount > 0 && <Row label={`Discount (${coupon})`} value={`- ${money(totals.discount)}`} color={colors.success} />}
          <Row label="Shipping" value={totals.shipping === 0 ? 'Free' : money(totals.shipping)} />
          <View style={styles.divider} />
          <Row label="Total" value={money(totals.total)} bold />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal} testID="cart-total">
            {money(totals.total)}
          </Text>
        </View>
        <Button title="Checkout" onPress={() => router.push('/checkout')} style={{ flex: 1 }} testID="cart-checkout" />
      </View>
    </View>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowText, bold && { fontWeight: '800', color: colors.text }]}>{label}</Text>
      <Text style={[styles.rowText, bold && { fontWeight: '800', color: colors.text }, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  line: { flexDirection: 'row', gap: 12 },
  thumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: colors.border },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  variant: { fontSize: 12, color: colors.muted },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
  lineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remove: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  appliedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applied: { color: colors.success, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowText: { color: colors.muted, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLabel: { color: colors.muted, fontSize: 12 },
  footerTotal: { fontSize: 20, fontWeight: '800', color: colors.text },
});
