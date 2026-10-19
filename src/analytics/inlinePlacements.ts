import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export type InlineKind = 'banner' | 'text' | 'custom' | 'exception';

export interface InlinePlacement {
  /** Sent with `screen()` and given to the widget; must equal the dashboard's page rule exactly (case included). */
  screenName: string;
  /** Placeholder (target view) name on the dashboard, Android. */
  androidPropertyId: string;
  /** Placeholder id on the dashboard, iOS. Must be a genuine integer. */
  iosPropertyId: number;
  /** Dashboard campaign this placement is meant to show. */
  campaign: string;
  kind: InlineKind;
  height: number;
  label: string;
}

/** The placements the dashboard's `v4.js` (android and ios) defines for this app. Nothing here is invented:
 *  screen names come from each campaign's page rule, ids from the `properties` list of each file. */
export const INLINE = {
  home: {
    screenName: 'home',
    androidPropertyId: 'home_banner',
    iosPropertyId: 1001,
    campaign: '311ol71',
    kind: 'banner',
    height: 120,
    label: 'Banner',
  },
  screen1: {
    screenName: 'screen1',
    androidPropertyId: 'S1P2',
    iosPropertyId: 2,
    campaign: '~2o22db2',
    kind: 'text',
    height: 120,
    label: 'Text view',
  },
  screen3: {
    screenName: 'screen3',
    androidPropertyId: 'S3P1',
    iosPropertyId: 31,
    campaign: '349ksnn',
    kind: 'custom',
    height: 160,
    label: 'Custom view',
  },
  screen4: {
    screenName: 'screen4',
    androidPropertyId: 'S4P1',
    iosPropertyId: 41,
    campaign: '2k75i6o',
    kind: 'exception',
    height: 120,
    label: 'Campaign that throws',
  },
} as const satisfies Record<string, InlinePlacement>;

/** The id the native side dispatches on, for this platform. */
export const propertyIdFor = (p: InlinePlacement): string =>
  Platform.OS === 'ios' ? String(p.iosPropertyId) : p.androidPropertyId;

// The screen name most recently reported to WebEngage by the root layout. An In-Line
// widget mounts only once `screen()` has been called with its own screen's name.
let tracked: string | null = null;
const listeners = new Set<() => void>();

export function setTrackedScreen(name: string | null): void {
  tracked = name;
  listeners.forEach((l) => l());
}

export function useTrackedScreen(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => tracked
  );
}
