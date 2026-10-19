# agent.md — WebEngage Expo integration state (no secrets)

## Project Identity
- App: WE Shop (`we-shop`) · iOS `com.webEngage.prodSwift` · Android `com.webengage.reactSample`
- Expo SDK 55.0.31 · React Native 0.83.10 · React 19.2.0 · TypeScript (strict) · Expo Router (routes in `src/app/`, alias `@/` → `src/`)
- Package manager: npm · Config: `app.json` + `app.config.js` (added) · New Architecture on
- Native folders: `ios/` generated, git-ignored, nothing tracked (CNG) · `android/` ignored-but-tracked (20 files) → prebuilt-and-kept
- Build path: local (`expo run:*`), no `eas.json`

## Locked Facts
| Fact | Value |
|---|---|
| Integration depth | Full (all Goals) · Depth overrides: none |
| Channels | Push, In-App, In-Line, Inbox |
| Platforms | Android + iOS |
| Data center | US — iOS `DEFAULT`, Android `us` |
| License source | `WEBENGAGE_LICENSE_CODE` in `.env` (git-ignored; `.env.example` committed) |
| Debug mode | verbose in dev, off when `APP_VARIANT=production` (or EAS profile `production`) |
| `push.mode` | development / production, same expression for `webengage-expo-push` |
| Packages (declared) | react-native-webengage ^2.1.0 · webengage-expo ^0.0.3 · webengage-expo-push ^1.0.0 · react-native-we-personalization ^2.1.0 · react-native-webengage-inbox ^2.1.0 · expo-notifications ~55.0.27 · expo-task-manager ~55.0.20 · expo-build-properties ~55.0.18 |
| Wrapper | `src/analytics/WebEngageManager.ts` (guarded; `init()`, login/logout, attribute setters, `trackEvent`, `trackScreen`, `registerCallbacks`) |
| Helper files | `webengagePersonalization.ts`, `webengageInbox.ts` (guarded free-function packages) |
| Android push transport | `expo-notifications` + `expo-task-manager` (installed with permission); `google-services.json` at repo root, referenced by `android.googleServicesFile`; package matches |
| iOS push | `webengage-expo-push`, Rich Push on, `iPhoneDeploymentTarget` 15.1 = app target |
| Static linkage | on (`expo-build-properties` → `ios.useFrameworks: static`) → `WEBENGAGE_DISABLE_SPM=true` on every CocoaPods run |
| Identifier | `user.id` (system-generated); guests never logged in; restored session logs in at hydration |
| Phone | not sent (stored without country code; E.164 required) |
| Existing data model | none stated by client; skill naming (Title Case) |
| Prebuild | config check run; `expo prebuild` ran; iOS needed `--clean --platform ios` (stale NSE target from an earlier prebuild; `ios/` untracked); Android plain merge |
| Install Referrer | added (`plugins/withWebEngageAndroidExtras.js`) |

## Goal Status
| Goal | Depth | Status | Confirmation |
|---|---|---|---|
| Init | — | configured, applied, built and run on Android_15 emulator and iPhone 17 Pro Max simulator (SDK initialised on both; 2026-10-19) | pending |
| Tracking User | Full | written | pending |
| Tracking Events | Full | written | pending |
| Push | Full | written (Android + iOS + click callback) | pending — credentials upload and device check |
| In-App | Full | written (screen tracking + 4 callbacks + deep-link routing) | pending |
| In-Line | Full | written; four placements from the dashboard's `v4.js` (android + ios); each seen rendering or handling its result on both platforms, 2026-10-19 | pending |
| Inbox | Full | written; shows only what WebEngage returns for the signed-in user (the demo account uses the test user id the client named); same 2 messages as the REST endpoint, seen on both platforms, 2026-10-19 | pending |

