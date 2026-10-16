import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, Field, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const EMPTY = { name: '', line1: '', city: '', pincode: '', phone: '' };

export default function Addresses() {
  const { addresses, saveAddress, removeAddress, showToast } = useApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const set = (k: keyof typeof EMPTY) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  const onSave = () => {
    if (!form.name.trim() || !form.line1.trim() || !form.city.trim()) return setError('Name, address and city are required.');
    if (form.pincode.replace(/\D/g, '').length < 5) return setError('Enter a valid pincode.');
    saveAddress(form);
    setForm(EMPTY);
    setAdding(false);
    showToast('Address saved');
  };

  const onDelete = (id: string) =>
    Alert.alert('Delete address?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAddress(id) },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {addresses.length === 0 && !adding && <EmptyState icon="location-outline" title="No saved addresses" />}

      {addresses.map((a) => (
        <View key={a.id} style={[card, styles.row]} testID={`address-${a.id}`}>
          <Ionicons name="location-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{a.name}</Text>
            <Text style={styles.sub}>
              {a.line1}, {a.city} {a.pincode}
            </Text>
            {!!a.phone && <Text style={styles.sub}>{a.phone}</Text>}
          </View>
          <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => onDelete(a.id)} testID={`address-delete-${a.id}`} />
        </View>
      ))}

      {adding ? (
        <View style={[card, { gap: 12 }]}>
          <Field label="Full name" autoCapitalize="words" value={form.name} onChangeText={set('name')} testID="address-name" />
          <Field label="Address" value={form.line1} onChangeText={set('line1')} testID="address-line1" />
          <Field label="City" autoCapitalize="words" value={form.city} onChangeText={set('city')} testID="address-city" />
          <Field label="Pincode" keyboardType="number-pad" value={form.pincode} onChangeText={set('pincode')} testID="address-pincode" />
          <Field label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} testID="address-phone" />
          {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancel" variant="secondary" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Button title="Save" onPress={onSave} style={{ flex: 1 }} testID="address-save" />
          </View>
        </View>
      ) : (
        <Button title="Add new address" icon="add" onPress={() => setAdding(true)} testID="address-add" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
