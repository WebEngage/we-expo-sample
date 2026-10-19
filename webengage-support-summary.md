# WebEngage integration — support summary
Generated 2026-10-19 · skill: webengage-integration-expo v1.0 · compatibility record: references/compatibility.md (date of last row not re-read for this snapshot)

## App
WE Shop · slug `we-shop` · iOS `com.webEngage.prodSwift` · Android `com.webengage.reactSample` · Expo SDK 55.0.31 · React Native 0.83.10 · React 19.2.0 · TypeScript · Expo Router (`src/app/`) · New Architecture on · `ios/` generated and git-ignored (CNG) · `android/` ignored but 20 files tracked (prebuilt-and-kept) · local builds (`expo run:*`), no `eas.json`

## Packages (declared → lockfile-resolved)
| Package | Resolved |
|---|---|
| react-native-webengage | 2.1.0 |
| webengage-expo | 0.0.3 |
| webengage-expo-push | 1.0.0 |
| react-native-we-personalization | 2.1.0 |
| react-native-webengage-inbox | 2.1.0 |
| expo-notifications | 55.0.27 |
| expo-task-manager | 55.0.20 |
| expo-build-properties | 55.0.18 |

Native SDKs seen in this run: Android WebEngage 4.22.0 (from its own log); iOS pods WebEngage 7.1.0, WEPersonalization 1.6.1, WENotificationInbox 1.1.5, WEServiceExtension 1.4.0, WEContentExtension 1.2.0 (`ios/Podfile.lock`).

## Configuration
Data center: iOS `DEFAULT`, Android `us` · license source: `WEBENGAGE_LICENSE_CODE` in `.env` (git-ignored, `.env.example` committed; value not recorded here) · debug mode: verbose except when `APP_VARIANT=production` · `push.mode`: development / production · Android extras: Install Referrer added · static linking on (`ios.useFrameworks: static`), so every CocoaPods run needs `WEBENGAGE_DISABLE_SPM=true` · `iPhoneDeploymentTarget` 15.1 · defaults mode: off · Full depth on every Goal, no overrides.
Identity: `user.id` is the account id; the seeded demo account uses the test user id the client named (`src/context/AppContext.tsx:38`). Persisted app state key is `weshop:state:v2` (`src/context/AppContext.tsx:21`), so installs from before this change start clean. The app keeps no inbox list of its own.

## Goals
| Goal | Depth | Status | Client confirmation | Updated |
|---|---|---|---|---|
| Init | — | written, prebuilt, built and run on Android 15 emulator and iPhone 17 Pro Max simulator | pending | 2026-10-19 |
| Tracking User | Full | written | pending | 2026-10-19 |
| Tracking Events | Full | written (13 events) | pending | 2026-10-19 |
| Push | Full | written (Android + iOS + click callback) | pending — credentials upload and device check | 2026-10-19 |
| In-App | Full | written (screen tracking, 4 callbacks, deep-link routing) | pending | 2026-10-19 |
| In-Line | Full | written; 4 placements from the dashboard's `v4.js` (android and ios) | pending | 2026-10-19 |
| Inbox | Full | written; SDK messages only | pending | 2026-10-19 |

In-Line placements (screen name is the campaign's page rule, case included; ids from each platform's `properties` list):
| Screen | Android / iOS placeholder | Campaign | Mechanism |
|---|---|---|---|
| `home` | `home_banner` / 1001 | 311ol71 (banner) | `WEInlineWidget` |
| `screen1` | `S1P2` / 2 | ~2o22db2 (text) | `WEInlineWidget` |
| `screen3` | `S3P1` / 31 | 349ksnn (custom view) | `registerWEPlaceholderCallback` + `trackImpression` / `trackClick` |
| `screen4` | `S4P1` / 41 | 2k75i6o (throws) | `WEInlineWidget` + `onPlaceholderException` |

Seen by the agent in the dev run (not client-reported):
- Android: `WebEngage Successfully Initialized`; FCM token present in the SDK's own log; events logged to the server; Home loaded; no fatal exception. In-Line: banner (311ol71), text view (~2o22db2) and custom view (349ksnn) delivered data and rendered; custom view sent `app_personalization_view` on show and `app_personalization_click` on tap; 2k75i6o rendered normally (no exception). Inbox: the same two messages the REST endpoint returns for the test user, `inbox_notification_view` sent for each; first page `hasNext: true`, second page empty.
- iOS: `Verification complete. WebEngage SDK initiated.`; environment US; App Group configured; session start and event reporting in the log; In-App campaign displayed. In-Line: banner, text view and custom view rendered; 2k75i6o raised `Campaign failed to render in set time.` through `onPlaceholderException` and was handled (hidden, status shown, no crash). Inbox: the same two messages, same paging behaviour.
- Screen sequence checked: leaving a screen unmounts its widget before the next screen's widget registers (JS log `unmount` / `removeProperty` before the next `registerProperty`).

