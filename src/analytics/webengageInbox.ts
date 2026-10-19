import { safeCall, webengageAvailable } from './WebEngageManager';

type InboxPackage = typeof import('react-native-webengage-inbox');

// Required lazily so importing this file never throws where the native module
// is missing (web, Expo Go).
let inbox: InboxPackage | null = null;
if (webengageAvailable) {
  try {
    inbox = require('react-native-webengage-inbox');
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] inbox package unavailable:', e);
  }
}

const run = <T>(where: string, fn: (pkg: InboxPackage) => T | Promise<T>, fallback: T): Promise<T> =>
  safeCall(where, () => (inbox ? fn(inbox) : fallback), fallback);

export const initWENotificationInbox = () => run<void>('inbox.init', (p) => p.initWENotificationInbox(), undefined);
export const enableDevMode = () => run<void>('inbox.devMode', (p) => p.enableDevMode(), undefined);
export const getNotificationCount = () => run<string>('inbox.count', (p) => p.getNotificationCount(), '0');
export const getNotificationList = (offset?: any) =>
  run<any>('inbox.list', (p) => p.getNotificationList(offset), { messageList: [], hasNext: false });
export const resetNotificationCount = () => run<void>('inbox.reset', (p) => p.resetNotificationCount(), undefined);
export const trackView = (item: any) => run<void>('inbox.trackView', (p) => p.trackView(item), undefined);
export const trackClick = (item: any) => run<void>('inbox.trackClick', (p) => p.trackClick(item), undefined);
export const markRead = (item: any) => run<void>('inbox.markRead', (p) => p.markRead(item), undefined);
export const markUnread = (item: any) => run<void>('inbox.markUnread', (p) => p.markUnread(item), undefined);
export const markDelete = (item: any) => run<void>('inbox.markDelete', (p) => p.markDelete(item), undefined);
export const readAll = (items: any[]) => run<void>('inbox.readAll', (p) => p.readAll(items), undefined);
export const unReadAll = (items: any[]) => run<void>('inbox.unReadAll', (p) => p.unReadAll(items), undefined);
export const deleteAll = (items: any[]) => run<void>('inbox.deleteAll', (p) => p.deleteAll(items), undefined);
