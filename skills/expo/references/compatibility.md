# Compatibility — Where the Plugins Have Been Verified

`webengage-expo`'s peer dependencies are `expo: "*"` and
`react-native-webengage: ">=2.0.0"`. A wildcard peer range hides real
incompatibility, so **don't treat "npm installed without a warning" as
"supported."** This table is the only statement of what has been run.

**How to use it:**
- A combination **not listed is unverified.** Say so plainly to the
  client before relying on it — it may well work; nobody has confirmed
  it. This is a finding to surface, never a reason to refuse.
- A row records *what was observed*, not what's expected. Never edit a
  row to "verified" from reading code; only from a run, with its date.
- This is the **skill maintainers' record** of their own runs. A client
  session never edits it; a row comes only from a run someone observed.

## Verified on

| Expo SDK | RN | `react-native-webengage` | `webengage-expo` | `webengage-expo-push` | Android | iOS | Date |
|---|---|---|---|---|---|---|---|
| 55 | 0.83.10 | 2.1.0 | 0.0.3 | — | ✅ builds and runs; init verified in Logcat | ✅ builds and runs; `Podfile.lock` lists `react-native-webengage` 2.1.0 and `WebEngage` 7.1.0; native startup seen before JS; the "initiated" line was not seen in that first simulator capture (later found to be truncated — see the 2026-10-16 row, where it appears); Live Users not recorded here | 2026-10-15 |
| 57 | 0.86.3 | 2.1.0 | 0.0.3 | — | ✅ builds and runs; init verified in Logcat; Android Install Referrer local plugin applied correctly | ❌ build failed on Xcode 26.0.1 / Swift 6.2 (`expo-modules-jsi`, not a WebEngage error) | 2026-10-15 |
| 55.0.31 | 0.83.10 | 2.1.0 | 0.0.3 | — | ✅ Init verified in Logcat (`WebEngageVersion: 5.2.0`, `DebugMode: true`); TypeScript + Expo Router; Install Referrer local plugin applied; login, attributes and events code written (not observed running on Android) | ✅ builds and runs on the simulator; a **physical iPhone** Xcode log (supplied by the tester; Xcode 26.0.1; pods `WebEngage` 7.1.0, `WebengageExpo` 0.0.3; verbose logging) shows `WebEngage SDK initiated` / `WebEngage SDK Initialized` / `App Group configured`, a `user_logged_in` event with the expected `cuid`, three `user_update` events, `Added To Cart` ×2 and `Added To Wishlist` ×1 — all synced (status 200). Live Users not recorded | 2026-10-16 |

**Not yet verified anywhere** (state this when it's relevant, don't imply
otherwise): Push on either platform, Rich Push / `webengage-expo-push`
builds, In-Line Content (including iOS static linkage), Notification
Inbox, and screen tracking on any navigation library. Also unverified: the
"How to Confirm This Works" blocks in each Goal reference (documented
behavior; only the iOS log markers in the Tracking User and Tracking Events
blocks have been seen, once, on a device), and whether `WECampaignCallback`'s
shown/clicked callbacks fire for Custom View
and Data-only placements (expected not to — see `references/channels/
inline.md`).

## Verification status of skill features

The vocabulary — use these exact words with a client (`references/confirm-and-wrap-up.md`
→ The Unverified Label):

- **Verified** — observed on a real run, with a date.
- **Observed once** — seen on one device or one run; not repeated.
- **Documented, not run on Expo** — follows WebEngage's documentation; never run here.
- **Designed, not run** — written from the SDK's source or the docs (some with
  a logic check off-device); never run in the setting it is for.

Everything below comes from the runs recorded in the table above, plus the one
off-device logic check noted in its row. **No new device runs were made when
the production-readiness changes were added**; the test list for what to run
next is `TEST-PLAN.md`.

