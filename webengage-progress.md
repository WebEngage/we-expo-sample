# WebEngage in WE Shop — where things stand
Updated 2026-10-19 · Full setup · Android and iOS · Push, In-App, In-Line, Inbox

## Done
- WebEngage is set up in your app: the packages, the plugin settings in `app.config.js`, your license (read from `.env`, never written into code), and one file, `src/analytics/WebEngageManager.ts`, that every WebEngage call goes through. If WebEngage can't start, the app keeps working.
- Sign-in, sign-up and sign-out are reported, and the profile details (name, email, gender, birth date, city, notification opt-ins) are sent. Phone is not sent on purpose, because it needs the country code first.
- 13 shopping events are reported, for example Added To Cart, Order Placed, Coupon Applied and Product Searched. Every screen is reported as the user moves around.
- **Inbox:** the Notifications screen shows only what WebEngage returns for the signed-in user. The app's own made-up message list is gone, and nothing is stored locally. The demo account now uses the test user id you named, so it shows that user's two messages. They match what the WebEngage inbox endpoint returns for that user.
- **In-Line:** four placements from your dashboard are in the app: the banner on Home, a text view on "screen 1", a custom view on "screen 3", and a campaign that throws on "screen 4". Open the last three from Test Lab. Each screen lists its placeholder, campaign and live status.
- Push (Android and iOS), In-App messages (with links that open the right screen), and the Test Lab tab are in place too.
- I built and ran the app on the Android 15 emulator and the iPhone 17 Pro Max simulator. Both start WebEngage, send events, show the Home banner, show the text and custom views, and list the two Inbox messages. The throwing campaign was handled without a crash on iOS. On Android it rendered normally.

## Worth knowing
- Home is now reported as `home` (lower case), because your dashboard's In-App and In-Line rules match that exactly. Rules written for `Home` with a capital H, such as `visa_cart_abandonment` and `visa_promotion`, will not match.
- The first launch after this update starts clean (login, cart and orders reset), because the saved data moved to a new version.
- On Android the app mounts one invisible, zero-size In-Line widget at startup. Without it, the first screen after launch never loads its campaign. This works around a gap in `react-native-we-personalization`.
- The iOS ids 2, 31 and 41 are below 1000 and the app uses New Architecture. The skill warns that can place a campaign in the wrong spot. In my run every one rendered correctly.
- The Inbox bell badge shows WebEngage's count of new messages since the last reset. It stays empty for older messages, so a new push is needed to see it.

## Waiting on you
- **Before you build iOS on another machine:** two small fixes live inside `node_modules`, so a fresh `npm install` removes them and the iOS build fails again. They are in `react-native-we-personalization/ios/views/WEPersonalizationView.h` and `react-native-webengage-inbox/ios/WEInboxReact.mm`. Tell me if you want them saved as a proper patch.
- Run `pod install` and iOS builds with `WEBENGAGE_DISABLE_SPM=true` set (your static linking needs it).
- Upload the FCM service-account key (from the Firebase project behind `google-services.json`) and the APNs `.p8` key in the WebEngage dashboard, then send a test push to a real device. No push has been sent yet.
- Tap an In-App campaign's button and check its link opens the right screen. I only saw the campaign appear.
- Send a new push to the test user, then check the bell badge and the Inbox on a device.
- Tap the custom view on screen 3 on iOS. I checked the tap on Android only.
- Apple developer portal: bundle IDs for the notification extensions and the App Group, for signing on a real device.
- For teammates and CI: copy `.env.example` to `.env` and set `WEBENGAGE_LICENSE_CODE` (EAS builds need it as an EAS variable).
- Decide about `android/`: it is tracked in git and holds your license in `AndroidManifest.xml`. Either run `git rm -r --cached android` or don't commit it.

## How to check each piece
- **Setup:** on Android, run `adb logcat -s WebEngage` and look for `WebEngage Successfully Initialized`. On iOS, look in the Xcode or simulator log for `Verification complete. WebEngage SDK initiated.` Live Users on the dashboard also shows it.
- **In-Line:** Home shows the banner. Test Lab > In-Line placements opens the other three; each shows Rendered, or the handled exception.
- **Inbox:** the bell opens Notifications. Pull down to refresh.
- **Events, Push, In-App:** use the Test Lab tab and send a test campaign from the dashboard. Ask me for the step-by-step.

## How to undo
Data already sent to WebEngage stays there. Undoing the code only stops new data.
- **Setup:** remove the `webengage-expo` and `webengage-expo-push` entries and the Android extras plugin from `app.config.js`; delete `src/analytics/WebEngageManager.ts` and its call and import in `src/app/_layout.tsx`; remove the license lines from `.env` and `.env.example`; run `npm uninstall react-native-webengage webengage-expo`. The `ios/` folder is regenerated by the next prebuild. `android/` is tracked, so `git restore -- android` brings back the committed version (this also discards uncommitted edits there). Rebuild afterwards.
- **User details and events:** delete the calls in `src/context/AppContext.tsx`, `src/app/(tabs)/search.tsx` and `src/app/product/[id].tsx`, and the helpers in `src/analytics/tracking.ts`.
- **Push:** delete `webengageBackgroundTask.ts`, `useWebEngageAndroidPush.ts` and `pushPermission.ts`, their imports in `src/app/_layout.tsx` and `src/app/(tabs)/index.tsx`, and the `webengage-expo-push` entry; `npm uninstall webengage-expo-push`, and `expo-notifications` and `expo-task-manager` only if nothing else uses them.
- **In-App:** delete the callbacks in `registerCallbacks()` and the screen-tracking effect in `src/app/_layout.tsx`.
- **In-Line:** delete `src/analytics/inlinePlacements.ts`, `src/components/InlineSlots.tsx`, `InlineLab.tsx` and `HomeInlineBanner.tsx`, the `src/app/inline/` folder, the three routes in `src/app/_layout.tsx`, the In-Line section in Test Lab, and `webengagePersonalization.ts`; remove the `expo-build-properties` entry from `app.json`; `npm uninstall react-native-we-personalization`.
- **Inbox:** delete `src/app/inbox.tsx`, `webengageInbox.ts` and `inboxCount.ts` and the bell in `src/app/(tabs)/_layout.tsx`; `npm uninstall react-native-webengage-inbox`.
- **These notes:** delete `.webengage/`, `webengage-progress.md` and `webengage-support-summary.md`. Nothing depends on them.

## What's next
- Nothing is left to build from what you asked for. What remains is the dashboard setup and device checks above.
