import { router } from 'expo-router';
import { Linking } from 'react-native';

const SCHEME = 'weshop://';

let ready = false;
let pending: string | null = null;

function openPath(path: string): void {
  // A link straight to the inbox has no entry tap of its own, so reset the unread count here.
  // Required lazily: inboxCount -> webengageInbox -> WebEngageManager -> routeDeepLink would otherwise be a cycle.
  if (path === '/inbox') (require('./inboxCount') as typeof import('./inboxCount')).resetInboxCount();
  router.push(path as never);
}

function navigate(url: string): void {
  try {
    if (url.startsWith(SCHEME)) {
      openPath(`/${url.slice(SCHEME.length).replace(/^\/+/, '')}`);
    } else if (url.startsWith('/')) {
      openPath(url);
    } else {
      Linking.openURL(url).catch(() => {});
    }
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] deep link failed:', e);
  }
}

/** Opens a link from a push or in-app click. A tap that arrives before the
 *  navigator is ready (cold start, or signed out) is held and opened once it is. */
export function routeDeepLink(url: string): void {
  if (!url) return;
  if (ready) navigate(url);
  else pending = url;
}

/** Called by the root navigator: ready once state has loaded and someone is signed in. */
export function setDeepLinkReady(value: boolean): void {
  ready = value;
  if (value && pending) {
    const url = pending;
    pending = null;
    navigate(url);
  }
}