## Files changed
| Goal | File:line | What |
|---|---|---|
| Init | `app.config.js:1`, `:28`, `:39-41`, `:48` | license read, `webengage-expo` plugin and props, `webengage-expo-push` |
| Init | `app.json:45` | `expo-build-properties`, `useFrameworks: static` |
| Init | `plugins/withWebEngageAndroidExtras.js:5-8` | adds Install Referrer dependency |
| Init | `src/analytics/WebEngageManager.ts:17`, `:68`, `:83`, `:110` | availability flag, guarded wrapper, `safeCall`, `init()` |
| Init | `src/app/_layout.tsx:102-105` | `init()`, `registerCallbacks()`, personalization and inbox init |
| Init | `.env.example`, `.gitignore` | license placeholder; `.env`, `google-services.json` ignored *(line not re-verified)* |
| Tracking User | `src/context/AppContext.tsx:164-165`, `:220-221`, `:244-245`, `:257`, `:269` | login / sync on restore, sign-in, sign-up, logout, profile update |
| Tracking User | `src/context/AppContext.tsx:380-382` | channel opt-in |
| Tracking User | `src/analytics/tracking.ts` | `syncUser`, `track`, property builders *(line not re-verified)* |
| Tracking Events | `src/context/AppContext.tsx:246`, `:252`, `:271`, `:294`, `:304`, `:333`, `:338`, `:346`, `:368`, `:382` | Signup Completed, Guest Session Started, Profile Updated, cart, coupon, wishlist, Order Placed, Notification Preference Changed |
| Tracking Events | `src/app/(tabs)/search.tsx:37`, `src/app/product/[id].tsx:63` | Product Searched, Product Shared |
| Push | `src/app/_layout.tsx:2`, `:111` | background-task side-effect import; Android push hook |
| Push | `src/app/(tabs)/index.tsx:21` | `requestPushPermissionAndOptIn()` |
| Push | `src/analytics/WebEngageManager.ts:192` | `push.onClick` |
| Push | `src/analytics/webengageBackgroundTask.ts`, `useWebEngageAndroidPush.ts`, `pushPermission.ts` | *(line not re-verified)* |
| In-App | `src/analytics/WebEngageManager.ts:176`, `:185`, `:199-214` | `trackScreen`, `registerCallbacks`, `notification.onPrepare/onShown/onClick/onDismiss` |
| In-App | `src/app/_layout.tsx:51-52`, `:58` | screen-tracking call + tracked-screen store; deep-link readiness |
| In-App | `src/analytics/screens.ts:11`, `:56` | Home route reported as `home` (was `Home`) |
| In-App | `src/analytics/routeDeepLink.ts:12` | deep-link router; `inboxCount` required lazily to remove a require cycle |
| In-Line | `src/analytics/inlinePlacements.ts:22`, `:62`, `:70`, `:75` | placement table, platform id, tracked-screen store and hook |
| In-Line | `src/components/InlineSlots.tsx:26`, `:36`, `:58`, `:149` | focus + `screen()` gate, primer widget, widget slot, custom-view slot |
| In-Line | `src/components/InlineSlots.tsx:162`, `:170`, `:179`, `:193` | register, `trackImpression`, deregister, `trackClick` |
| In-Line | `src/components/InlineSlots.tsx:99` | `onPlaceholderException` handler (hides the widget) |
| In-Line | `src/components/HomeInlineBanner.tsx:9` | Home banner |
| In-Line | `src/app/_layout.tsx:118`, `:92-94` | `InlinePrimer`; routes for screens 1, 3, 4 |
| In-Line | `src/analytics/screens.ts:28-30` | route to screen-name mapping for the three lab screens |
| In-Line | `src/app/inline/screen1.tsx`, `screen3.tsx`, `screen4.tsx`, `src/components/InlineLab.tsx` | lab screens *(line not re-verified)* |
| In-Line | `src/app/(tabs)/test-lab.tsx:121-152` | In-Line placements entry points |
| In-Line | `src/analytics/webengagePersonalization.ts` | guarded helpers *(line not re-verified)* |
| Inbox | `src/app/inbox.tsx:33`, `:48`, `:71`, `:93`, `:102` | page fill size, first page, next page, view and click tracking |
| Inbox | `src/app/(tabs)/_layout.tsx:19`, `:23`, `:32`; `src/app/(tabs)/account.tsx:16`, `:25` | WebEngage count badge and menu detail, reset on entry tap |
| Inbox | `src/analytics/webengageInbox.ts`, `src/analytics/inboxCount.ts` | helpers, count store *(line not re-verified)* |
| Inbox | `src/context/AppContext.tsx`, `src/types/index.ts` | static message list, its type and unread helpers removed |
| Local-only patch | `node_modules/react-native-we-personalization/ios/views/WEPersonalizationView.h:8-12` | `__has_include` guard around the generated Swift header |
| Local-only patch | `node_modules/react-native-webengage-inbox/ios/WEInboxReact.mm:12-16` | same guard |
| Generated | `android/**` (tracked files modified), `ios/**` (untracked) | prebuild output |

