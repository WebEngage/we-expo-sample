import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { OptIns } from '@/types';

const CHANNELS: { key: keyof OptIns; label: string; hint: string }[] = [
  { key: 'push', label: 'Push notifications', hint: 'Order updates, offers and reminders on this device' },
  { key: 'email', label: 'Email', hint: 'Receipts, newsletters and offers' },
  { key: 'sms', label: 'SMS', hint: 'Delivery alerts and time-sensitive offers' },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'Order updates and support on WhatsApp' },
];

export default function NotificationSettings() {
  const { optIns, setOptIn } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Choose how WE Shop can reach you.</Text>
      <View style={[card, { padding: 0 }]}>
        {CHANNELS.map((c, i) => (
          <View key={c.key} style={[styles.row, i < CHANNELS.length - 1 && styles.border]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={styles.hint}>{c.hint}</Text>
            </View>
            <Switch value={optIns[c.key]} onValueChange={(v) => setOptIn(c.key, v)} testID={`settings-${c.key}`} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  intro: { color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
