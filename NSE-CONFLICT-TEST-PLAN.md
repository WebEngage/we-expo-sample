# iOS Notification Extension Conflict — Static Test Plan

**Project:** `we-expo-sample` (WE Shop) — Expo SDK 55, RN 0.83, iOS bundle id `com.webEngage.prodSwift`
**Author:** Akshay (for review)
**Goal of this document:** Get a second opinion from Claude before executing.

---

## 0. End Goal

The broader outcome this work feeds into — beyond the single experiment below:

**Produce confident, documented guidance on whether WebEngage push can coexist with
another push/engagement SDK (OneSignal, CleverTap, Braze, etc.) in an Expo app, and
exactly what it takes to make them coexist.**

Concretely, by the end we want to be able to answer:

1. **Does it break?** When a non-WebEngage SDK already owns the single iOS Notification
   Service Extension, does adding `webengage-expo-push` break the prebuild/build — and
   at what stage does it fail?
2. **Can it be fixed?** Does the documented workaround
   (`iosNSEExistingTarget` + merged `NotificationService.swift` + plugin ordering)
   actually produce a valid, single-NSE native project?
3. **What's the recipe?** A reusable, written set of steps + a reference merged
   `NotificationService.swift` that a client already using another provider can follow to
   add WebEngage push without a second NSE.
4. **How far can we verify without accounts?** Establish clearly which parts of coexistence
   are provable statically (prebuild/project structure) versus what strictly needs a device +
   both vendors' licenses (actual rich-push delivery and per-SDK payload routing).

This NSE-conflict experiment is **step 1** toward that end goal — it validates the
build-time coexistence story. Runtime validation (rich push rendering, payload routing
per SDK) is a later, separate effort that requires vendor accounts and a physical device.

---

## 1. Objective

Verify, **without running the app and without any vendor license/account**, whether
a third-party push SDK that creates an iOS **Notification Service Extension (NSE)**
can coexist with WebEngage's push extensions — and whether the documented WebEngage
workaround actually resolves the conflict.

The conflict (if any) is a **build-time / prebuild-time** problem, not a runtime one.
That is the core assumption this plan rests on — please validate it.

## 2. Background / why this is testable without a license

- iOS allows **exactly one** Notification Service Extension per app.
- `webengage-expo-push` creates two iOS targets at prebuild:
  - `NotificationService` → Notification **Service** Extension (`WEXPushNotificationService`)
  - `NotificationViewController` → Notification **Content** Extension
- Other vendor Expo plugins (OneSignal, CleverTap, Braze, etc.) also create an NSE.
- When two plugins both try to create an NSE target, `expo prebuild` fails with:
  `"Notification Service Extension target already exists"`.
- This failure happens at **prebuild**, before any build, device, APNs, or dashboard
  key is involved. Hence: no license needed to observe the conflict.

### Documented WebEngage workaround (from repo skill docs)
Source: `skills/webengage-expo/expo/references/channels/push.md` → "Other iOS push providers"

- Set `iosNSEExistingTarget: true`
- Set `iosNSETargetName` to the **other** plugin's NSE target name
- Provide `iosNSEFilePath` pointing to a **merged** `NotificationService.swift` that
  dispatches on `payload["source"] == "webengage"` → `WEXPushNotificationService`,
  and falls back to the other provider's handling otherwise
- `webengage-expo-push` **must be listed before** the other plugin in the `plugins`
  array, or prebuild fails because the target does not exist in the Podfile yet
- Never set `iosNSEExistingTarget` without `iosNSEFilePath`

## 3. Current project state (verified)

| Item | State |
|---|---|
| Installed: `webengage-expo` | v0.0.3 |
| Installed: `webengage-expo-push` | v1.0.0 |
| Installed: `react-native-webengage`, `react-native-webengage-inbox` | present |
| iOS extensions already generated | `ios/NotificationService/`, `ios/NotificationViewController/` |
| WebEngage license (main app Info.plist) | `WEGLicenseCode = ~1341056cd` present |
| `WEGAutoRegister` | `true` |
| `ios.useFrameworks` | `static` (Podfile.properties.json) |
| Config file | **`app.json`** (no `app.config.js`); WebEngage plugin **not** currently listed in `app.json` plugins array, yet `ios/` already contains the extensions |
| Current git branch | `shop/we-push-test` |
| Relevant branches | `shop/baseline`, `shop/we-init`, `shop/we-quick`, `shop/we-full`, `shop/we-push-test` |

> ⚠️ **Open question for reviewer:** the WebEngage plugin is not present in `app.json`'s
> `plugins` array, but the `ios/` folder already has the extensions. This suggests the
> native project was generated from a different config state (or a prior branch) than
> what `app.json` currently declares. This needs reconciling before the experiment,
> otherwise a `--clean` prebuild will not reproduce the current `ios/` folder. **Action:
> confirm the real plugin config source before step 4.**

## 4. What is / isn't being tested

| Level | What it proves | Needs license? | Needs device? | In scope? |
|---|---|---|---|---|
| **Static (prebuild + inspect project)** | Do two NSEs collide at prebuild? Does the merge workaround produce a valid project? | No | No | ✅ Yes |
| **Runtime (build + send push)** | Does rich push render? Does each SDK route its own payload? | Yes (both vendors) | Yes (real device, APNs) | ❌ No — out of scope |