## Tracking User (attributes)
| Attribute | Type | Wrapper method | PII |
|---|---|---|---|
| First Name / Last Name | standard | `setFirstName` / `setLastName` | yes |
| Email | standard | `setEmail` | yes |
| Gender | standard | `setGender` (lower-case) | yes |
| Birth Date | standard (`yyyy-mm-dd`) | `setBirthDate` | yes |
| City | String (custom) | `setAttribute('City')` | yes |
| "Add custom data" rows | String/Number/Boolean/Date(ISO)/Array | `setAttribute(name)` — names ≥ 50 chars or `we_*` skipped | per tester |
| Channel opt-ins (push, email, sms, whatsapp) | opt-in | `instance.user.setOptIn` (Notification Settings) | no |
Call sites: `src/context/AppContext.tsx` (login, signup, hydration restore, logout, updateProfile, setOptIn), `src/analytics/tracking.ts` (`syncUser`).

## Tracking Events (all via `track()`; custom data merged, standard properties win)
| Event | Properties | Site |
|---|---|---|
| Added To Cart | Product ID/Name, Brand, Category, Price, Currency, Quantity, Size?, Color? | `addToCart` (also fires from Buy Now) |
| Removed From Cart | same + Quantity | `removeFromCart`, `updateQty` ≤ 0 |
| Added To / Removed From Wishlist | product props | `toggleWishlist` |
| Coupon Applied / Coupon Removed | Coupon Code, Cart Value, Currency | `applyCoupon` / `removeCoupon` |
| Order Placed | Order ID, Amount, Subtotal, Discount, Shipping, Item Count, Coupon Code?, Payment Method, Currency, Products[] | `placeOrder` |
| Signup Completed | Method | `signup` |
| Guest Session Started | — | `continueAsGuest` |
| Profile Updated | Updated Fields[] | `updateProfile` |
| Notification Preference Changed | Channel, Enabled | `setOptIn` |
| Product Searched | Query, Category, Sort | `src/app/(tabs)/search.tsx` submit |
| Product Shared | product props | `src/app/product/[id].tsx` |
Not tracked on purpose: page views (screen tracking), addresses. Test Lab sends the tester's own events/screens/attributes.

## Screen tracking
Expo Router, one effect in `Navigator` (`src/app/_layout.tsx`); held until hydrated and route matches sign-in state. Names/data: `src/analytics/screens.ts`.

