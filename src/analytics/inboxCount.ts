import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getNotificationCount, resetNotificationCount } from './webengageInbox';

// The unread count is an opaque string ("5", "9+"): never parsed as a number, and
// never decremented per message. It only changes through a hard reset or the SDK.
let count = '0';
const listeners = new Set<(c: string) => void>();

const publish = (next: string) => {
  count = next;
  listeners.forEach((l) => l(next));
};

export async function refreshInboxCount(): Promise<void> {
  publish(await getNotificationCount());
}

/** Call on the inbox-entry tap itself, before navigating: not from the inbox screen. */
export async function resetInboxCount(): Promise<void> {
  await resetNotificationCount();
  await refreshInboxCount();
}

/** WebEngage's unread count for the badge, refreshed on mount and when the app returns to the foreground. */
export function useInboxCount(): string {
  const [value, setValue] = useState(count);
  useEffect(() => {
    listeners.add(setValue);
    refreshInboxCount();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshInboxCount();
    });
    return () => {
      listeners.delete(setValue);
      sub.remove();
    };
  }, []);
  return value;
}
