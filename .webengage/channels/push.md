# Push — channel record

- Depth: Quick (no `push.onClick` callback). Done 2026-10-19.
- Android transport: `expo-notifications` ~55.0.27 + `expo-task-manager` ~55.0.20 — none existed before; client approved installing both.
- `google-services.json`: project root (supplied by client); `android.googleServicesFile` set conditionally in `app.config.js:30` (only if the file exists). Contains a client entry for `com.webengage.reactSample`. File is untracked and not git-ignored.
- Android call sites:
  - `sendFcmToken` on every launch — `src/analytics/useWebEngageAndroidPush.ts:16`
  - foreground `onMessageReceived` (gated on `data.source === 'webengage'`) — `useWebEngageAndroidPush.ts:27`
  - background task `WEBENGAGE_BACKGROUND_NOTIFICATION_TASK` — `src/analytics/webengageBackgroundTask.ts:14` (`defineTask`), `:31` (`registerTaskAsync`); imported at module scope in `src/app/_layout.tsx:8`; hook called at `_layout.tsx:64`
- Android 13 permission: `expo-notifications` — `src/analytics/pushPermission.ts` (`setDevicePushOptIn` at :23 reflects the real result); requested once from the launch landing screen, `src/app/(tabs)/index.tsx:18`. No pre-existing permission request in the app.
- iOS: `webengage-expo-push` ^1.0.0 (resolved 1.0.0); plugin entry `app.config.js:54`, `mode` follows `push.mode` (development unless `APP_VARIANT`/`EAS_BUILD_PROFILE` = `production`); Rich Push on; no `devTeam`, `useSPM`, `appGroupName` set; extension deployment target 15.1 = main app 15.1.
- iOS post-prebuild checks passed: `ios/NotificationService` and `ios/NotificationViewController` exist with bundle IDs `com.webEngage.prodSwift.NotificationService` / `.NotificationViewController`; the same App Group `group.com.webEngage.prodSwift.WEGNotificationGroup` in all three entitlements; `aps-environment` = development; Background Modes `remote-notification` + `fetch`; Content Extension declares the rich categories; `Podfile.lock` lists `WEServiceExtension` 1.4.0 and `WEContentExtension` 1.2.0; no Firebase pods.
- Android post-prebuild: `com.google.gms.google-services` plugin applied in `android/app/build.gradle:185`, classpath in `android/build.gradle:9`.
- Universal Links: off.
- Dashboard credentials: FCM service account (Android) — pending client; APNs `.p8` key (iOS) — pending client.
- Confirmation: pending (physical device test).
