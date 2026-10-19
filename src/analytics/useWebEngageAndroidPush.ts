import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import WebEngageManager, { webengageAvailable } from './WebEngageManager';

export function useWebEngageAndroidPush() {
  useEffect(() => {
    if (Platform.OS !== 'android' || !webengageAvailable) return;
    const webengage = WebEngageManager.instance;

    // 1. Device token: fetched and sent on every app start, so a token that
    // changed since the last launch always reaches WebEngage.
    Notifications.getDevicePushTokenAsync()
      .then(({ data: token }) => webengage.push.sendFcmToken(token as string))
      .catch(() => {
        // No token yet (permission not granted, no Google Play services).
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
