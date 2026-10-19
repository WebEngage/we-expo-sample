# Expo integration skill: review notes from one end-to-end run

Prepared 2026-10-19 by Claude, from a session with Akshay. For the skill maintainers to discuss.
Skill reviewed: `skills/expo` (webengage-integration-expo v1.0).

## 1. Bottom line

- **Not ready for production as a client deliverable.** It is usable today for internal and pilot work on this stack (Expo SDK 55, RN 0.83, New Architecture).
- Three issues block a production claim: an ordering rule that is wrong on Android, an iOS build that fails out of the box under the skill's static-linking setup, and push having never been exercised.
- The skill's structure is sound. Most findings are specific corrections and missing test evidence, not a redesign.

## 2. What was run, and what was not

**Run** (one app, one machine; local builds, no EAS):

| Item | Value |
|---|---|
| Expo / React Native / React | 55.0.31 / 0.83.10 / 19.2.0, New Architecture on |
| Packages | react-native-webengage 2.1.0, webengage-expo 0.0.3, webengage-expo-push 1.0.0, react-native-we-personalization 2.1.0, react-native-webengage-inbox 2.1.0 |
| Native SDKs seen | Android WebEngage 4.22.0; iOS pods WebEngage 7.1.0, WEPersonalization 1.6.1, WENotificationInbox 1.1.5 |
| Targets | Android 15 emulator, iPhone 17 Pro Max simulator (iOS 26.0) |
| Channels exercised | In-Line (4 placements), Inbox, In-App (display only), events and screen tracking (log evidence) |

**Not run:** push on either platform, a physical device, an EAS or cloud build, a production-variant build (`APP_VARIANT=production`), a clean checkout without local patches, Expo Go behaviour, `TEST-PLAN.md` as a whole, and the evals.

**Scope note.** `TEST-PLAN.md` says the skill itself never builds or runs the app and that every build and device check is the tester's. Here an agent ran the builds, so treat this as tester input to `references/compatibility.md`, not as skill behaviour.

## 3. Findings

### P0: fix before any production claim

**P0-1. Hard Rule 1 is wrong for the Android launch screen.**
- **What the skill says** (`references/channels/inline.md:416-421`): call `screen()` before an In-Line widget mounts, never after. It marks the rule unverified for the first render and says that if content doesn't appear, "call `trackScreen()` earlier".
- **What happened:** with `screen()` first and the widget after, the launch-screen placement never loaded on Android. The SDK logged `No Property found for <id>, hence caching the property`, and no `loadView called` line appeared.
- **Why (read from package 2.1.0 source):**
  - The plugin registers its screen-change listener inside `createViewInstance`, so only when the first native widget exists (`android/.../WEPersonalizationViewManagerImpl.java:43`).
  - Until then `WEPluginCallbackHandler.currentScreen` stays null (`handler/WEPluginCallbackHandler.java:16`, set at `:50-53`).
  - A widget attaching later calls `setScreenNavigatorCallback` (`:19-37`), which only triggers `loadView` when the screen already equals `currentScreen`.
  - So a `screen()` sent before any widget exists is missed, and the suggested remedy ("call `trackScreen()` earlier") makes it worse.
- **Evidence after the workaround:** a zero-size primer widget mounted at app start gave the sequence primer attached → `screenNavigated: home` → `onPropertyCacheCleared: null→home` → `loadView called for <id>` → data → rendered.
- **Suggested change to the skill:**
  - Replace Hard Rule 1's remedy with: "At least one native `WEInlineWidget` must exist before the first `screen()` of the session, or Android never learns the launch screen. Mount a zero-size primer widget under a reserved name in the root layout. Mount real widgets only once `screen()` has named their screen, and only while that screen is focused."
  - State the failure signature in the skill: `No Property found for <id>, hence caching the property`.
  - Fix `TEST-PLAN.md` F5's expected result (launch-screen order): Android needs the primer; iOS rendered with `screen()` first.
- **Better fix (package owners):** register the property-registry callback in the package's init path, not in `createViewInstance`. The primer then disappears from the skill.
- **Not observed:** I did not test later screens without the primer. By source reading they should work, but that is unverified.

**P0-2. iOS does not build under the skill's static-linking setup without editing `node_modules`.**
- **What happened:** with `useFrameworks: static` and `WEBENGAGE_DISABLE_SPM=true`, the iOS build failed twice with a missing generated Swift header.
  - `react-native-we-personalization` 2.1.0: `ios/views/WEPersonalizationView.h:7`, `'react_native_we_personalization-Swift.h' file not found`.
  - `react-native-webengage-inbox` 2.1.0: `ios/WEInboxReact.mm:12`, `'react_native_webengage_inbox-Swift.h' file not found`.