## Channel files
- Push: `webengageBackgroundTask.ts` (side-effect import first line of `_layout.tsx`, Android only), `useWebEngageAndroidPush.ts`, `pushPermission.ts` (called from Home), `push.onClick` in `registerCallbacks`.
- In-App: `notification.onPrepare/onShown/onClick/onDismiss` in `registerCallbacks`; `routeDeepLink.ts` (queues until hydrated + signed in).
- In-Line: placements in `src/analytics/inlinePlacements.ts` (from `v4.js`): home `home_banner`/1001 (banner `311ol71`), screen1 `S1P2`/2 (text `~2o22db2`), screen3 `S3P1`/31 (custom view `349ksnn`), screen4 `S4P1`/41 (throws `2k75i6o`). Screen names are the dashboard's page rules, case included: Home is tracked as `home`. Slots in `src/components/InlineSlots.tsx`: a widget is mounted only while its screen is focused AND `screen()` has already named it (Hard Rule 2: one screen registered at a time); banner/text/throwing use `WEInlineWidget`, custom view uses `registerWEPlaceholderCallback` + `trackImpression`/`trackClick`. `InlinePrimer` (mounted in the root layout) is an Android workaround, see Known Risks. Entry points: Home tab, Test Lab > In-Line placements, routes `src/app/inline/screen{1,3,4}.tsx`.
- Inbox: `src/app/inbox.tsx` (WebEngage messages only; the app's static message list was removed, nothing is seeded), `src/analytics/inboxCount.ts` (count store; reset on bell and Account entry taps and on a deep link to `/inbox`).

## Files Changed
`package.json`, `package-lock.json`, `app.json` (expo-build-properties static linkage), `app.config.js`, `plugins/withWebEngageAndroidExtras.js`, `.env.example`, `.gitignore`, `src/analytics/*`, `src/components/HomeInlineBanner.tsx`, `src/context/AppContext.tsx`, `src/app/_layout.tsx`, `src/app/inbox.tsx`, `src/app/(tabs)/{_layout,index,account,search,test-lab}.tsx`, `src/app/product/[id].tsx`; `src/analytics/routeDeepLink.ts` (lazy `inboxCount` require, removes a require cycle); generated by prebuild: `android/**` (tracked files modified), `ios/**`; `webengage-progress.md`, `webengage-support-summary.md`. Local-only, inside `node_modules` (lost on a fresh install): `react-native-we-personalization/ios/views/WEPersonalizationView.h` and `react-native-webengage-inbox/ios/WEInboxReact.mm` (`__has_include` guard on the generated Swift header, needed for the iOS static-framework build).

## Open at the Client
- Dashboard: upload FCM service-account key (from the Firebase project of `google-services.json`) and APNs `.p8` key; create In-Line placeholder `home_banner` / `1001`; ask support@webengage.com to enable Notification Inbox.
- Device checks for every channel (see `webengage-progress.md`).
- Decide about tracked `android/` (license now in `AndroidManifest.xml`): `git rm -r --cached android` or avoid staging it.
- Apple portal: extension bundle IDs and App Group for local device signing (`devTeam` not set).

## Known Risks / Flags
- **Android: first In-Line screen after launch.** `react-native-we-personalization` registers its screen-change listener only when its first native widget is created (`WEPersonalizationViewManagerImpl.java` `createViewInstance`), so a `screen()` sent before any widget exists (launch screen) is never seen and `loadView` never runs; the SDK logs `No Property found ... caching`. Worked around by `InlinePrimer`. Observed 2026-10-19; not fixed upstream.
- **Home is tracked as `home`** (was `Home`) to match the dashboard's In-App and In-Line rules. Dashboard rules written against `Home` (e.g. `visa_cart_abandonment`, `visa_promotion`) will not match.
- **Saved app state reset:** storage key is now `weshop:state:v2` and the demo account id is the test user id the client named (`src/context/AppContext.tsx:38`); existing installs start clean.
- iOS ids 2, 31, 41 are below 1000 on a New Architecture app (skill Hard Rule 13 warns they can render in the wrong place). Used as given; all rendered correctly in this run.
- Tracked `android/` now holds the license code in `AndroidManifest.xml` (client informed; options given). Debug logging baked in for non-production builds.
- `google-services.json` shared Firebase project (`prod-69bc0`); git-ignored on client's approval.
- iOS static linkage affects the whole app.
- Phone intentionally not sent. Standard-attribute edits (email) on iOS: behavior for a changed value unconfirmed.
- Errors thrown inside the app's own WebEngage handlers are swallowed and shown as dev warnings, by design.
- The license code was printed once to the agent's terminal output during a post-check (client's own sample key). It appeared again in an Android SDK config log line and in an In-App campaign text during the 2026-10-19 run, and a device FCM token was printed from the same log.
- Two `node_modules` edits (see Files Changed) are not durable; client not yet told whether to keep them as a patch.
- Metro started with `CI=1` does not watch files; restart it to pick up edits.

## Unresolved Questions
- In-Line: the exception handler was exercised on iOS only (screen4 threw "Campaign failed to render in set time."); on Android the same campaign rendered normally. Custom-view impression (`app_personalization_view`) and click (`app_personalization_click`) seen on Android; not checked on iOS. The package logs `Running on Legacy` under New Architecture, not investigated.
- Android SDK logs `Environment: aws` for the configured `us`; mapping not checked against SDK source.
- Android logs a repeated "Unable to initialize location module" (location tracking is disabled; not requested).
