import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import WebEngageManager, { webengageAvailable } from './WebEngageManager';

/** Android only: on iOS the native WEGAutoRegister already shows the prompt.
 *  Android 13+ needs the app to ask; the real result is passed to WebEngage. */
export async function requestPushPermissionAndOptIn(): Promise<void> {
  if (Platform.OS !== 'android' || !webengageAvailable) return;
  try {
    // Android 13+ shows the permission prompt only if the app has at least
    // one notification channel.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    // Must reflect the real result, never a hardcoded true.
    WebEngageManager.instance.user.setDevicePushOptIn(status === 'granted');
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] push permission / opt-in failed:', e);
  }
}
