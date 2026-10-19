# agent.md

State log for resuming this WebEngage integration. Never contains secrets.

## Project Identity
- Project: WE Shop (slug `we-shop`)
- Android package / iOS bundle ID: com.webengage.reactSample / com.webEngage.prodSwift
- Skill: webengage-integration-expo
- First session started: 2026-10-19

### Build Environment
| Item | Value | Source |
|---|---|---|
| Expo SDK version | ~55.0.31 | package.json |
| React Native / React | 0.83.10 / 19.2.0 | package.json |
| Node.js | v22.22.2 | local `node -v` |
| Package manager | npm | package-lock.json |
| eas-cli | no eas.json | — |
| iOS — CocoaPods | 1.16.2 | ios/Podfile.lock |
| iOS — deployment target | 15.1 (Podfile default) | ios/Podfile |

---

## Locked Facts (Do Not Re-Ask)

| Fact | Value | Locked in Goal |
|---|---|---|
| Platforms integrated | Both | Init |
| Integration depth | Quick — client said "Quick", 2026-10-19 | Depth gate |
| Defaults mode | Off | — |
| Depth overrides | None | — |
| Existing data model — attributes | Not asked (client approved the proposed list as-is) | Tracking User |
| Existing data model — events | Not asked (client approved the proposed list as-is) | Tracking Events |
| License Code (source, not value) | `WEBENGAGE_LICENSE_CODE` in `.env` (git-ignored via `.gitignore`); read by `app.config.js` | Init |
| Data Center Region | US — iOS `DEFAULT`, Android `us` | Init |
| Debug Mode | build-profile-driven: verbose/`debug: true` unless `APP_VARIANT`/`EAS_BUILD_PROFILE` = `production` | Init |
| `react-native-webengage` Version | 2.1.0 (declared ^2.1.0) | Init |
| `webengage-expo` Version | 0.0.3 (declared ^0.0.3) | Init |
| `webengage-expo-push` Version | not installed | — |
| Expo SDK Version | ~55.0.31 | Pre-Flight |
| Expo config file | `app.json` + `app.config.js` (Init created `app.config.js`; `app.json` unchanged) | Init |
| Entry point | `expo-router/entry`; root layout `src/app/_layout.tsx` | Pre-Flight |
| Navigation library in actual use | Expo Router (`src/app/`, `Stack.Protected` guards in root layout) | Pre-Flight |
| Native-folder state — per platform | android: prebuilt-and-kept — 20 tracked files (also in `.gitignore`); ios: CNG (ignored, nothing tracked) | Pre-Flight |
| Apply steps | Config check: run 2026-10-19 — passed · Prebuild (`--no-install --platform all`): run 2026-10-19 · `pod install`: run 2026-10-19 | Init |
| Build path | local (`expo run:*`); no eas.json | Init |
| Native build + init check — Android (client-run) | Pending — client to run | Init |
| Native build + init check — iOS (client-run) | Pending — client to run | Init |
| Language | TypeScript | Pre-Flight |
| New Architecture | on (Expo SDK 55 default) | Pre-Flight |
| Android Install Referrer | Added (`plugins/withWebEngageAndroidExtras.js`; `implementation` line seen in generated `android/app/build.gradle`) | Init |
| Existing Android Push Transport Found | none | Pre-Flight |
| WebEngage Analytics Wrapper — File Path | `src/analytics/WebEngageManager.ts` | Init |
| Wrapper — Methods Present | init / login / logout / setEmail / setAttribute / trackEvent | running list |
| Wrapper — `registerCallbacks()` Blocks | none (method not created) | — |
| Other Existing Analytics Wrapper | No | Pre-Flight |
| Login identifier type | userId — account `id` (e.g. `u_demo`, `u_<uid>`), stable system id | Tracking User |
| Guest mode / restored sessions | guest: no `login()`, `logout()` only after a sign-in · restored session: `login()` + attributes re-sent at hydration | Tracking User |
| SDK Authentication (JWT) enabled | No | Tracking User |
| Hashed email/phone attributes in use | No | Tracking User |
| Event naming convention | Title Case | Tracking Events |

---

## Goal Status

| Goal | Status | Scope applied | Confirmation (client-reported) | Last Updated |
|---|---|---|---|---|
| Integration (Init) | Complete on Android and iOS — prebuild post-checks passed; `Podfile.lock` lists `react-native-webengage` 2.1.0 and `WebEngage` 7.1.0 | — | pending | 2026-10-19 |
| Tracking User | Complete (written) | Quick — login, logout, 2 attributes | pending | 2026-10-19 |
| Tracking Events | Complete (written) | Quick — 2 events | pending | 2026-10-19 |
| Engagement Channels — In-App | Complete — no code at Quick | Quick | pending | 2026-10-19 |

---

## Files Changed