- **Cause:** both import the header unguarded. In a framework build it only resolves at the module-qualified path. Sibling `.mm` files in the personalization package already use the guard.
- **Fix used** (verified: build and run succeeded on the simulator):
  ```objc
  #if __has_include(<module_name/module_name-Swift.h>)
  #import <module_name/module_name-Swift.h>
  #else
  #import "module_name-Swift.h"
  #endif
  ```
- **Why it matters:** the edits live in `node_modules`, so a fresh `npm install` removes them and a client following the skill hits the failure on the first iOS build.
- **Suggested change:**
  - Ask package owners to ship the guard in both packages.
  - Until then, the skill should say so in its Init and In-Line/Inbox steps, list the two error signatures, and offer a `patch-package` step that needs the client's approval.
  - Add a known-issues row to `references/compatibility.md` for both packages at 2.1.0.

**P0-3. Push has never been exercised, and the skill's own plan says simulators cannot cover it.**
- `TEST-PLAN.md` states iOS push and logs are only trustworthy on a physical iPhone (line 62; F3 is marked physical iPhone only).
- This run produced only partial evidence: an Android FCM token registered, and iOS APNs registration was not checked.
- **Suggested gate:** push is not "verified" until a test push is received and tapped on a real device per platform, with click callback and deep-link routing observed.

### P1: correct or add

**P1-1. Hard Rule 13 (iOS ids above 1000) is not supported by this run.**
- iOS placeholder ids 2, 31 and 41 on a New Architecture app all rendered inside their own bounds.
- The package also logged `Running on Legacy` while the app ran New Architecture (Android: `"fabric":true`), which suggests its own architecture detection is unreliable here. That is a log label and I did not investigate it.
- **Suggestion:** soften from "will render in the wrong place" to "may", record this run as a counterexample with versions, and re-test on a physical device before keeping or removing the rule.

**P1-2. Progress-note template names a log line that does not match.**
- `references/progress-reports.md` ("How to check each piece") says to look for `WebEngage SDK Initialized` on iOS. The line seen was `Verification complete. WebEngage SDK initiated.`
- Android `WebEngage Successfully Initialized` matched.

**P1-3. Verification should cite log evidence, not what is visible on screen.**
- In this session a bell badge was misattributed to WebEngage when it came from the app's own seed data.
- **Suggestion:** give each channel an exact signal to check. Signals seen this run:

| Channel | Signal |
|---|---|
| Init (Android) | `WebEngage Successfully Initialized` |
| Init (iOS) | `Verification complete. WebEngage SDK initiated.` |
| Screen | `Screen navigated: <name>` / `we_wk_screen_navigated` |
| In-Line registered | `WEInlineWidget: loadView called for <id>` |
| In-Line mismatch | `Ignoring property <id> because screen rule failed` |
| In-Line failure | `No Property found for <id>, hence caching the property` |
| Custom view | `app_personalization_view` (impression), `app_personalization_click` |
| Inbox | `inbox_notification_view`, `inbox_notification_reset_count` |
| Events delivered | `Events successfully Logged to server` |

**P1-4. Add a step that reads the account's own targeting config for exact names.**
- The dashboard publishes `.../<license>/{android,ios}/v4.js` (gzip-compressed JSON). Reading it gave the exact, case-sensitive screen names and the per-platform placeholder ids.
- That exposed a mismatch the skill would not catch: Home was tracked as `Home` while the dashboard's In-App and In-Line rules match `home`.
- **Suggestion:** an optional diagnostic step, done with the client's consent, since it uses their license in a URL. The skill should also warn that screen names are case-sensitive and set per campaign.

**P1-5. Inbox reference gaps.**
- `getNotificationCount` means "new since last reset": it returned 0 for older messages, so a bell badge only appears after a new message arrives.
- The SDK returned `hasNext: true` on a two-message first page. The real end is an empty next page, and a short list never fires `onEndReached`. The reference should say to page until an empty page, or fill the screen.
- Neither is in the skill's Inbox guidance that I read.

**P1-6. Custom View reference gaps.**
- The campaign's own key/value data is nested at `payload.content.customData`, and values can be JSON text.
- Impression is recorded as `app_personalization_view`. The skill's example shows `(data) =>` with no payload shape.

### P2: smaller, but worth recording

- **Exception campaign differs by platform.** The same campaign hit `onPlaceholderException` on iOS (`Campaign failed to render in set time.`) and rendered normally on Android. Test expectations should say "may differ".
- **Disk space.** `references/init.md:820` says prebuild "needs disk space" but gives no check. Here the disk filled: `pod install` failed with `No space left on device` and the Android build was interrupted. My estimate (not measured) is 5 to 8 GB of headroom; add a pre-flight warning with a threshold.
- **Test-harness gotchas for testers:**
  - Metro started with `CI=1` does not watch files, so edits are not served until restart.
  - The iOS Simulator shows an "Open in app?" prompt for custom-scheme links that `simctl` cannot dismiss, and scripted clicking needs Accessibility permission. A tester needs a manual tap, or an app-side start route.
