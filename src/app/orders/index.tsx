import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, card } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatDate, money } from '@/utils/format';

export default function Orders() {
  const router = useRouter();
  const { orders } = useApp();

  if (orders.length === 0) {
    return (
      <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Your orders will show up here.">
        <Button title="Start shopping" onPress={() => router.replace('/')} style={{ marginTop: 8 }} />
      </EmptyState>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {orders.map((o) => (
        <Pressable
          key={o.id}
          style={[card, { gap: 10 }]}
          onPress={() => router.push({ pathname: '/orders/[id]', params: { id: o.id } })}
          testID={`order-row-${o.id}`}>
          <View style={styles.head}>
            <Text style={styles.id}>#{o.id}</Text>
            <View style={styles.status}>
              <Text style={styles.statusText}>{o.status}</Text>
            </View>
          </View>
          <View style={styles.thumbs}>
            {o.items.slice(0, 4).map((i) => (
              <Image key={i.productId + (i.size ?? '') + (i.color ?? '')} source={{ uri: i.image }} style={styles.thumb} contentFit="cover" />
            ))}
          </View>
          <Text style={styles.meta}>
            {formatDate(o.createdAt)} · {o.items.length} item(s) · {money(o.total)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontWeight: '800', color: colors.text },
  status: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  statusText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  thumbs: { flexDirection: 'row', gap: 8 },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.border },
  meta: { color: colors.muted, fontSize: 13 },
});
