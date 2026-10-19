# Goal: Engagement Channel Integration — Push

**Prerequisite:** Init complete (the `webengage-expo` plugin configured; the
client's native build can come later — the wrapper is safe until it does).
**Input from Pre-Flight:** which Android push transport the app already
uses (`@react-native-firebase/messaging`, `expo-notifications`, both, or
neither), whether `expo-task-manager` is present, whether another plugin
already creates a Notification Service Extension, and any existing
background-task/foreground-listener usage — do not rediscover.

**Order of this Goal (Core Rule 25):** one change list, applied install →
config → code — the Android push libraries (asked together), the
`webengage-expo-push` plugin entry (iOS only), then the hook and task files and
their call sites. Approval is one message: this change list plus the apply
commands (see "Build — apply, then the client's build"). The Android token, foreground, background, and permission
pieces are added together, so push is never left half-wired; stopping after
any step leaves the app building and running.

**Android and iOS work completely differently on Expo, by design:**

- **Android** — WebEngage's push arrives as an FCM *data* message. A
  JavaScript push library (`expo-notifications` or
  `@react-native-firebase/messaging`) receives it and the app forwards it
  to WebEngage with `push.onMessageReceived`, and registers the device
  token with `push.sendFcmToken`. `webengage-expo-push` does **nothing**
  on Android.
- **iOS** — no JavaScript plumbing at all. Delivery runs on APNs, and
  registration happens natively through `webengage-expo` (`WEGAutoRegister`).
  The `webengage-expo-push` plugin adds the Notification Service and
  Notification Content extensions (Rich Push) during prebuild.
  `push.sendFcmToken`/`push.onMessageReceived` are Android-only and are
  never called for iOS.

## Step 0 — Detect, State Defaults, Don't Over-Ask

**Android transport (Core Rule 16) — decided by Pre-Flight's finding:**

| Pre-Flight found | What to do |
|---|---|
| `@react-native-firebase/messaging` only | Use **Path B** (Firebase). Tell the client that's what was found and what it implies. |
| `expo-notifications` only | Use **Path A** (`expo-notifications`). `expo-task-manager` must also be present — if it's missing, ask permission to add it (Core Rule 21), in one line. |
| Both | Ask once which one currently receives their push and use that one — never guess, never wire both (every message would be forwarded to WebEngage twice). |
| Neither | Tell the client plainly (below), then **ask permission** before installing anything. |

When neither is present, say it like this — the client is deciding with
full context, not approving a package name:

> "Android push needs a push library to receive the message — you don't
> have one yet. I recommend `expo-notifications` (receives the message
> and gives the device token) plus `expo-task-manager` (passes pushes to
> WebEngage when the app is in the background or closed). May I install
> both?"

If the client declines, Android push cannot be completed — record it as
a pending/blocked item, never wire a half-integration. Do not suggest
installing `@react-native-firebase/*` unprompted; offer Path B only if
the client asks for Firebase.

**iOS defaults — state them, then proceed, leaving the door open:**

> "For iOS I'll add the `webengage-expo-push` plugin, which creates the
> Rich Push extensions automatically at build time (images, carousels,
> rating widgets, action buttons) — say so if you'd like to skip Rich
> Push."

Universal Links are not part of this integration — never mention or
offer them; wire them only if the client asks (see "Universal Links"
below). `webengage-expo-push` and its plugin entry are added **only when iOS
is integrated** — on an Android-only project it does nothing.

**Quick vs Full scope — read, never ask** (`references/depth.md` → Integration Depth — Asked Once, Core Rule 23). Check `Depth overrides` for Push in
`.webengage/agent.md` first, state the recorded depth in one line, then
continue:

> Using **Quick** depth, chosen earlier — token wiring, foreground and
> background message delivery, and Android 13 permission handling, no
> callbacks. *(or:* Using **Full** depth, chosen earlier — also adds a
> `push.onClick` callback for deeplink handling.*)*

If no depth is recorded yet, run the depth question (`references/depth.md`) first.

Quick still includes **both** Android delivery paths (foreground *and*
background) and permission handling — they are required correctness,
not optional scope: without the background handler, pushes received
while the app is backgrounded or closed never reach WebEngage. Quick
also includes the full iOS plugin setup.

---

## Android

**`google-services.json` is required whichever library is used** —
Android push is delivered through Firebase Cloud Messaging underneath
`expo-notifications` too. Confirm it exists and is referenced from the
Expo config:

```json
{ "expo": { "android": { "googleServicesFile": "./google-services.json" } } }
```

It must belong to the same Firebase project whose service-account key
is uploaded to the WebEngage dashboard (Dashboard Step below), and its
package name must match `android.package`. If it's missing, don't ask a
blocking question: add the config entry, mark Android push *pending —
needs your `google-services.json`* in the approval and the notes, and
never generate or invent one. **EAS note:** if the file is git-ignored, EAS
Build can't see it unless it is supplied as an EAS file environment
variable — say so in one line. Do not remove an existing
`google-services.json` reference when migrating off
`@react-native-firebase`.

**Payload shape (both paths):** WebEngage's native `onMessageReceived`
reads the FCM data map from `message.data` and handles only messages
where `data.source === "webengage"`. So always forward an object of the
form `{ data: { source: "webengage", ... } }` — never the data map on
its own, and never a message whose `source` isn't `webengage` (those
belong to the app's other push providers).

### Path A — `expo-notifications` (+ `expo-task-manager`)

`expo-notifications` exposes the FCM data map in two places:

- **Foreground:** `notification.request.trigger.remoteMessage.data`
- **Background:** `data.data` — the background-task payload is the
  Firebase `RemoteMessage`, so the FCM data map is under its `data`
  field.

Put the plumbing in two small files rather than inline in a screen:

```typescript
// src/analytics/webengageBackgroundTask.ts
// Imported for its side effects, ONCE, at module scope of the app's
// entry — see "Where the background task is loaded" below.
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { createGuardedWebEngage } from './WebEngageManager';

const BACKGROUND_NOTIFICATION_TASK = 'WEBENGAGE_BACKGROUND_NOTIFICATION_TASK';

TaskManager.defineTask<Notifications.FirebaseRemoteMessage>(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data: remoteMessage, error }) => {
    if (error) return;
    // Foreground delivery is handled by addNotificationReceivedListener,
    // so skip here — otherwise the same push reaches WebEngage twice.
    if (AppState.currentState === 'active') return;
    const data = remoteMessage?.data;
    if (data?.source === 'webengage') {
      // A local instance is correct here, not a Core Rule 19 violation:
      // background tasks can run in a separate JS context with no access
      // to the module-scope WebEngageManager. It is built with the
      // wrapper's own guarded factory (never throws), and only
      // onMessageReceived is ever called on it — never a listener
      // registration.
      createGuardedWebEngage().push.onMessageReceived({ data });
    }
  }
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {
  // Registration can fail (for example without Google Play services); push
  // simply isn't handled in the background then — it must never crash the app.
});
```

```typescript
// src/analytics/useWebEngageAndroidPush.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import WebEngageManager from './WebEngageManager';

export function useWebEngageAndroidPush() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const webengage = WebEngageManager.instance;

    // 1. Device token — fetched and sent on every app start, so a token
    // that changed since the last launch always reaches WebEngage.
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
```

Call `useWebEngageAndroidPush()` from the same root component/layout as
`WebEngageManager.init()`. It deliberately uses
`WebEngageManager.instance` (the wrapper's shared instance), not a new
`WebEngage()` — only the background task constructs its own.

**Where the background task is loaded.** `TaskManager.defineTask` must
execute at module scope — not inside a component or effect — and in a
module that is loaded every time the app starts, *including* when the OS
launches it headless to deliver a push. Import the file for its side
effects at the top of the entry module:

- **Classic entry:** `import './src/analytics/webengageBackgroundTask';`
  at the top of `index.js` (before `registerRootComponent`).
- **Expo Router:** at the top of the root `app/_layout.tsx` module (above
  the component), as a bare side-effect import. The task name passed to
  `defineTask` and `registerTaskAsync` must be identical.

**Android 13+ permission** (Quick scope — required correctness for any
Push integration on API 33+). From Android 13, an app must ask for
notification permission; until the user grants it they are not opted in.
WebEngage does not trigger the prompt itself. **Pre-Flight's finding
decides which of the two cases applies — never add a second prompt on
top of one the app already has:**

**Case 1 — the app does not request notification permission anywhere
yet: add the request, on the launch landing screen.** Use `expo-notifications`' own APIs and pass the
*actual* result to WebEngage:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import WebEngageManager from './WebEngageManager';

export async function requestPushPermissionAndOptIn() {
  // Android only: on iOS the native WEGAutoRegister already prompts.
  if (Platform.OS !== 'android') return;
  try {
    // Android 13+ shows the permission prompt only if the app has at
    // least one notification channel — create one first if none exists.
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
```

Check Pre-Flight's existing-usage finding before creating the channel;
don't create a second one if the app already defines channels. **Where
the function is called is decided, not asked:** call it once from the
**home screen the user lands on at app launch** (the first real screen —
under Expo Router the default route's component, after any auth gate that
sends the user elsewhere). State this in the approval and record the
file+line. Gate the whole helper to Android — on iOS the native
`WEGAutoRegister` already shows the prompt.

**Case 2 — the app already requests notification permission, anywhere in
the app (an
existing `requestPermissionsAsync()`, `PermissionsAndroid`
`POST_NOTIFICATIONS`, or `messaging().requestPermission()` call):** do
not add another prompt and do not change when or how it's asked. Add
only the WebEngage call at that existing result site — **granted →
`setDevicePushOptIn(true)`**, denied → `setDevicePushOptIn(false)` (Hard
Rule 4: the call mirrors the real result):

```typescript
// at the app's EXISTING permission-result site — add only this line
WebEngageManager.instance.user.setDevicePushOptIn(status === 'granted');
```

If a `setDevicePushOptIn` call already exists there, verify it reflects
the real result rather than adding a duplicate.

`setDevicePushOptIn()` is a one-shot call made at the result site, so it
stays outside the wrapper's own methods (`references/wrapper.md`); it uses
the wrapper's guarded handle, `WebEngageManager.instance`.

**Also true on Android, from a real bug pattern:**
`setDevicePushOptIn(true)` called with *no* permission request anywhere
in the app is a distinct bug from a wrong value tied to a real result —
the user was never asked, the OS silently drops notifications on API
33+, and WebEngage's dashboard shows them as opted in. Confirm a request
call genuinely exists before treating the line as correct.

### Path B — `@react-native-firebase/messaging` (existing integration)

Used only when Pre-Flight found it already installed (or the client asks
for it). The client's own Firebase setup (config plugins for
`@react-native-firebase/app`, `google-services.json`) is theirs and
already working — do not touch it. Add only WebEngage's JS side:

```typescript
// src/analytics/useWebEngageAndroidPush.ts   (Firebase path)
import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import WebEngageManager from './WebEngageManager';

export function useWebEngageAndroidPush() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const webengage = WebEngageManager.instance;

    // Fetched and sent on every app start (same as Path A).
    messaging()
      .getToken()
      .then((token) => webengage.push.sendFcmToken(token))
      .catch(() => {
        // No token yet — WebEngage just doesn't get one this launch.
      });
    const unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage?.data?.source === 'webengage') {
        webengage.push.onMessageReceived(remoteMessage);
      }
    });

    return () => {
      unsubscribeMessage();
    };
  }, []);
}
```

```typescript
// src/analytics/webengageBackgroundHandler.ts — side-effect import at
// the top of the entry module (index.js, or app/_layout.tsx under
// Expo Router), same placement rule as Path A's background task.
import messaging from '@react-native-firebase/messaging';
import { createGuardedWebEngage } from './WebEngageManager';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // A local instance is correct here (separate JS context) — built with the
  // wrapper's guarded factory, and only onMessageReceived is called on it,
  // never a listener registration.
  if (remoteMessage?.data?.source === 'webengage') {
    createGuardedWebEngage().push.onMessageReceived(remoteMessage);
  }
});
```

The existing app may already have a foreground `onMessage` and/or a
background handler of its own — add the WebEngage forwarding alongside,
never replace (Core Rule 7). **RNFirebase allows exactly one
`setBackgroundMessageHandler`**: a second call silently replaces the first
(or is replaced by it). If the app already has one, **extend that handler
in place** — add the `data.source === 'webengage'` branch inside it —
instead of adding the separate file above; only when none exists use the
file. The `source` gate is unconditional in both handlers. RNFirebase's
`onMessage` passes the full `RemoteMessage`, so `onMessageReceived(remoteMessage)`
already has the `{ data }` shape the SDK expects.

**Android 13+ permission:** same two cases as Path A — if the app
already requests permission (`messaging().requestPermission()`,
`PermissionsAndroid`'s `POST_NOTIFICATIONS`), add only
`setDevicePushOptIn(granted)` at that existing site; if it requests
nowhere, add a request on the launch landing screen using the mechanism
the app already depends on (`PermissionsAndroid.request(
PERMISSIONS.POST_NOTIFICATIONS)` is available without any extra package)
and pass the real result. Without `expo-notifications` nothing declares the
permission for you: add `android.permissions: ["POST_NOTIFICATIONS"]` to
the Expo config, or the request returns denied. *(Unverified on a device.)*

**iOS and Firebase — one thing to check.** WebEngage's iOS push never
touches Firebase. If the client's app does **not** use Firebase on iOS
(no `ios.googleServicesFile` in the Expo config), linking
`@react-native-firebase/app` on iOS makes Firebase auto-configure at
launch and crash without a `GoogleService-Info.plist`. In that case the
packages must be excluded from iOS native linking
(`react-native.config.js`: `platforms: { ios: null }` on both
`@react-native-firebase/app` and `@react-native-firebase/messaging`),
and once `pod install` has run (apply step C) confirm no `RNFBApp`/
`RNFBMessaging`/`Firebase`/`FirebaseCore` pods appear in
`ios/Podfile.lock` — pending if the client struck that step. If the exclusion
doesn't take under Expo's autolinking, surface it to the client rather
than working around it silently. If the client *does* use Firebase on
iOS, leave it alone.

---

## iOS — `webengage-expo-push`

Everything here is automatic at prebuild. There is no Xcode step and no
JS plumbing.

**What already exists from Init (`webengage-expo`):** the
`aps-environment` entitlement (from `push.mode`), Background Modes →
`remote-notification` and `fetch`, the main app's App Group
(`group.<ios.bundleIdentifier>.WEGNotificationGroup`), and native push
registration. **What `webengage-expo-push` adds:** the Notification
Service Extension (rich content), the Notification Content Extension
(carousels/rating/action buttons), their `Info.plist`/entitlements,
the same App Group on both extensions, the `WEServiceExtension`/
`WEContentExtension` dependencies (CocoaPods, or SPM with `useSPM`), and
the EAS app-extension credentials config.

**Install** (it is part of the Push goal's iOS default — Core Rule 21 —
so no separate ask; state it plainly when starting; **only when iOS is
integrated**):

```shell
npm install webengage-expo-push@latest        # or yarn add / pnpm add / bun add — always @latest
```

**Add the plugin** next to the existing `webengage-expo` entry. Unlike
`webengage-expo`, this package ships `app.plugin.js`, so it is listed by
bare package name:

```javascript
// app.config.js — inside the plugins array, after the webengage-expo entry
['webengage-expo-push', { mode: isProduction ? 'production' : 'development' }],
```

`mode` **must equal** the `push.mode` already set in `webengage-expo`'s
config (Hard Rule 9) — reuse the same expression.

### Configuration

| Key | Description | Default |
|---|---|---|
| `mode` | APNs environment: `development` or `production`. Must match `push.mode` in `webengage-expo`. | `development` |
| `iPhoneDeploymentTarget` | Minimum iOS version for both extensions. **Must match the main app's deployment target exactly** (Hard Rule 10). | `15.1` |
| `devTeam` | Apple Developer Team ID, applied to the main app and both extensions — needed for local device builds; EAS manages signing itself. | — |
| `appGroupName` | **Do not set** — see Hard Rule 13. | `group.{bundleId}.WEGNotificationGroup` |
| `useSPM` | Link extension dependencies via Swift Package Manager instead of CocoaPods. | `false` |
| `iosNSETargetName` | Custom NSE target name. | `NotificationService` |
| `iosCETargetName` | Custom Content Extension target name. | `NotificationViewController` |
| `iosNSEFilePath` / `iosCEFilePath` | Path to a custom `NotificationService.swift` / `NotificationViewController.swift`. | built-in |
| `disableNSE` | Skip all NSE setup (no target, files, or pod). The Content Extension is still created. | `false` |
| `iosNSEExistingTarget` | Another plugin already creates the NSE target — skip creating it and only add the pod to the existing one. Requires `iosNSEFilePath`. | `false` |

`iosCEFilePath`, `devTeam`, `useSPM`, `iosNSETargetName`,
`iosCETargetName`, and `disableNSE` need `webengage-expo-push` v1.0.0+ —
on `0.0.1` they're rejected with `"You have provided an invalid
property"` at prebuild. Pre-Flight already has the installed version.
All options other than `mode` and (when needed) `devTeam`/
`iPhoneDeploymentTarget` are opt-in advanced (Core Rule 15) — never
proposed proactively (`appGroupName` is not available as an option at
all — Hard Rule 13).