| Feature | Status | Evidence |
|---|---|---|
| Android Init (plugin config → SDK starts; Install Referrer local plugin applied) | **Verified** | Logcat init line on an emulator — Expo SDK 55 and 57 (2026-10-15/16) |
| iOS Init (plugin → SDK starts) | **Observed once** | Simulator build and a physical-iPhone Xcode log (Expo SDK 55, 2026-10-16) |
| Tracking User — login/logout, attributes | iOS: **observed once**; Android: written, not observed | iPhone log: `user_logged_in` with the expected `cuid`, three `user_update` events |
| Tracking Events | iOS: **observed once**; Android: written, not observed | iPhone log: `Added To Cart` ×2 and `Added To Wishlist` ×1, synced (200) |
| Guests, restored sessions | Designed, not run — the SDK's behavior across a restore is **unconfirmed** | `logout()` with no user observed as an ignored call on iOS |
| Re-sending / editing a standard attribute (`setEmail`) | Same value: **observed once** (iOS logs "already set"); a *different* value on iOS: **unconfirmed**; Android sends every call (SDK source) | iPhone log; Android SDK 5.2.0 sources |
| In-App at Quick | Display **not observed**; the screen-rule limit **observed once** in logs (`Notification Page Rule Failed`) | iPhone log |
| Screen Tracking (any navigation library) | Designed, not run — the Expo Router snippet was only type-checked | `tsc` against React 19 types |
| Push — Android (`expo-notifications`, Firebase) and iOS | Documented, not run on Expo | — |
| Rich Push (`webengage-expo-push`) | Documented, not run on Expo | — |
| In-Line Content (incl. iOS static linkage) · Notification Inbox | Documented, not run on Expo | — |
| Full depth (every Goal at Full) | Documented, not run on Expo | — |
| EAS cloud builds | Documented, not run on Expo | — |
| The wrapper's safety guard — no-op on web and in Expo Go, try/catch around calls and handlers, development-only logs | **Designed, not run** — the guard's logic passed 16 off-device checks with a fake SDK and the code type-checks under `strict`; it has not run in Expo Go, on web, on a device, or against a mismatched native build | `react-native-webengage` 2.1.0 JS source (the native module is looked up at import and fails only at call time); Expo's documented `isRunningInExpoGo()` |
| License guard — a missing key warns; only a production build throws | **Designed, not run** — it replaces a version that threw for `prebuild`/`run:*` and was **observed** to break an already-running dev server | Expo SDK 55.0.31 run |
| Install → config → code order; additive, repeatable edits | Observed in the Init runs (packages, then config, then wrapper); the repeat-safety checks are **designed, not run** | Init runs above |
| "Use your defaults" mode · the two notes files · per-Goal undo lists · the dirty-tree heads-up | **Designed, not run** | — |

## Coverage — what has and hasn't been exercised

Two fixture types have been run, both on one machine each:
1. A prebuilt-and-kept, plain-JavaScript app with no navigation library.
2. A TypeScript app on Expo Router with a *mixed* native-folder state —
   `ios/` ignored and untracked, `android/` listed in `.gitignore` but with
   20 files still tracked ("ignored but tracked"). Prebuild on it wrote the
   literal license code into a tracked file (`AndroidManifest.xml`), which
   is why Pre-Flight now classifies native folders per platform with
   `git ls-files`.

**Untested:** a fully Continuous Native Generation project (nothing
tracked), React Navigation, an EAS cloud build (where the env-sourced
license story matters), Android runs of login/attributes/events, a Screen Tracking
implementation on any navigation library, Full depth, and every channel
(In-App's display was not observed either). Init, login, attributes and
events were observed on iOS only, on one device. Say so when a client's
project is one of these, rather than implying it's been proven.

## Known toolchain requirements

| Expo SDK | Observed requirement | Source |
|---|---|---|
| 55 | Built on both platforms with Xcode 26.0.1. | observed 2026-10-15 |
| 57 | A newer Xcode than 26.0.1 — 26.0.1 fails compiling `expo-modules-jsi` (`weak let`, 13 errors, none in WebEngage code). The exact minimum isn't recorded here: confirm it against Expo's SDK 57 release notes before telling the client which version to install. | observed 2026-10-15 |
| 56 | Not observed. | — |

Other SDKs: **no entry means unknown** — look up the minimum Xcode /
Android build-tool versions in Expo's release notes for the client's
exact SDK rather than guessing.
