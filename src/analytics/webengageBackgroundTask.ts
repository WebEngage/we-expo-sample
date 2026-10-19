// Imported for its side effects, once, at module scope of the app's root layout.
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { createGuardedWebEngage, webengageAvailable } from './WebEngageManager';

const BACKGROUND_NOTIFICATION_TASK = 'WEBENGAGE_BACKGROUND_NOTIFICATION_TASK';

// Android only: iOS push runs on APNs and needs no JavaScript plumbing.
if (Platform.OS === 'android' && webengageAvailable) {
  TaskManager.defineTask<Notifications.FirebaseRemoteMessage>(
    BACKGROUND_NOTIFICATION_TASK,
    async ({ data: remoteMessage, error }) => {
      if (error) return;
      // Foreground delivery is handled by addNotificationReceivedListener,
      // so skip here, otherwise the same push reaches WebEngage twice.
      if (AppState.currentState === 'active') return;
      const data = remoteMessage?.data;
      if (data?.source === 'webengage') {
        // A local instance is correct here: background tasks can run in a
        // separate JS context with no access to the module-scope wrapper.
        // Only onMessageReceived is ever called on it.
        createGuardedWebEngage().push.onMessageReceived({ data });
      }
    }
  );

  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {
    // Registration can fail (for example without Google Play services); push
    // is then simply not handled in the background. It must never crash the app.
  });
}
