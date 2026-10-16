import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatDate, money } from '@/utils/format';

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useApp();
  const order = orders.find((o) => o.id === id);

  if (!order) return <EmptyState icon="alert-circle-outline" title="Order not found" />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[card, { gap: 4 }]}>
        <Text style={styles.title}>Order #{order.id}</Text>
        <Text style={styles.sub}>
          {formatDate(order.createdAt)} · {order.status}
        </Text>
      </View>

      <View style={[card, { gap: 12 }]}>
        {order.items.map((i) => (
          <View key={i.productId + (i.size ?? '') + (i.color ?? '')} style={styles.item}>
            <Image source={{ uri: i.image }} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={2}>
                {i.name}
              </Text>
              <Text style={styles.sub}>{[i.size && `Size ${i.size}`, i.color, `Qty ${i.qty}`].filter(Boolean).join(' · ')}</Text>
            </View>
            <Text style={styles.itemPrice}>{money(i.price * i.qty)}</Text>
          </View>
        ))}
      </View>

      <View style={[card, { gap: 6 }]}>
        <Text style={styles.sectionTitle}>Delivery address</Text>
        <Text style={styles.sub}>
          {order.address.name}, {order.address.line1}, {order.address.city} {order.address.pincode}
        </Text>
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Payment</Text>
        <Text style={styles.sub}>{order.paymentMethod}</Text>
      </View>

      <View style={[card, { gap: 8 }]}>
        <Row label="Subtotal" value={money(order.subtotal)} />
        {order.discount > 0 && <Row label={`Discount (${order.coupon})`} value={`- ${money(order.discount)}`} />}
        <Row label="Shipping" value={order.shipping === 0 ? 'Free' : money(order.shipping)} />
        <Row label="Total" value={money(order.total)} bold />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[styles.sub, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.sub, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, fontSize: 13 },
  sectionTitle: { fontWeight: '700', color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.border },
  itemName: { fontWeight: '600', color: colors.text },
  itemPrice: { fontWeight: '700', color: colors.text },
  bold: { fontWeight: '800', color: colors.text, fontSize: 15 },
});
