import { useIsFocused } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { webengageAvailable } from '@/analytics/WebEngageManager';
import {
  type InlinePlacement,
  propertyIdFor,
  useTrackedScreen,
} from '@/analytics/inlinePlacements';
import {
  WEInlineWidget,
  deregisterWEPlaceholderCallback,
  registerWEPlaceholderCallback,
  trackClick,
  trackImpression,
} from '@/analytics/webengagePersonalization';
import { card } from '@/components/ui';
import { colors } from '@/constants/theme';

export type InlineStatus = 'waiting' | 'data' | 'rendered' | 'exception';

/** An In-Line placement is live only while its screen is in front AND `screen()` has already been
 *  reported with that screen's own name. Leaving the screen unmounts it, which also removes it from the
 *  SDK's registry, so two screens are never registered at once. */
function useInlineLive(p: InlinePlacement): boolean {
  const focused = useIsFocused();
  const tracked = useTrackedScreen();
  return webengageAvailable && focused && tracked === p.screenName;
}

/** Android's plugin only starts following screen changes once its first native widget has been created, so a
 *  `screen()` sent before any widget exists (the launch screen) is missed and that screen's placement never
 *  registers. This zero-size widget, mounted for the life of the app, makes sure one exists before then. It
 *  uses a reserved name no campaign targets. */
export function InlinePrimer() {
  if (!webengageAvailable) return null;
  return (
    <View pointerEvents="none" style={styles.primer}>
      <WEInlineWidget
        androidPropertyId="we_inline_primer"
        iosPropertyId={1000001}
        screenName="we_inline_primer"
        style={{ height: 1, width: 1 }}
        onPlaceholderException={() => {}}
      />
    </View>
  );
}

interface SlotProps {
  placement: InlinePlacement;
  onStatus?: (s: InlineStatus) => void;
}

/** Banner, Text and campaigns that may throw: drawn by the SDK's own widget. Hidden until a campaign has
 *  actually rendered, and hidden again if the placeholder reports an exception. */
export function InlineWidgetSlot({
  placement,
  onStatus,
  collapseWhenEmpty,
}: SlotProps & { collapseWhenEmpty?: boolean }) {
  const live = useInlineLive(placement);
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const report = useRef(onStatus);
  report.current = onStatus;

  useEffect(() => {
    if (!live) {
      setVisible(false);
      report.current?.('waiting');
    }
  }, [live]);

  if (!webengageAvailable) return null;

  return (
    // The wrapper only measures a real pixel width; the widget itself never takes '100%'.
    // The negative margin (Home) cancels the list gap while nothing is showing.
    <View
      style={{ width: '100%', marginTop: collapseWhenEmpty && !visible ? -18 : 0 }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {live && width > 0 && (
        <View style={{ height: visible ? placement.height : 0, overflow: 'hidden' }}>
          <WEInlineWidget
            androidPropertyId={placement.androidPropertyId}
            iosPropertyId={placement.iosPropertyId}
            screenName={placement.screenName}
            style={{ height: placement.height, width }}
            onDataReceived={(data: unknown) => {
              if (__DEV__) console.log('[Inline]', placement.androidPropertyId, 'data', JSON.stringify(data)?.slice(0, 300));
              report.current?.('data');
            }}
            onRendered={() => {
              setVisible(true);
              report.current?.('rendered');
            }}
            onPlaceholderException={(error: unknown) => {
              if (__DEV__) console.warn('[Inline]', placement.androidPropertyId, 'exception', JSON.stringify(error)?.slice(0, 300));
              setVisible(false);
              report.current?.('exception');
            }}
          />
        </View>
      )}
    </View>
  );
}

// Fields a custom view's payload is most likely to carry, in the order they are shown first.
const HEADLINE_KEYS = ['title', 'heading', 'header', 'headline', 'message', 'description', 'text'];

const isPlain = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/** The campaign's own key/value pairs live in `payload.content.customData`; fall back to the whole payload. */
function sourceOf(data: unknown): Record<string, unknown> {
  const d = data as { payload?: { content?: { customData?: unknown } }; customData?: unknown } | null;
  const custom = d?.payload?.content?.customData ?? d?.customData;
  if (custom && typeof custom === 'object' && Object.keys(custom).length > 0) return custom as Record<string, unknown>;
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : { value: data };
}

/** Rows to show: values that are themselves JSON text are opened up into `key.field` rows. */
function entriesOf(data: unknown): [string, string][] {
  const rows: [string, string][] = [];
  for (const [k, v] of Object.entries(sourceOf(data))) {
    if (typeof v === 'string' && /^\s*[{[]/.test(v)) {
      try {
        const inner = JSON.parse(v) as unknown;
        if (inner && typeof inner === 'object') {
          for (const [ik, iv] of Object.entries(inner as Record<string, unknown>)) {
            rows.push([`${k}.${ik}`, isPlain(iv) ? String(iv) : JSON.stringify(iv)]);
          }
          continue;
        }
      } catch {
        // not JSON after all: show the text as it is
      }
    }
    rows.push([k, isPlain(v) ? String(v) : JSON.stringify(v)]);
  }
  return rows;
}

/** Custom View: the app owns the drawing. Nothing shows until the SDK delivers data, the impression is
 *  tracked right then, and a tap on the card tracks the click. */
export function InlineCustomSlot({ placement, onStatus }: SlotProps) {
  const live = useInlineLive(placement);
  const [data, setData] = useState<unknown>(undefined);
  const report = useRef(onStatus);
  report.current = onStatus;
  const propertyId = propertyIdFor(placement);

  useEffect(() => {
    if (!live) {
      setData(undefined);
      report.current?.('waiting');
      return;
    }
    registerWEPlaceholderCallback(
      placement.androidPropertyId,
      placement.iosPropertyId,
      placement.screenName,
      (payload: unknown) => {
        if (__DEV__) console.log('[Inline]', placement.androidPropertyId, 'custom data', JSON.stringify(payload)?.slice(0, 2500));
        setData(payload ?? {});
        report.current?.('rendered');
        trackImpression(propertyId, null);
      },
      (error: unknown) => {
        if (__DEV__) console.warn('[Inline]', placement.androidPropertyId, 'custom exception', JSON.stringify(error)?.slice(0, 300));
        setData(undefined);
        report.current?.('exception');
      }
    );
    return () => {
      deregisterWEPlaceholderCallback(placement.androidPropertyId, placement.iosPropertyId, placement.screenName);
    };
  }, [live, placement, propertyId]);

  if (!live || data === undefined) return null;

  const entries = entriesOf(data);
  const headlineKey = HEADLINE_KEYS.find((k) => entries.some(([key]) => key === k));
  const headline = entries.find(([k]) => k === headlineKey)?.[1];
  const rest = entries.filter(([k]) => k !== headlineKey);

  return (
    <Pressable
      style={[card, styles.custom, { minHeight: placement.height }]}
      onPress={() => trackClick(propertyId, null)}
      testID="inline-custom-card">
      <Text style={styles.customTag}>CUSTOM VIEW</Text>
      {!!headline && <Text style={styles.customHead}>{headline}</Text>}
      {rest.map(([k, v]) => (
        <Text key={k} style={styles.customRow} numberOfLines={2}>
          <Text style={styles.customKey}>{k}: </Text>
          {v}
        </Text>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primer: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  custom: { gap: 6, borderColor: colors.primary },
  customTag: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  customHead: { color: colors.text, fontSize: 17, fontWeight: '800' },
  customRow: { color: colors.text, fontSize: 13 },
  customKey: { color: colors.muted, fontWeight: '600' },
});