**`iPhoneDeploymentTarget`:** read the main app's deployment target
(Pre-Flight: `ios/Podfile`'s `platform :ios`, or `expo-build-properties`)
and set the plugin's value to exactly that. Leaving the plugin's
`15.1` default is only correct if the main app is also on 15.1.

### Other iOS push providers

If Pre-Flight found another plugin that creates a Notification Service
Extension (OneSignal's, Braze's, etc.): **only one NSE may exist.** Use
`iosNSEExistingTarget: true`, set `iosNSETargetName` to the *other*
plugin's target name, and provide `iosNSEFilePath` pointing to a merged
Swift file that dispatches on `payload["source"] == "webengage"` to
`WEXPushNotificationService` and falls back to the other provider's
handling. **`webengage-expo-push` must be listed *before* the other
plugin in `plugins`**, or prebuild fails (the target doesn't exist in the
Podfile yet). Never set `iosNSEExistingTarget` without `iosNSEFilePath`.

### Permission on iOS

No separate step. `WEGAutoRegister` (default `true`) makes the native
SDK request notification permission at launch. If the client has set
`WEGAutoRegister: false`, the app must request permission itself (for
example `Notifications.requestPermissionsAsync()` from
`expo-notifications`) — don't leave that silently unhandled.

### Build — apply, then the client's build

Same boundary as Init (Core Rule 22): a new native build is required.
The apply steps (`references/init.md` → Apply the Plugin: config check,
`npx expo prebuild --no-install`, `pod install` on iOS) are part of **this
Goal's one approval message** with the change list — not separate asks.
Name the Push-specific risks in it: the extension bundle IDs and the App
Group must be registered for local signing, and an already-prebuilt `ios/`
may need the client's own `--clean`. The client runs the build and the app
themselves. **Static linkage:** Rich Push does not turn static linkage on
by itself, but if it is on for any reason (`useFrameworks: 'static'` in
the resolved config — In-Line turns it on, the client's own config may
too), `pod install` runs with `WEBENGAGE_DISABLE_SPM=true` (see
`references/init.md` → apply step C).

- **Local, first time with the plugin:** the approved prebuild above
  applies it. **If the project was already prebuilt before this plugin was
  added**, the extensions need a regenerated project — `npx expo prebuild
  --clean` is the documented way, but this skill never runs it. ⚠️ Tell the
  client it deletes and regenerates `ios/`/`android/`, that it is only
  safe if nothing in them needs keeping (CNG projects usually don't), and
  that they run it.
- **Re-prebuilding after adding another native dependency that created
  an NSE** triggers `"Notification Service Extension target already
  exists"` — the fix is `--clean` (the client's step, same warning), or
  the `iosNSEExistingTarget` setup above.
- **EAS Build:** applies plugins itself — no manual prebuild. The plugin
  writes the extension bundle IDs (`<bundleId>.NotificationService`,
  `<bundleId>.NotificationViewController`) into the EAS credentials
  config; EAS registers them. Confirm they appear if the build fails with
  a provisioning error (`eas credentials`).
- **Local device builds:** set `devTeam`, and register the extension
  bundle IDs and the App Group in the Apple Developer account.

---

## Push Click Callback (Full Integration Only)

Add to the wrapper's `registerCallbacks()` (per `references/wrapper.md` →
Analytics Wrapper — Architecture) — create the method if this is the first
callback the project has, extend it if another Goal already added one;
only this one block, never another Goal's:

```typescript
// src/analytics/WebEngageManager.ts — inside registerCallbacks()
this.webengage.push.onClick((pushNotificationData) => {
  const deeplink = pushNotificationData && pushNotificationData['deeplink'];
  if (!deeplink) return; // not every campaign includes one
  routeDeepLink(deeplink); // the same app helper as In-App's click callback
  // (references/channels/inapp.md → "Routing is part of the callback"). This
  // callback takes no return value (Core Rule 18) — the app always fully owns
  // navigation; there is no SDK-handles option.
});
```

`registerCallbacks()` itself is called once, from the root layout/
component's mount effect, alongside `WebEngageManager.init()`. Register
as early as possible (Core Rule 19) — the SDK buffers the *first* 50
push-click events before a listener attaches, then silently drops any
more (v2.0.0+ only; a FIFO cap, not a sliding window).

`push.onClick` fires for iOS clicks too, once native init has run —
nothing platform-specific to add on the callback side.

### Troubleshooting: "Push Click Not Working"

**The most common real-world report on a cold launch via push, and it is
almost never late registration on the correct instance.** Each
`new WebEngage()` subscribes to the native event emitter from
construction, and the native bridge is a process-wide singleton that
broadcasts to every attached listener. The real cause is nearly always a
**second `new WebEngage()`** somewhere in the app — a component that
constructs its own instead of using `WebEngageManager.instance` — that
subscribed *after* the one-time native pre-launch buffer already
replayed to the original instance. Search the codebase for every
`new WebEngage()` before assuming a timing issue. **Expo exception to
exclude from that search:** the Android background task's local instance
(Core Rule 19) — it never registers listeners, so it isn't the cause.

---

## Universal Links (Only If the Client Asks — Never Offered)

iOS-only; the callback never fires on Android. `webengage-expo`'s native
AppDelegate subscriber already forwards `continue userActivity` to
WebEngage — there is nothing native to add. What the client needs:

1. **The Associated Domains entitlement** — Expo's own config:
   `ios.associatedDomains: ["applinks:your.domain"]` in the Expo config
   (client-owned; add it only with their domain), plus the site's
   `apple-app-site-association` file hosted server-side.
2. **The callback**, in `registerCallbacks()`:

```typescript
// inside registerCallbacks(), its own block next to push.onClick
this.webengage.universalLink.onClick((location) => {
  const resolvedUrl = location['location'];
  // route using the app's existing navigation
});
```

**On a Bridgeless / New Architecture project** (the default on Expo SDK
52+) the version floor for this callback is `react-native-webengage`
v2.0.1+, not just v2.0.0 — a dedicated fix for it landed at that patch.
Confirm the installed version clears v2.0.1 before wiring it.

---

## Dashboard Step (Required, Outside the Codebase)

1. **Android:** Firebase Console → Project Settings → Service Accounts →
   Generate New Private Key → WebEngage Dashboard → Data Platform →
   Integrations → Push Setup → upload the JSON key.
2. **iOS:** upload the APNs **Auth Key** (`.p8`) with its Key ID, Team ID
   and the app's bundle ID to the WebEngage Dashboard (a certificate must
   match the environment — development or production).

## Sample Push Payload (For Reference)

```json
{
  "userData": {
    "license_code": "YOUR_LICENSE",
    "packageName": "com.example.app",
    "messageAction": "NOTIFICATION",
    "title": "Title!",
    "message": "Desc",
    "expandableDetails": {
      "style": "BIG_PICTURE",
      "message": "Desc",
      "image": "https://afiles.webengage.com/..."
    },
    "custom": [{ "key": "provider", "value": "FCM" }]
  },
  "deeplink": null,
  "provider": "FCM"
}
```

Treat every field as nullable and confirm presence before use —
`deeplink` in particular is commonly `null` for a campaign with no
navigation target.

## How to Confirm This Works (the Client's Step)

*Expected behavior per WebEngage's documentation — not yet verified on
Expo.*

Before you start, the Dashboard Step above must be done for each platform
you set up, and the app installed on a physical device with notification
permission granted (on Android 13+ that is the runtime prompt) and
registered as a test device on the dashboard. Send a test push campaign and
try the app in the foreground, in the background and fully closed: it should
arrive each time. At Full depth, tapping it runs your `push.onClick` handler
(*{file:line}*) with the payload — `deeplink` in lowercase — and the app
navigates as implemented; on iOS with Rich Push on, images and action
buttons render. If nothing arrives, check in this order: the credential
upload, the Android notification permission, that `push.mode` matches the
build on iOS, and that the Firebase project is the one whose key was
uploaded; for a tap that does nothing see "Troubleshooting: Push Click Not
Working" above. Tell me what you saw — I record *confirmed*, *pending*, or
the problem.

## Hard Rules

1. **The Android payload is forwarded to `push.onMessageReceived` only
   when `data.source === 'webengage'`, and in the `{ data: {...} }`
   shape** — never the bare data map, never other providers' messages.
2. **`push.sendFcmToken` must be called on every app start** — the
   device token is fetched (`getDevicePushTokenAsync()` /
   `messaging().getToken()`) and sent from a mount effect that runs at
   each launch, not once-ever or only after login. That is what keeps
   WebEngage's stored token current when it changes between launches.
3. **(Path A) The background handler must be registered at module scope,
   in a module loaded at every app start; the task name given to
   `defineTask` and `registerTaskAsync` must be identical; and the task
   must return early when `AppState.currentState === 'active'`** so the
   foreground listener's push isn't handled a second time.
4. **The Android 13 permission result must correctly drive
   `setDevicePushOptIn()`** — must reflect the actual grant/deny
   outcome, never hardcoded, never fired before the result is known.
5. **`setDevicePushOptIn(true)` must never appear with no corresponding
   permission-request call anywhere in the app** — a value asserted with
   no request having happened reads as correct from the call site alone,
   while the OS drops notifications on API 33+ and WebEngage shows the
   user as opted in.
6. **`google-services.json` must be present and referenced via
   `android.googleServicesFile`** whichever library is used — FCM is the
   delivery path.
7. **The Android transport follows Pre-Flight's detection (Core Rule
   16); never wire both libraries, and never swap one for the other
   unasked.**
