# WebEngage integration — support summary
Generated 2026-10-19 · skill: webengage-integration-expo v1.0 · compatibility record: references/compatibility.md (last row 2026-10-16)

## App
WE Shop · slug `we-shop` · iOS `com.webEngage.prodSwift` · Android `com.webengage.reactSample` · Expo SDK ~55.0.31 · React Native 0.83.10 · React 19.2.0 · TypeScript · Expo Router · New Architecture on · native folders: android prebuilt-and-kept (20 tracked files), ios CNG · build path local (no eas.json)

## Packages (declared → lockfile-resolved)
react-native-webengage ^2.1.0 → 2.1.0 · webengage-expo ^0.0.3 → 0.0.3 · Pods: WebEngage 7.1.0

## Configuration
Data center US (iOS `DEFAULT` / Android `us`) · license source: env var `WEBENGAGE_LICENSE_CODE` in `.env` (value never recorded) · debug mode: on except `APP_VARIANT`/`EAS_BUILD_PROFILE` = `production` · `push.mode` development · `WEGAutoRegister` true · plugin entry: explicit path form via `app.config.js` · Install Referrer added · defaults mode off

## Goals
| Goal | Depth | Status | Client confirmation | Updated |
|---|---|---|---|---|
| Init | Quick | Complete — prebuild post-checks passed on both platforms; `pod install` run | pending | 2026-10-19 |
| Tracking User | Quick | Written | pending | 2026-10-19 |
| Tracking Events | Quick | Written | pending | 2026-10-19 |
| In-App | Quick | Complete (no code) | pending | 2026-10-19 |

## Files changed
| Goal | File:line | What |
|---|---|---|
| Init | app.config.js:22 | plugins array with WebEngage entry |
| Init | plugins/withWebEngageAndroidExtras.js:1 | Install Referrer |
| Init | src/analytics/WebEngageManager.ts:101 | guarded wrapper, `init()` |
| Init | src/app/_layout.tsx:60 | `WebEngageManager.init()` |
| Init | .env.example:1, .gitignore:34 | env placeholder, ignore `.env` |
| Init | android/app/src/main/AndroidManifest.xml, android/app/build.gradle | prebuild output (tracked) |
| Tracking User | src/context/AppContext.tsx:101, 211, 264, 286, 296 | `identifyUser`, login/signup/restore, logout |
| Tracking Events | src/context/AppContext.tsx:316, 391 | `Added To Cart`, `Order Placed` |

Attributes: `email` (String, standard), `City` (String, custom). Events: `Added To Cart` (Product ID, Product Name, Category, Price, Quantity, Currency), `Order Placed` (Order ID, Amount, Item Count, Payment Method, Coupon, Currency); custom editor rows are merged in, standard keys win.

## Pending at the client
Native builds on Android and iOS not yet run · init lines / Live Users not yet reported · event and profile checks not yet reported · no In-App test campaign yet · iOS signing needs the Push capability

## Recorded risks and refusals
- `android/` tracked: prebuild wrote the license literal into the tracked `AndroidManifest.xml` (client approved by name). No refusals.

## Unverified
- Android login, attributes and events: written, not observed running.
- iOS login, attributes and events: observed once on a device in an earlier run, not on this project.
- In-App display: not observed.
- Re-sending a different email on iOS: unconfirmed.
- The wrapper's safety guard: designed, not run.