| Goal | File | What was added or changed | Last known line | Added / edited | Date |
|---|---|---|---|---|---|
| Init | package.json, package-lock.json | `react-native-webengage`, `webengage-expo` | — | edited | 2026-10-19 |
| Init | app.config.js | plugin entry, license from env, license guard | 22 | added | 2026-10-19 |
| Init | plugins/withWebEngageAndroidExtras.js | Install Referrer plugin | 1 | added | 2026-10-19 |
| Init | .env.example | placeholder license | 1 | added | 2026-10-19 |
| Init | .gitignore | `.env` line | 34 | edited | 2026-10-19 |
| Init | src/analytics/WebEngageManager.ts | guarded wrapper | 101 (`init`) | added | 2026-10-19 |
| Init | src/app/_layout.tsx | import + `init()` effect | 60 | edited | 2026-10-19 |
| Init | android/app/src/main/AndroidManifest.xml, android/app/build.gradle | prebuild output (tracked files) | — | edited by prebuild | 2026-10-19 |
| Tracking User | src/context/AppContext.tsx | `identifyUser()`; calls at login, signup, session restore, logout | 101, 211, 264, 286, 296 | edited | 2026-10-19 |
| Tracking Events | src/context/AppContext.tsx | `Added To Cart`, `Order Placed` | 316, 391 | edited | 2026-10-19 |

### Implemented attributes (Quick, 2)
| Attribute | Type | Wrapper method | PII |
|---|---|---|---|
| email | String (standard) | `setEmail` | ⚠️ ordinary contact data — flagged in approval |
| City | String (custom) | `setAttribute('City', …)` | No |

Left out: first/last name, phone, gender, birth date, custom editor rows (not sent as profile attributes).

### Implemented events (Quick, 2)
| Event | Properties (type) | PII | Call site |
|---|---|---|---|
| Added To Cart | Product ID (String), Product Name (String), Category (String), Price (Number), Quantity (Number), Currency (String) + custom editor rows | No | AppContext.tsx:316 (`addToCart`; "Buy Now" also fires it) |
| Order Placed | Order ID (String), Amount (Number), Item Count (Number), Payment Method (String), Coupon (String, only if used), Currency (String) + custom editor rows | No | AppContext.tsx:391 (`placeOrder`) |

Not implemented (candidates left out at Quick): wishlist add/remove, sign up completed, search, coupon applied, address saved.

## Open at the Client

| Item | Goal | Raised | Status |
|---|---|---|---|
| Build and run on Android (`npx expo run:android`) and iOS (`npx expo run:ios`); restart any running Metro first | Init | 2026-10-19 | pending |
| Confirm init: Android `adb logcat -d -s WebEngage` → `Successfully Initialized`; iOS Xcode console → `WebEngage SDK Initialized`; or Live Users | Init | 2026-10-19 | pending |
| Check user profile and the two events on the dashboard | Tracking User / Events | 2026-10-19 | pending |
| Create a live In-App campaign targeting a test user to see it display | In-App | 2026-10-19 | pending |
| Signing needs the Push capability on iOS | Init | 2026-10-19 | pending |

---

## Goal Log

### 2026-10-19 — Pre-Flight
- Language: TypeScript — Expo SDK 55 — New Arch on
- Navigation: Expo Router
- Native folders: android prebuilt-and-kept (20 tracked), ios CNG — build path local
- Auth flow: AppContext.tsx `login` / `signup` / `continueAsGuest` / `logout`; session restored from AsyncStorage at hydration
- Leftovers: `react-native-webengage` and `webengage-expo` were in `node_modules` but not in package.json; stale WebEngage keys in generated `ios/WEShop/Info.plist` — overwritten by this prebuild (checked)
- One git stash from an earlier session left untouched

### 2026-10-19 — Integration (Init)
- Status: Complete (prebuild checks passed) on Android and iOS
- Files changed: see table above
- Native build (client-run): not yet reported

### 2026-10-19 — Tracking User
- Status: Quick 2 attributes
- Identifier: userId (pre-filled from login code)

### 2026-10-19 — Tracking Events
- Status: Quick 2 events — Title Case

### 2026-10-19 — Engagement Channels — In-App
- Status: complete, no code at Quick (works automatically after Init)

---

## Issues Reported by the Client

| Symptom | Cause | Fix |
|---|---|---|
| | | |

---

## Known Risks / Flags Raised

| Risk | Goal | Type | Resolved |
|---|---|---|---|
| `android/` tracked in git: prebuild wrote the license literal into tracked `AndroidManifest.xml`; development-mode values baked in. Client approved by name; do not stage that file or stop tracking `android`. | Init | Rule deviation (Core Rule 10) | No |

## Unresolved Questions Across Sessions

| Question | Raised in Goal | Status |
|---|---|---|
| Does iOS apply an edited email (a different value) after the first is set? Unconfirmed. | Tracking User | Open — ask client to test on iOS |