8. **Never install a push library without the client's permission (Core
   Rule 21).** When installing `expo-notifications`, `expo-task-manager`
   comes with it — Path A's background handler requires both.
9. **`webengage-expo-push`'s `mode` must equal `webengage-expo`'s
   `push.mode`** — mismatched APNs environments between the main app and
   its extensions.
10. **Both extension targets' deployment target must match the main
    app's exactly** (`iPhoneDeploymentTarget`). A mismatch breaks the
    build or the extensions at runtime.
11. **Only one Notification Service Extension may exist.** If another
    plugin creates one, `iosNSEExistingTarget: true` + `iosNSEFilePath`
    (a merged file) is the only supported setup, with
    `webengage-expo-push` listed *before* that plugin. `iosNSEExistingTarget`
    without `iosNSEFilePath` is never valid.
12. **Never hand-edit the generated extension targets, entitlements, or
    Podfile.** On a CNG project they're regenerated; on a
    prebuilt-and-kept one, hand edits desynchronize from the plugin. All
    changes go through plugin options.
13. **Never set `appGroupName`; the App Group must be the default
    `group.<ios.bundleIdentifier>.WEGNotificationGroup`,
    character-for-character identical on the main app and both
    extensions.** WebEngage's iOS push infrastructure is defined around
    that exact string, and the two plugins don't share an override:
    `webengage-expo-push` writes a custom `appGroupName` into the two
    extensions' entitlements only, while `webengage-expo` always writes
    the *default* name into the main app's — so a custom value leaves the
    main app and the extensions in different groups, a common,
    easy-to-miss cause of rich push silently falling back to plain text.
    If the client wants a different group name, decline, redirect to
    `support@webengage.com`, and record a Hard Rule refusal.
