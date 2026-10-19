// Imported for its side effects, ONCE, at module scope of the app's entry
// (src/app/_layout.tsx) — it must load every time the app starts, including
// when Android launches it headless to deliver a push.
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import { createGuardedWebEngage, webengageAvailable } from './WebEngageManager';

const BACKGROUND_NOTIFICATION_TASK = 'WEBENGAGE_BACKGROUND_NOTIFICATION_TASK';

// Android only: iOS push runs on APNs through the native SDK.
if (Platform.OS === 'android' && webengageAvailable) {
  TaskManager.defineTask<Notifications.FirebaseRemoteMessage>(
    BACKGROUND_NOTIFICATION_TASK,
    ({ data: remoteMessage, error }) => {
      if (error) return;
      // Foreground delivery is handled by the received listener, so skip here —
      // otherwise the same push reaches WebEngage twice.
      if (AppState.currentState === 'active') return;
      const data = remoteMessage?.data;
      if (data?.source === 'webengage') {
        // A local instance is correct here: background tasks can run in a separate
        // JS context with no access to the module-scope WebEngageManager. It is
        // built with the guarded factory and only onMessageReceived is called on it.
        createGuardedWebEngage().push.onMessageReceived({ data });
      }
    },
  );

  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {
    // Registration can fail (for example without Google Play services); push
    // simply isn't handled in the background then — it must never crash the app.
  });
}