- **SDK environment log:** Android also logs `Environment: aws` for the configured `us`. I did not check that mapping against SDK source.

## 4. Suggested updates to `references/compatibility.md`

| Item | Status after this run |
|---|---|
| `WEBENGAGE_DISABLE_SPM=true` on `pod install` gives real pods (F5) | Verified: `Podfile.lock` lists WebEngage, WEPersonalization, WENotificationInbox as pods |
| Widget mount vs `screen()` order on the launch screen (Hard Rule 1, F5) | Android: fails without a primer. iOS: works with `screen()` first |
| Hidden until `onRendered`, fixed numeric width and height (F5) | Verified on both platforms |
| Static linking build for In-Line and Inbox | Fails without local patch (two packages, 2.1.0) |
| iOS ids below 1000 on New Architecture (Hard Rule 13) | Counterexample, simulator only |
| Custom View impression and click | Android verified; iOS click not checked |
| Inbox list and paging | Verified on both platforms (view tracking only; read, unread and delete actions not run) |
| Push (Android and iOS) | Not verified |
| A later `expo run:ios` without the variable (does the crash return?) | Not run |
| Production variant, EAS env path, clean checkout | Not run |

## 5. What to keep

- Install → config → code ordering, and additive, idempotent changes.
- Guarded wrapper that never throws into app code.
- Notes-file spec: no secrets, per-Goal undo list, citations re-read at write time.
- TEST-PLAN as the source of truth for "verified", with items marked designed-not-run.

## 6. Proposed gates before calling it production-ready

1. A clean-room run on a fresh project, with no local patches, builds on both platforms.
2. TEST-PLAN rows executed and recorded in `compatibility.md`, including push on a physical iPhone and an Android device.
3. A production-variant build, plus the EAS environment path where the client uses EAS.
4. Evals (`evals/scenarios.md`) run on a clean machine and passing.
5. Every Hard Rule re-checked against the current package versions; anything unproven stays marked unverified.
6. A support matrix row for the exact versions above.
7. Verification steps reference log signals (section 3, P1-3), not only visible UI.

## 7. Questions for the discussion

- Who owns the two package fixes (registry callback timing, Swift-header guard), and in which release do they land?
- Until then, may the skill apply a `patch-package` step, and under what approval?
- Is Hard Rule 13 still valid on current iOS and package versions, or was it specific to an earlier setup?
- Should the skill fetch the account's `v4.js` for diagnostics, or only ask the client for names?
- What does "production" mean for this skill: internal tool, or client-facing deliverable? The bar differs, and the gates above assume the second.

## 8. Limits of this review

- One app, one machine, simulators and an emulator only.
- Package conclusions come from reading version 2.1.0 source and one run, not from upstream confirmation.
- I read parts of the skill (the In-Line reference, the notes-file spec, the undo section, fragments of init and the test plan), not all of it, and did not run its evals.
- No license code, token or end-user identifier appears in this file.

## Summary

- **Verdict:** not production-ready as a client deliverable; fine for internal and pilot use on Expo 55, RN 0.83 and New Architecture.
- **P0:**
  - Hard Rule 1 is wrong on Android for the launch screen, and its stated remedy makes it worse. The cause is the package registering its screen listener lazily (`WEPersonalizationViewManagerImpl.java:43`), and a primer widget is a workaround.
  - iOS fails under the skill's static-linking setup because two packages (2.1.0) have unguarded Swift-header imports (`WEPersonalizationView.h:7`, `WEInboxReact.mm:12`). I fixed it in `node_modules`, which a fresh install loses.
  - Push has never been exercised, and the plan says only a physical iPhone is trustworthy for iOS.
- **P1:** Hard Rule 13 had a counterexample (ids 2, 31, 41 rendered fine); the iOS init log string in the template doesn't match; verification should cite log signals; reading the account's `v4.js` would catch screen-name mismatches; the Inbox and Custom View references miss count semantics, paging and the payload shape.
- **P2:** exception campaigns differ by platform, there is no free-disk pre-flight, and testers need to know Metro's `CI=1` and the iOS "Open in app?" prompt gotchas.
- **Before production:** clean-room run on a fresh project, TEST-PLAN rows executed (including physical-device push), a production-variant and EAS build, evals passing on a clean machine, Hard Rules re-checked against current versions, and a support-matrix row for these versions.
- **Open questions:** who owns the two package fixes and when, whether the skill may apply a patch, whether Hard Rule 13 still holds, whether it may fetch `v4.js`, and what "production" means for this skill.