## Pending at the client
- Upload the FCM service-account key (Firebase project of `google-services.json`) and the APNs `.p8` key; send a test push to a real device.
- Device checks not yet reported for any channel; no test campaign of any channel has been confirmed by the client.
- In-App: tap a campaign button and confirm its link routes correctly.
- Inbox: send a new push to the test user and check the bell badge and list on a device.
- Custom view tap on iOS (checked on Android only).
- Apple portal: extension bundle IDs and App Group for device signing (`devTeam` not set).
- Decision on tracked `android/` (license in `AndroidManifest.xml`).
- Decision on the two `node_modules` patches (below).

## Recorded risks and refusals
- **Android, first In-Line screen after launch (package behaviour).** `react-native-we-personalization` 2.1.0 registers its screen-change listener inside `createViewInstance`, so only when the first native widget exists (`android/src/main/java/com/webengage/we_personalization_rn/WEPersonalizationViewManagerImpl.java:43`). `WEPluginCallbackHandler.currentScreen` (`handler/WEPluginCallbackHandler.java:16`, set at `:50-53`) therefore stays null for a `screen()` sent before that, `setScreenNavigatorCallback` (`:19-37`) never calls `loadView`, and the SDK logs `No Property found for <id>, hence caching the property`. The skill's Hard Rule 1 order (screen first, widget after) produces this on the launch screen. Worked around with `InlinePrimer` (`src/components/InlineSlots.tsx:36`), a zero-size widget mounted for the app's lifetime. Not fixed upstream. By reading the source, screens opened after the first widget exists should be unaffected; that was not tested without the primer.
- **Home is reported as `home`.** The dashboard's In-App and In-Line rules for Home match lower case; rules written for `Home` (capital) such as `visa_cart_abandonment` and `visa_promotion` no longer match.
- **iOS placeholder ids 2, 31, 41 are below 1000 on a New Architecture app** (Hard Rule 13 warns they can render in the wrong place). Used as the client gave them; all rendered in their own bounds in this run. Not a guarantee for other devices or campaigns.
- **Two local-only edits inside `node_modules`** (files above) were needed to build iOS with static frameworks. Both import the generated Swift header unguarded: `react-native-we-personalization` 2.1.0 in `WEPersonalizationView.h`, `react-native-webengage-inbox` 2.1.0 in `WEInboxReact.mm`. A fresh `npm install` removes both edits and the iOS build fails with `'react_native_we_personalization-Swift.h' file not found` / `'react_native_webengage_inbox-Swift.h' file not found`. Not committed, not upstream.
- **Saved app state reset.** The storage key moved to `weshop:state:v2` and the demo account id changed, so existing installs start clean.
- Tracked `android/` holds the license in `AndroidManifest.xml` (client informed).
- The license code was printed to the agent's terminal output more than once during testing (post-check, an Android SDK config log line, and an In-App campaign's text); a device FCM token was also printed from the same log. Neither is written in any file here.
- `google-services.json` uses a shared Firebase project; git-ignored with the client's approval.
- Static linking affects the whole iOS app.
- Phone is intentionally not sent (stored without country code; E.164 required).
- Errors inside the app's own WebEngage handlers are swallowed and shown as dev warnings, by design. The throwing campaign's exception is logged as a dev warning.
- The `Install Referrer` dependency is Android-only.
- No Hard Rule requests were declined.

## Unverified
- Push: no push was sent or received on either platform; Android FCM token registration was seen in the SDK log, iOS APNs registration not checked.
- In-App: campaigns displayed on both platforms; click callback and deep-link routing not exercised.
- In-Line: the exception handler was exercised on iOS only; on Android the same campaign (2k75i6o) rendered normally. Custom-view impression and click were seen on Android only. The package logs `Running on Legacy` under New Architecture; not investigated.
- Inbox: message list, view tracking and paging seen on both platforms; read / unread / delete actions and click tracking not exercised. The SDK's count was 0 for the older messages, which is its "new since reset" meaning, so the bell badge only shows after a new message arrives.
- An earlier snapshot of this file said the Android bell badge came from the Inbox. It came from the app's own static seed list, which has since been removed.
- Android SDK logs `Environment: aws` for the configured value `us`; the mapping was not checked against SDK source.
- Android logs `Unable to initialize location module. Please use play-services-location version 21.0.1 or higher` repeatedly. Location tracking is disabled in the configuration, and location was not part of the request; no crash followed.
- iOS init line seen is `Verification complete. WebEngage SDK initiated.`, not the `WebEngage SDK Initialized` wording the skill's progress template mentions.
- iOS logs `Error committing transaction: cannot commit - no transaction is active` from the SDK's own SQLite layer next to buffered events; events still reported. Not investigated.
- Standard-attribute edits (email) on iOS: behavior for a changed value unconfirmed.
- Nothing has been reported by the client as not working.
