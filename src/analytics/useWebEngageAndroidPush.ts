import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import WebEngageManager, { webengageAvailable } from './WebEngageManager';

/** Android only: sends the FCM token on every launch and forwards foreground pushes to WebEngage. */
export function useWebEngageAndroidPush() {
  useEffect(() => {
    if (Platform.OS !== 'android' || !webengageAvailable) return;
    const webengage = WebEngageManager.instance;

    // 1. Device token — fetched and sent on every app start, so a token that
    // changed since the last launch always reaches WebEngage.
    Notifications.getDevicePushTokenAsync()
      .then(({ data: token }) => webengage.push.sendFcmToken(token as string))
      .catch(() => {
        // No token yet (permission not granted, no Google Play services):
        // WebEngage just doesn't get one this launch — never crash the app.
      });

    // 2. Foreground pushes
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const trigger = notification.request.trigger as Notifications.PushNotificationTrigger;
      const data = trigger?.remoteMessage?.data;
      if (data?.source === 'webengage') {
        webengage.push.onMessageReceived({ data });
      }
    });

    return () => {
      receivedSub.remove();
    };
  }, []);
}
