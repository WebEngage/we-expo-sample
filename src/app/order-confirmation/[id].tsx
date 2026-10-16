import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { money } from '@/utils/format';

export default function OrderConfirmation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders } = useApp();
  const order = orders.find((o) => o.id === id);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="checkmark-circle" size={84} color={colors.success} />
        <Text style={styles.title}>Thank you for your order!</Text>
        <Text style={styles.sub}>
          Order <Text style={styles.bold} testID="confirmation-order-id">{id}</Text> has been placed.
        </Text>
      </View>

      {order && (
        <View style={[card, { gap: 8 }]}>
          <Text style={styles.bold}>
            {order.items.length} item(s) · {money(order.total)}
          </Text>
          <Text style={styles.sub}>Paying with {order.paymentMethod}</Text>
          <Text style={styles.sub}>
            Delivering to {order.address.name}, {order.address.line1}, {order.address.city}
          </Text>
        </View>
      )}

      <Button
        title="View order"
        variant="secondary"
        onPress={() => router.replace({ pathname: '/orders/[id]', params: { id } })}
        testID="confirmation-view-order"
      />
      <Button title="Continue shopping" onPress={() => router.replace('/')} testID="confirmation-continue" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, textAlign: 'center' },
  bold: { fontWeight: '700', color: colors.text },
});
