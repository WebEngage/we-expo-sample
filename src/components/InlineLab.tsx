import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type InlinePlacement } from '@/analytics/inlinePlacements';
import { InlineCustomSlot, InlineWidgetSlot, type InlineStatus } from '@/components/InlineSlots';
import { card } from '@/components/ui';
import { colors } from '@/constants/theme';

const STATUS_TEXT: Record<InlineStatus, string> = {
  waiting: 'Waiting for a campaign',
  data: 'Data received',
  rendered: 'Rendered',
  exception: 'Placeholder exception: handled, nothing shown',
};

const STATUS_COLOR: Record<InlineStatus, string> = {
  waiting: colors.muted,
  data: colors.primary,
  rendered: colors.success,
  exception: colors.danger,
};

/** A screen that hosts exactly one In-Line placement from the dashboard, with the facts needed to check it. */
export function InlineLab({ placement, blurb }: { placement: InlinePlacement; blurb: string }) {
  const [status, setStatus] = useState<InlineStatus>('waiting');
  const pid = Platform.OS === 'ios' ? `${placement.iosPropertyId} (iOS)` : `${placement.androidPropertyId} (Android)`;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.blurb}>{blurb}</Text>

      <View style={[card, styles.facts]}>
        <Fact k="Screen name" v={placement.screenName} />
        <Fact k="Placeholder" v={pid} />
        <Fact k="Campaign" v={placement.campaign} />
        <Fact k="Type" v={placement.label} />
        <View style={styles.factRow}>
          <Text style={styles.key}>Status</Text>
          <Text style={[styles.val, { color: STATUS_COLOR[status] }]} testID="inline-status">
            {STATUS_TEXT[status]}
          </Text>
        </View>
      </View>

      {placement.kind === 'custom' ? (
        <InlineCustomSlot placement={placement} onStatus={setStatus} />
      ) : (
        <InlineWidgetSlot placement={placement} onStatus={setStatus} />
      )}
    </ScrollView>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.key}>{k}</Text>
      <Text style={styles.val}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  blurb: { color: colors.muted, fontSize: 13 },
  facts: { gap: 8 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  key: { color: colors.muted, fontSize: 13 },
  val: { color: colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
});
