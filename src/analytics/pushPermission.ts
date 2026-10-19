import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import WebEngageManager, { webengageAvailable } from './WebEngageManager';

/** Android only: asks for notification permission (Android 13+) and passes the real result to WebEngage.
 *  On iOS the native WEGAutoRegister already shows the prompt. */
export async function requestPushPermissionAndOptIn(): Promise<void> {
  if (Platform.OS !== 'android' || !webengageAvailable) return;
  try {
    // Android 13+ shows the permission prompt only if the app has at least one
    // notification channel — create one first.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    // Must reflect the real result — never a hardcoded true.
    WebEngageManager.instance.user.setDevicePushOptIn(status === 'granted');
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] push permission / opt-in failed:', e);
  }
}
