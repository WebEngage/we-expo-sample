import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CustomDataEditor, resolveCustomData } from '@/components/CustomDataEditor';
import { Button, Field, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Address, CustomAttr, PaymentMethod } from '@/types';
import { money } from '@/utils/format';

const METHODS: { key: PaymentMethod; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Card', icon: 'card-outline' },
  { key: 'UPI', icon: 'phone-portrait-outline' },
  { key: 'Wallet', icon: 'wallet-outline' },
  { key: 'Cash on Delivery', icon: 'cash-outline' },
];

export default function Checkout() {
  const router = useRouter();
  const { cart, totals, coupon, addresses, saveAddress, placeOrder, showToast } = useApp();

  const [selected, setSelected] = useState<string | undefined>(addresses[0]?.id);
  const [adding, setAdding] = useState(addresses.length === 0);
  const [form, setForm] = useState({ name: '', line1: '', city: '', pincode: '', phone: '' });
  const [method, setMethod] = useState<PaymentMethod>('Card');
  const [customData, setCustomData] = useState<CustomAttr[]>([]);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  const saveNewAddress = () => {
    if (!form.name.trim() || !form.line1.trim() || !form.city.trim()) return setError('Name, address and city are required.');
    if (form.pincode.replace(/\D/g, '').length < 5) return setError('Enter a valid pincode.');
    saveAddress(form);
    setForm({ name: '', line1: '', city: '', pincode: '', phone: '' });
    setAdding(false);
    showToast('Address saved');
  };

  // The newest saved address is selected automatically after saving a new one.
  const address: Address | undefined = addresses.find((a) => a.id === selected) ?? addresses[addresses.length - 1];

  const onPlaceOrder = () => {
    if (!address) return setError('Add a delivery address to continue.');
    const extra = resolveCustomData(customData);
    if (!extra) return;
    const order = placeOrder(address, method, extra);
    if (order) router.replace({ pathname: '/order-confirmation/[id]', params: { id: order.id } });
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
        <Button title="Back to shop" onPress={() => router.replace('/')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Delivery address</Text>
        {addresses.map((a) => (
          <Pressable
            key={a.id}
            style={[card, styles.option, (address?.id === a.id) && styles.optionActive]}
            onPress={() => setSelected(a.id)}
            testID={`checkout-address-${a.id}`}>
            <Ionicons name={address?.id === a.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{a.name}</Text>
              <Text style={styles.optionSub}>
                {a.line1}, {a.city} {a.pincode}
              </Text>
            </View>
          </Pressable>
        ))}

        {adding ? (
          <View style={[card, { gap: 12 }]}>
            <Field label="Full name" autoCapitalize="words" value={form.name} onChangeText={set('name')} testID="checkout-name" />
            <Field label="Address" value={form.line1} onChangeText={set('line1')} testID="checkout-line1" />
            <Field label="City" autoCapitalize="words" value={form.city} onChangeText={set('city')} testID="checkout-city" />
            <Field label="Pincode" keyboardType="number-pad" value={form.pincode} onChangeText={set('pincode')} testID="checkout-pincode" />
            <Field label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} testID="checkout-phone" />
            <Button title="Save address" variant="secondary" onPress={saveNewAddress} testID="checkout-save-address" />
          </View>
        ) : (
          <Button title="Add new address" variant="ghost" icon="add" onPress={() => setAdding(true)} testID="checkout-add-address" />
        )}

        <Text style={styles.section}>Payment method</Text>
        {METHODS.map((m) => (
          <Pressable key={m.key} style={[card, styles.option, method === m.key && styles.optionActive]} onPress={() => setMethod(m.key)} testID={`checkout-pay-${m.key}`}>
            <Ionicons name={method === m.key ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.primary} />
            <Ionicons name={m.icon} size={20} color={colors.text} />
            <Text style={styles.optionTitle}>{m.key}</Text>
          </Pressable>
        ))}

        <Text style={styles.section}>Order summary</Text>
        <View style={[card, { gap: 8 }]}>
          <Line label={`Items (${cart.reduce((n, i) => n + i.qty, 0)})`} value={money(totals.subtotal)} />
          {totals.discount > 0 && <Line label={`Discount (${coupon})`} value={`- ${money(totals.discount)}`} color={colors.success} />}
          <Line label="Shipping" value={totals.shipping === 0 ? 'Free' : money(totals.shipping)} />
          <View style={styles.divider} />
          <Line label="Total" value={money(totals.total)} bold />
        </View>

        <CustomDataEditor rows={customData} onChange={setCustomData} testIDPrefix="checkout-custom" />

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={`Place order · ${money(totals.total)}`} onPress={onPlaceOrder} style={{ flex: 1 }} testID="checkout-place-order" />
      </View>
    </View>
  );
}

function Line({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[styles.lineText, bold && { fontWeight: '800', color: colors.text }]}>{label}</Text>
      <Text style={[styles.lineText, bold && { fontWeight: '800', color: colors.text }, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  optionSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  lineText: { color: colors.muted, fontSize: 14 },
  error: { color: colors.danger },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { fontSize: 16, color: colors.muted },
});
