import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import type { AttrType, CustomAttr, Payload } from '@/types';
import { uid } from '@/utils/format';

const TYPES: AttrType[] = ['string', 'number', 'boolean', 'date', 'array'];

const PLACEHOLDER: Record<AttrType, string> = {
  string: 'Text value',
  number: '42 or 19.99',
  boolean: '',
  date: 'YYYY-MM-DD',
  array: 'a, b, c',
};

export const newRow = (): CustomAttr => ({ id: uid(), name: '', type: 'string', value: '' });

/** Turns the editor rows into a typed payload. Rows without a name are ignored. */
export function buildPayload(rows: CustomAttr[]): { payload: Payload; errors: string[] } {
  const payload: Payload = {};
  const errors: string[] = [];
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    const raw = row.value.trim();
    switch (row.type) {
      case 'string':
        payload[name] = row.value;
        break;
      case 'number': {
        const n = Number(raw);
        if (raw === '' || Number.isNaN(n)) errors.push(`"${name}" must be a number`);
        else payload[name] = n;
        break;
      }
      case 'boolean':
        payload[name] = row.value === 'true';
        break;
      case 'date': {
        const d = new Date(raw);
        if (raw === '' || Number.isNaN(d.getTime())) errors.push(`"${name}" must be a valid date (YYYY-MM-DD)`);
        else payload[name] = d;
        break;
      }
      case 'array':
        payload[name] = raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
    }
  }
  return { payload, errors };
}

/** Builds the payload, or alerts the first validation problem and returns null. */
export function resolveCustomData(rows: CustomAttr[]): Payload | null {
  const { payload, errors } = buildPayload(rows);
  if (errors.length) {
    Alert.alert('Check custom data', errors.join('\n'));
    return null;
  }
  return payload;
}

interface Props {
  rows: CustomAttr[];
  onChange: (rows: CustomAttr[]) => void;
  title?: string;
  defaultOpen?: boolean;
  testIDPrefix?: string;
}

export function CustomDataEditor({ rows, onChange, title = 'Add custom data', defaultOpen = false, testIDPrefix = 'custom-data' }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const update = (id: string, patch: Partial<CustomAttr>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const setType = (id: string, type: AttrType) =>
    update(id, { type, value: type === 'boolean' ? 'false' : '' });

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((o) => !o)} testID={`${testIDPrefix}-toggle`}>
        <Ionicons name={open ? 'chevron-down' : 'add-circle-outline'} size={18} color={colors.primary} />
        <Text style={styles.headerText}>
          {title}
          {rows.length > 0 ? ` (${rows.length})` : ''}
        </Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {rows.map((row, i) => (
            <View key={row.id} style={styles.row}>
              <View style={styles.rowTop}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Attribute name"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={row.name}
                  onChangeText={(name) => update(row.id, { name })}
                  testID={`${testIDPrefix}-name-${i}`}
                />
                <Pressable onPress={() => onChange(rows.filter((r) => r.id !== row.id))} hitSlop={8} testID={`${testIDPrefix}-remove-${i}`}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.types}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(row.id, t)}
                    style={[styles.typeChip, row.type === t && styles.typeChipActive]}
                    testID={`${testIDPrefix}-type-${i}-${t}`}>
                    <Text style={[styles.typeText, row.type === t && styles.typeTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              {row.type === 'boolean' ? (
                <View style={styles.boolRow}>
                  <Text style={styles.boolLabel}>{row.value === 'true' ? 'true' : 'false'}</Text>
                  <Switch
                    value={row.value === 'true'}
                    onValueChange={(v) => update(row.id, { value: v ? 'true' : 'false' })}
                    testID={`${testIDPrefix}-value-${i}`}
                  />
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder={PLACEHOLDER[row.type]}
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={row.type === 'number' ? 'numbers-and-punctuation' : 'default'}
                  value={row.value}
                  onChangeText={(value) => update(row.id, { value })}
                  testID={`${testIDPrefix}-value-${i}`}
                />
              )}
            </View>
          ))}

          <Pressable style={styles.addBtn} onPress={() => onChange([...rows, newRow()])} testID={`${testIDPrefix}-add`}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.headerText}>Add attribute</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  headerText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  body: { paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  row: { gap: 8, padding: 10, borderRadius: radius.sm, backgroundColor: colors.bg },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 14,
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 12, color: colors.muted },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  boolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  boolLabel: { color: colors.text, fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
});