This plan covers the **static** level only.

## 5. Approach

Test **pairs**, not all three providers at once (overlapping failures can't be
attributed). Two independent experiments:

- Experiment A: **OneSignal (`onesignal-expo-plugin`) + `webengage-expo-push`**
- Experiment B: **CleverTap Expo plugin + `webengage-expo-push`**

Each experiment runs on its own throwaway branch cut from `shop/baseline`, so working
branches stay clean.

### Per-experiment steps

1. `git checkout shop/baseline && git checkout -b test/nse-conflict-onesignal` (or `-clevertap`)
2. Install both plugins (no `--save` concerns; branch is throwaway):
   - A: `npm install onesignal-expo-plugin webengage-expo webengage-expo-push`
   - B: `npm install <clevertap-expo-plugin> webengage-expo webengage-expo-push`
3. Add **both** plugins to the config `plugins` array.
   - **Phase 1 (expect failure):** list them in an order that triggers the clash, with
     no `iosNSEExistingTarget`. Expected: prebuild fails with "target already exists".
4. Run: `npx expo prebuild --clean --no-install --platform ios`
   - ⚠️ `--clean` deletes and regenerates `ios/`/`android/`. Safe here only because this
     is a throwaway branch off `baseline` with nothing hand-edited in `ios/`.
5. Record the exact outcome:
   - Did it error? Capture the full message.
   - If it succeeded, inspect `ios/*.xcodeproj/project.pbxproj` — how many NSE targets
     exist? Which one "won"? Are both present (invalid) or merged?
6. **Phase 2 (apply the documented fix):**
   - Set `iosNSEExistingTarget: true`, `iosNSETargetName` = the other plugin's NSE name,
     `iosNSEFilePath` = a merged `NotificationService.swift` (dispatch on
     `payload["source"] == "webengage"`), and **order `webengage-expo-push` before** the
     other plugin.
   - Re-run `npx expo prebuild --clean --no-install --platform ios`.
7. Record whether the fix produces a single valid NSE target and a buildable project
   structure (static inspection — not a compile).
8. Clean up: `git checkout shop/we-push-test` and delete the test branch.

### Mode / config correctness to preserve
- `webengage-expo-push` `mode` must equal `push.mode` in `webengage-expo` (Hard Rule 9).
- `iPhoneDeploymentTarget` must match the main app's deployment target (read from
  `ios/Podfile` `platform :ios`). Default `15.1` is only correct if the app is on 15.1.
- `appGroupName` must **not** be set (Hard Rule 13).
- Because `ios.useFrameworks = static`, `pod install` (if ever run) needs
  `WEBENGAGE_DISABLE_SPM=true`. Not relevant to `--no-install` prebuild, noted for completeness.

## 6. Success criteria

- [ ] Phase 1 reproducibly shows the NSE collision at prebuild (or proves it does NOT collide, with evidence from `project.pbxproj`).
- [ ] Phase 2 shows the `iosNSEExistingTarget` + merged-file + ordering workaround produces a single, valid NSE target.
- [ ] Findings documented per experiment (OneSignal, CleverTap) with exact prebuild output.
- [ ] No working branch modified; throwaway branches deleted after.

## 7. Risks & caveats

- **Static ≠ runtime.** A clean prebuild does not prove rich push actually renders or
  that payload routing works. That requires licenses + a device and is explicitly out of scope.
- **CleverTap plugin package name/behavior** not yet verified — need to confirm the exact
  npm package and whether it creates an NSE, a Content Extension, or both.
- **`--clean` is destructive** to `ios/`/`android/`. Only run on throwaway branches.
- **Config source mismatch** (section 3 open question) must be resolved first, or results
  won't map to the real `shop/we-push-test` setup.
- **No OneSignal / CleverTap account.** Accepted — not needed for static test.
- A merged `NotificationService.swift` written for the test is a stub for structure only;
  a production merge needs real dispatch logic for both SDKs.

## 8. Open questions for the reviewer (Claude)

1. Is the central assumption correct — that the NSE conflict is **fully observable at
   prebuild** with no build/run/license?
2. Is testing **pairs** (not all three) the right call, or is there value in a 3-way test?
3. Is there a lighter way to prove the conflict than a full `--clean` prebuild
   (e.g. reading the plugin source in `node_modules` to see how each creates its NSE target)?
4. For the config-source mismatch in section 3, what's the safest way to establish the
   true current plugin config before running `--clean`?
5. Is a static `project.pbxproj` inspection sufficient evidence, or should the plan include
   a non-destructive compile check (e.g. `xcodebuild -list`) without a full device build?

## 9. Alternative / lighter approach (if run-based test is overkill)

Instead of prebuilding, **read both plugins' source** in `node_modules`
(`onesignal-expo-plugin`, `webengage-expo-push`, CleverTap plugin) and statically
determine how each registers its NSE target (target name, bundle id suffix, pbxproj
mutation). This proves the collision by construction without ever invoking prebuild —
fastest, fully reversible, zero filesystem churn. Recommended as a first pass before the
prebuild experiment.