14. **If iOS is integrated: Background Modes → `remote-notification` and
    the `aps-environment` entitlement must be present on the main app,
    regardless of whether Rich Push is on.** `webengage-expo` generates
    both; removing or overriding them in `ios.infoPlist`/
    `ios.entitlements` breaks all iOS push, rich or plain.
15. **`push.onClick` never takes a return value** (Core Rule 18) — the
    app always fully owns navigation.
16. **(Path B, if the client doesn't use Firebase on iOS)
    `@react-native-firebase/app` and `/messaging` must be excluded from
    iOS native linking** — JS-side Android gating alone doesn't stop
    Firebase auto-configuring at iOS launch and crashing.

If the client insists on an alternate implementation for any of the
above, do not implement it that way — record as a Known Risk (Hard Rule
refusal) per `references/rules.md` → Hard Rules — Definition.

## Rules

- Recommend Rich Push stays on (the default) if the client's campaigns
  will use images, carousels, or rating widgets — without it those
  render as plain text pushes. Client declining (`disableNSE`): record as
  a Known Risk (there's a real functional consequence). Note
  `disableNSE` still creates the Content Extension.
- Recommend at least `push.onClick` if the client's campaigns will use
  deep links — without it, clicks have nowhere useful to navigate.
- Recommend `devTeam` for local device builds (EAS manages signing
  itself).

## Recording State

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

`.webengage/channels/push.md` — **track exact file+line for everything
below, not just status flags — this doubles as the raw material for
`Goal: Audit`'s debugging checklist (see `references/audit.md`):**

- Android transport used (`expo-notifications` / Firebase), how it was
  decided (detected / client's choice between both / newly installed with
  permission), and whether `expo-task-manager` was added.
- `google-services.json` path and the `android.googleServicesFile`
  entry (file+line in the Expo config).
- Call sites: `sendFcmToken` (every-start effect), foreground
  `onMessageReceived`, background task/handler (`defineTask` file+line,
  where it's imported at the entry, the task name).
- `push.onClick`/`universalLink.onClick` registration — confirm both live
  inside the wrapper's `registerCallbacks()`; record that file+line.
- Android 13 permission handling: **which mechanism implemented it**
  (`expo-notifications` / `PermissionsAndroid` / Firebase) and **where
  it's requested** (the app's existing site, or the launch landing screen
  by default) — record both. Also confirm a genuine request call backs any
  `setDevicePushOptIn(true)`.
- iOS: `webengage-expo-push` version, the plugin entry's exact props
  (file+line), whether Rich Push is on (and if `disableNSE`), the
  deployment target value and that it matches the main app's, `devTeam`
  if set, any `iosNSEExistingTarget` setup and plugin order.
- iOS (after prebuild): the extension folders exist in `ios/`, the App
  Group in the three entitlements, `aps-environment`'s value against the
  build profile (it must follow the signing profile: development for
  dev-client builds, production for TestFlight and ad-hoc), Background Modes.
- Universal Links status; if on, the installed version cleared v2.0.1+
  on a Bridgeless project, and the `ios.associatedDomains` entry.
- Dashboard credential upload status (confirmed by client / pending) —
  FCM service account (Android) and APNs key (iOS), tracked separately.

## Audit Checks

1. **(Android) `sendFcmToken` runs on every app start** — Hard-Rule-derived
   (Hard Rule 2), always an issue if it's gated to run only once or only
   after an event that doesn't happen every launch.
2. **(Android) Foreground and background forwarding both present, gated
   on `data.source === 'webengage'`, in `{ data }` shape** —
   Hard-Rule-derived (1, 3). For Path A also confirm: `defineTask` is at
   module scope, imported at the entry, task names identical,
   `AppState` early-return present.
3. **`setDevicePushOptIn()` tied to the actual permission result, never
   hardcoded; and a genuine permission request exists whenever
   `setDevicePushOptIn(true)` appears** — Hard-Rule-derived (4, 5). Don't
   pass this check on the boolean expression alone — confirm the request
   call exists.
4. **`google-services.json` present and referenced** — Hard-Rule-derived
   (6); its package name matches `android.package`.
5. **Transport matches what's recorded** — Rule-derived (Hard Rule 7
   violation if both wired): flag code showing the other library or both
   without a recorded decision.
6. **`webengage-expo-push` entry present with `mode` equal to
   `push.mode`** — Hard-Rule-derived (9).
7. **Extension deployment target matches the main app's** —
   Hard-Rule-derived (10); compare the plugin's `iPhoneDeploymentTarget`
   (or default `15.1`) against the main app's target in `ios/Podfile`/
   `expo-build-properties`.
8. **Only one NSE; plugin order and `iosNSEFilePath` correct if
   `iosNSEExistingTarget`** — Hard-Rule-derived (11). If `ios/` exists:
   exactly one `NotificationService`-style extension folder/target.
9. **If `ios/` exists (post-prebuild): `NotificationService` and
   `NotificationViewController` folders exist; all three entitlements
   (main app + both extensions) declare the same App Group; the Content
   Extension `Info.plist` declares the rich categories
   (`WEG_CAROUSEL_V1`, `WEG_RATING_V1`, `WEG_RICH_V1`–`WEG_RICH_V8`);
   the main app has `aps-environment` (value matching the build profile)
   and Background Modes → `remote-notification`** — Hard-Rule-derived
   (12–14), always an issue if missing, independent of Rich Push. Check
   each target's own entitlements individually; and `appGroupName` is
   not set in the plugin props (Hard Rule 13).
10. **No hand-edited generated extension/Podfile content** — only
    detectable on a prebuilt-and-kept project; Hard-Rule-derived (12).
11. **If Path B and the client doesn't use Firebase on iOS:
    `react-native.config.js` excludes both packages from iOS and
    `Podfile.lock` shows no `RNFBApp`/`RNFBMessaging`/`Firebase`/
    `FirebaseCore` pods** — Hard-Rule-derived (16).
12. **If callbacks are in use: `push.onClick` relies on no return value,
    is registered early, and lives inside `registerCallbacks()`** —
    return-value is Hard-Rule-derived; early registration and wrapper
    placement are Rule-derived (informational if backed by a Known Risk).
    The background task's local instance (built with `createGuardedWebEngage()`)
    is exempt from the wrapper-placement check provided it only calls
    `onMessageReceived`.
13. **If Universal Links are on: the version floor (v2.0.1+ on
    Bridgeless), `ios.associatedDomains` present, and the callback
    registered** — Hard-Rule-derived for the version floor.
14. **Dashboard credential upload** — reported as confirmed or pending
    per platform; not verifiable from code, so never a code-level issue.
