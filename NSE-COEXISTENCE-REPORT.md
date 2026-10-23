# WebEngage Push next to an app-owned Notification Service Extension — integration report

Project: WE Shop (`we-expo-sample`) · Date: 2026-10-22 · Branch: `test/nse-coexist-main`
Skill used: `skills/expo` (`webengage-integration-expo` v1.0) · Platform: iOS only · Depth: Quick + Push

This report is written so a reader with no access to the original conversation can
review, reproduce or challenge what was done. Every claim carries an evidence tag:

| Tag | Meaning |
|---|---|
| **[OBSERVED]** | Run in this session and the output was seen (command output, logs, file contents). |
| **[SOURCE]** | Read in the plugin or script source code; not run in this project. |
| **[REASONED]** | Inferred from the above; not tested. Treat as a hypothesis. |
| **[USER-REPORTED]** | The user said so; no log or screenshot was captured. |

No secret is in this report: no license code, no APNs key, no token. The WebEngage
license code appears in the SDK's own log URLs and in one of the user's own files (see
Risk R11), so do not paste raw device logs into a public place.

---

## 1. Summary (read this if nothing else)

- **The problem:** iOS allows exactly one Notification Service Extension (NSE) per app. This app already had one
  (`DemoNotificationService`, made by its own plugin `plugins/withDemoPushExtensions.js`). WebEngage Rich Push
  also needs its code inside the NSE. So WebEngage had to **share** the app's extension instead of adding a second one.
- **How it was handled:** `webengage-expo-push` in its "existing target" mode (`iosNSEExistingTarget`), a merged Swift file
  that routes WebEngage pushes to WebEngage and everything else to the app's own code, WebEngage's plugins listed
  **before** the app's plugin, and two project-level workarounds for gaps found on the way (Section 6).
- **Decisions the user made:** Quick + Push + iOS only + US data center; **Option A** (add `"podfileTarget": true` to
  the app's own plugin entry, rather than skipping WebEngage's service extension); **Option 1** (a small local plugin
  copies the merged file to the file the extension actually compiles, rather than renaming the app's file or leaving Rich
  Push off). Details and the road not taken are in Sections 4 and 5.
- **Outcome:** prebuild, `pod install` and a signed Debug `xcodebuild` all succeeded (exit 0). The built service
  extension contains WebEngage's `WEXPushNotificationService`. **[USER-REPORTED]** a local push, a push from APNs (not WebEngage)
  and a WebEngage push all worked on the user's iPhone.
- **Not proven:** whether the WebEngage push showed its rich image, and whether it skipped the app's `[demo-nse]` prefix.
  Those two observations are what prove the merged extension routes correctly. See Section 8.
- **Findings worth sending to WebEngage:** `webengage-expo-push` 1.0.0 copies the merged file to a name the existing
  extension does not compile (silent failure), and it needs the other plugin to have created a Podfile target (hard
  error otherwise). See Section 6.
- **Biggest risks:** the workaround depends on plugin order and on the app's plugin writing a file with a specific
  name; a real vendor plugin (OneSignal, CleverTap, Braze) is untested; the license code sits in an untracked file
  that git would pick up. See Section 9.
- **Not done:** login/logout (Tracking User) and events (Tracking Events). A plan was sent; no reply yet. Android was out of scope.

---

## 2. Environment

| Item | Value | Tag |
|---|---|---|
| Expo SDK / React Native / React | 55.0.31 / 0.83.10 / 19.2.0 | [OBSERVED] |
| Language, router | TypeScript (strict), Expo Router (`src/app`) | [OBSERVED] |
| `react-native-webengage` | 2.1.0 | [OBSERVED] |
| `webengage-expo` | 0.0.3 (`^0.0.3` accepts exactly 0.0.3) | [OBSERVED] |
| `webengage-expo-push` | 1.0.0 (latest on npm; only 0.0.1 and 1.0.0 exist) | [OBSERVED] |
| iOS pods | WebEngage 7.1.0, WebengageExpo 0.0.3, WEServiceExtension 1.4.0, WEContentExtension 1.2.0 | [OBSERVED] |
| Package manager | npm | [OBSERVED] |
| Native folders | `ios/` generated, git-ignored, 0 tracked (CNG). `android/` git-ignored but 20 files tracked; **untouched** | [OBSERVED] |
| Build path | local, `expo run:*`; no `eas.json`, no `expo-dev-client` | [OBSERVED] |
| Toolchain | Xcode 26.0.1, CocoaPods 1.16.2, Node 22.22.2, iOS deployment target 15.1 | [OBSERVED] |
| Device | iPhone 15 Pro, iOS 26.0 | [OBSERVED] |
| Data center / config format | US, iOS `WEGEnvironment: DEFAULT` | [OBSERVED] |
| Disk | 91% used, about 38 GB free (an earlier `pod install` by the user failed with "No space left on device") | [OBSERVED] |

---

## 3. Starting point — what the app already had

The app's own plugin `plugins/withDemoPushExtensions.js` (test-only, vendor-free) stands in for "an app that already
has its own extensions". Configured in `app.json`:

```json
["./plugins/withDemoPushExtensions", { "appGroup": false, "nseBundleSuffix": "NotificationService", "ceBundleSuffix": "NotificationContent" }]
```

| Piece | Value |
|---|---|
| Service extension target / folder | `DemoNotificationService` |
| Its compiled Swift file | `NotificationService.swift` (class `NotificationService`) |
| Its behaviour | prefixes every push body with `[demo-nse] ` |
| Its bundle ID | `com.webEngage.prodSwift.NotificationService` (the suffix option reuses an existing App ID) |
| Content extension target | `DemoNotificationContent`, category `DEMO_CATEGORY`, bundle `…NotificationContent` |
| App Group | none (`appGroup: false`) |
| Podfile entries for its targets | **none** (its `podfileTarget` option was off) |
| Other relevant app code | `src/app/push-test.tsx` uses `expo-notifications` (permission request, device token, a local notification) |

The app and the extensions are signed automatically with the team already in `app.json`.

An earlier experiment by the user (`results/C1`, `NSE-CONFLICT-TEST-PLAN.md`) had tested the same recipe with
`podfileTarget: true` and the merged file. Its static checks passed, but its `pod install` failed on a full disk,
and its log showed the merged file copied to `NotificationService.swift`, which differs from what was seen in this
session (Section 6, F2). The reason for the difference is unknown. [OBSERVED]

---

## 4. The decisions — what was offered, what the user chose

| # | Decision point | Options offered (recommended first) | Chosen | Evidence of the choice |
|---|---|---|---|---|
| D1 | Scope | Quick or Full; which platforms; dashboard URL; license from `.env` or pasted | **Quick + Push, iOS only, US**. License from `.env` (approved when the plan stating it was approved: "continue the integration process") | User's replies |
| D2 | Extension strategy | The plan stated WebEngage will **share** the app's service extension (iOS allows one) and add its own content extension; Rich Push on by default ("say so if you'd like to skip it") | Share, Rich Push on (not objected to) | Plan approved |
| D3 | A Podfile entry for the app's extension | **A (recommended):** add `"podfileTarget": true` to the app's `withDemoPushExtensions` entry in `app.json` (one line in the user's file). **B:** skip WebEngage's service extension (`disableNSE`), no edit to `app.json`, no Rich Push images | **A** | "go with option A" |
| D4 | How the merged file gets compiled | **1 (recommended):** a small local plugin, `plugins/withWebEngageNseSource.js`, copies the merged file over the file the extension compiles. **2:** rename the source file inside the user's own plugin. **3:** leave Rich Push off | **1** | "do the recommended way of your approach" |
| D5 | Agent builds, installs and runs the app | The skill's default is to hand these steps back to the user | The user asked the agent to do it ("run it yourself and listen to logs") | Recorded as a deviation (Section 10) |
| — | Tracking User and Tracking Events | A plan (identifier = account id, `email` + `city`, channel opt-ins via `setOptIn`, events `Order Placed` and `Added To Cart`) | **No reply yet** | Not started |

Before D3, the user asked for a fuller explanation ("explain further in detail, I did not understand"). The
explanation used a plain-language account of why CocoaPods needs a target block for a library to attach, and what each
option changes. The substance is in Section 5.

---

## 5. What each choice means, and what would have happened otherwise

### 5.1 The three ways WebEngage's push plugin can treat the service extension (D2)

`webengage-expo-push` has three modes. [SOURCE: `build/webengage/withWebEngageIos.js`, `build/support/updatePodfile.js`, README]

| Mode | Config | What the plugin does |
|---|---|---|
| New target (default) | none | Creates its own NSE target named `NotificationService` with bundle ID `<app bundle id>.NotificationService`, plus its files and Podfile block. |
| **Existing target (chosen)** | `iosNSEExistingTarget: true`, `iosNSETargetName`, `iosNSEFilePath` | Skips creating the target. Adds its App Group to that target's entitlements, adds `pod 'WEServiceExtension'` to that target's Podfile block, copies the merged Swift file. Throws if the target's Podfile block is missing. Must be listed **before** the other plugin. |
| Disabled | `disableNSE: true` | No service extension target, no files, no pod. The content extension is still created. |

**What would have happened with the default mode in this project** [REASONED, not run]:
the plugin only detects a conflict when a folder named `ios/NotificationService` already exists (`nseAlreadyExists`).
The app's folder is `DemoNotificationService`, so it would not be detected and prebuild would **not** fail. The plugin would add a second service
extension whose bundle ID is `com.webEngage.prodSwift.NotificationService`, the same ID the app's own extension uses
(its suffix option reuses it). Two extensions with one bundle ID break embedding, signing or installation, and iOS
only runs one service extension anyway. The failure would show up at build or install, not at prebuild. Note: the test plan's
"Notification Service Extension target already exists" message appears only when the folder names match, so a
prebuild-only check would not catch this case.

### 5.2 D3 — Option A (chosen) versus Option B

**Why a decision was needed.** The app's Podfile contained only `target 'WEShop'`. WebEngage's library for the service
extension (`WEServiceExtension`) is delivered by CocoaPods, which attaches a library only to a target that has its own
`target '…' do … end` block. In existing-target mode the push plugin looks for `target 'DemoNotificationService'`
in the Podfile and throws if it is not there:
`"iosNSEExistingTarget" is true but target 'DemoNotificationService' was not found in the Podfile` [SOURCE: `updatePodfile.js`].
The app's plugin writes such blocks only when its `podfileTarget` option is true, which it was not.

| | **A (chosen)** | **B (not chosen)** |
|---|---|---|
| Change | `"podfileTarget": true` added to the app's plugin entry in `app.json` | `disableNSE: true` in WebEngage's entry; `app.json` untouched |
| Rich Push (images, carousels, buttons) | Works, in principle (it needs WebEngage's code in the service extension) | Does not work: WebEngage's service-extension code is never added |
| What handles a WebEngage push | The merged extension: WebEngage's handler | Only the app's own extension, which prefixes `[demo-nse] ` to every body, WebEngage pushes included [REASONED] |
| Moving parts | `app.json` line, merged Swift file, ordering, the local plugin of D4 | Fewest: one option, nothing else |
| Content extension | WebEngage's `NotificationViewController` added next to the app's | Also added (the plugin always adds it) |
| Reversibility | Remove the line, re-run prebuild | Remove the option |
| When B is better | If the user must not touch `app.json`, or plain-text pushes are enough | |

**If neither were done** (the existing-target mode with no Podfile block): prebuild stops with the error above. [SOURCE, not run:
the push entry was only written after A was chosen.]

**Not offered, and why:** hand-editing `ios/Podfile` (regenerated by every prebuild, and the skill forbids hand edits of
generated files), and removing the app's own extension and using WebEngage's alone (the skill forbids removing the client's code).

### 5.3 D4 — Option 1 (chosen) versus Options 2 and 3

**Why a decision was needed.** [OBSERVED] After Option A the prebuild passed, but the log said:
`webengage-expo-push: Copied custom NSE file to existing target: …/ios/DemoNotificationService/DemoNotificationService.swift`.
The plugin always names the copy `<iosNSETargetName>.swift` and never adds it to the Xcode project. The Xcode
project's service extension compiles `NotificationService.swift`, which still held the app's original code (0 mentions of
`WEXPushNotificationService`). The merged WebEngage code was on disk but not built, and nothing failed visibly.

| | **1 (chosen)** | **2 (not chosen)** | **3 (not chosen)** |
|---|---|---|---|
| Change | New `plugins/withWebEngageNseSource.js`, listed before the app's plugin, copies the merged file over `ios/DemoNotificationService/NotificationService.swift` after the app's plugin writes it. New entry in `app.config.js` | Rename the extension's source file in the user's own `plugins/withDemoPushExtensions.js` to `DemoNotificationService.swift` | No change |
| Edits user-owned code | No | Yes (their plugin) | No |
| Rich Push | Wired in. Verified in the built binary [OBSERVED] | Would work for this app [REASONED] | Not active. The app's original code handles every push [OBSERVED on disk] |
| Works for a real vendor plugin | Yes, if the vendor's compiled file path is known [REASONED] | No. A vendor's plugin can't be edited, and the rename would hide the gap | n/a |
| Failure mode | Throws a clear error if the target file is missing (wrong order) | Silent if the rename drifts | **Silent:** the project looks configured but Rich Push never runs |
| Reversibility | Delete the plugin file and its entry | Revert the rename | n/a |

**What would have happened if the user had chosen 3, or if the issue had not been noticed** [OBSERVED on disk, runtime not run]:
a clean prebuild, clean `pod install`, a successful build, working plain pushes — and WebEngage pushes
silently handled by the app's own code (prefix added, no rich content).

### 5.4 Other configurations that would have failed (all [SOURCE] or [REASONED], none run here)

| Configuration | Expected result |
|---|---|
| WebEngage plugins listed **after** the app's plugin | Prebuild throws (target not in the Podfile yet). Expo runs `withDangerousMod` actions in reverse list order, so the plugin listed first runs last. [SOURCE: the plugin's own error text; **order observed** in this session's log: the local plugin logged first, then the push plugin, consistent with reverse order] |
| `iosNSEExistingTarget: true` with no `iosNSEFilePath` | The plugin adds the App Group and pod but writes no Swift; the app's own code would have to call WebEngage itself. [SOURCE: "client handles it themselves"] |
| `appGroupName` set to a custom value | Main app and extensions end up in different App Groups and rich push silently falls back to plain text. Never set it. [SOURCE: skill Hard Rule 13] |
| `iPhoneDeploymentTarget` different from the app's | Build or runtime problems in the extensions. [SOURCE: skill Hard Rule 10] Set to 15.1 and matched. |
| `push.mode` and the push plugin's `mode` different | Mismatched APNs environments. [SOURCE: skill Hard Rule 9] Both use the same expression. |
| Local plugin listed after the app's plugin | It throws on a fresh prebuild: `ios/DemoNotificationService/NotificationService.swift was not found`. By design, to avoid a silent no-op. |

### 5.5 Comparison with the published docs page (https://docs.webengage.com/docs/expo-push, fetched 2026-10-22)

Caveat: the page was read through a fetch tool that summarizes and caps quotes, so the wording below is close to, not exactly, the page. Re-read
the page before quoting it. Where it disagrees with the installed plugin, the plugin source (`webengage-expo-push` 1.0.0) is what actually ran.

| Topic | What the docs page says | What happened in this project | Tag |
|---|---|---|---|
| `iosNSEExistingTarget` | "Set to `true` if another plugin already creates the NSE target"; skips target and file creation and only adds the `WEServiceExtension` pod; use with `iosNSEFilePath` | **This is exactly what was used** (`app.config.js:51-53`). It is not an alternative to the chosen setup; it is the setup. The choice in D3 was this versus `disableNSE` | [OBSERVED] |
| "Only adds the pod" | Pod only | The plugin also injects the App Group into the existing target's entitlements and **copies the merged file** to `<iosNSETargetName>.swift`; both seen in the prebuild log | [OBSERVED] |
| `iosNSEFilePath` | "Path to a custom `NotificationService.swift` file" | Copied to `ios/<iosNSETargetName>/<iosNSETargetName>.swift`, not added to the Xcode project. That equals `NotificationService.swift` only when the existing target is itself named `NotificationService`. Here the target is `DemoNotificationService`, so the copy landed on a file that is not compiled (F2) | [OBSERVED] |
| Podfile prerequisite | Not mentioned | The other plugin must have created a `target '<iosNSETargetName>'` block in the Podfile, or prebuild throws (F1) | [SOURCE] |
| Plugin ordering | Not mentioned on the page. The README inside the npm package says WebEngage's plugin must be listed **before** the other plugin | Followed, and the reverse execution order was seen in the prebuild log | [OBSERVED] |
| Example merged `NotificationService.swift` | Not on the page. The npm README has one | The example was used as the base; the app's own handling was kept in the fallback branch | [OBSERVED] |
| `iosNSETargetName` | "Custom name for the NSE target" | In existing-target mode it is also the name used to find the Podfile block, the folder, the entitlements file and the copied Swift file. There is no separate option for "the file the target compiles", so the doc's options alone cannot fix F2 unless the existing extension's file is named `<TargetName>.swift` | [SOURCE] |
| Troubleshooting for missing rich push | "Confirm the `NotificationService` and `NotificationViewController` folders exist in `ios/`" | In existing-target mode there is no `NotificationService` folder (here `DemoNotificationService`), so this check gives a false alarm; the useful check is that the compiled file holds `WEXPushNotificationService` | [REASONED] |
| Already-prebuilt projects | Use `npx expo prebuild --clean` | A plain `prebuild --no-install --platform ios` merged into the existing `ios/` and worked; `--clean` was never needed or run | [OBSERVED] |
| `devTeam` | Applied to the main app and both extension targets | Set from `ios.appleTeamId`; the signed build succeeded | [OBSERVED] |
| "Notification Service Extension target already exists" on re-prebuild | Use `iosNSEExistingTarget: true` with a merged `iosNSEFilePath` | Consistent. That message appears only when a folder named like WebEngage's target already exists; here it would not have appeared at all (Section 5.1) | [SOURCE] |

**Was the docs option the better idea? Yes, and it is the one chosen.** The doc-only setup (`iosNSEExistingTarget` + `iosNSEFilePath`) is complete only if two things the page does
not state are true: the existing plugin creates a Podfile target block (here fixed with `podfileTarget: true`), and the existing extension compiles a file named after its target
(here fixed with the local copy plugin, or by renaming the file in the app's own plugin, Option 2). A real vendor extension typically names its folder after the vendor but its file
`NotificationService.swift`, so the same gap is likely there (R5).

---

## 6. Findings made along the way

| ID | Finding | Evidence | Where the fix lives | Status |
|---|---|---|---|---|
| F1 | Existing-target mode needs the other plugin to have created a Podfile target block; otherwise prebuild throws | [SOURCE] `updatePodfile.js` | The app's plugin (`podfileTarget: true`) | Fixed by Option A. Not documented in the skill's `push.md` |
| F2 | `webengage-expo-push` 1.0.0 copies the merged file to `<TargetName>.swift` and never adds it to the Xcode project, so it only works if the extension already compiles that exact name | [OBSERVED] log line + `project.pbxproj` + file contents | Upstream plugin; workaround in this project | Worked around (Option 1). **Report to WebEngage** |
| F3 | `pod install` printed two `PBXTargetDependency … unknown UUID … target_proxy` warnings (0 before the extension targets had Podfile blocks; 2 now; 2 in the user's earlier C1 log) | [OBSERVED] | The Xcode project written by the app's own plugin | A signed Debug build succeeded with them present. Effect otherwise unknown |
| F4 | Xcode error `assert.h:42:2: Module file '…_DarwinFoundation1-….pcm' not found` while compiling `ios/Pods/libwebp/src/dec/alpha_dec.c` | [OBSERVED] in the build log | The user's own Xcode DerivedData cache | Did not reproduce in a clean cache. Fix: Product → Clean Build Folder |
| F5 | Link error in a clean cache: 25 undefined React debug symbols (`facebook::react::Sealable::Sealable()`, `ShadowNode::getDebugName`, `hermes::inspector_modern::chrome::enableDebugging`, …) from ExpoModulesCore, RNScreens, RNGestureHandler, RNWorklets | [OBSERVED] | `ios/Pods` state | Fixed (see below) |

**F5 in detail.** [OBSERVED] `ios/Pods/React-Core-prebuilt/React.xcframework` held the Release flavor (12 MB, none of the debug symbols;
the Debug tarball's binary is 63 MB and has them). React Native's build phase "[RNDeps] Replace React Native Core for the right
configuration" decides using a marker file `React-Core-prebuilt/.last_build_configuration`. With no marker and a Debug build it assumes
Debug is already installed and does nothing. The marker was missing. It was most likely removed by a `pod install` (this session
ran two), but that is **[REASONED]**, not confirmed. Fix applied: wrote `Release` to the marker, then ran
`node node_modules/react-native/scripts/replace-rncore-version.js -c Debug -r 0.83.10 -p "$PWD"` from `ios/Pods`; it extracted the Debug tarball
and wrote `Debug`. The build then succeeded. If it recurs after a `pod install`, run the same two commands.

---

## 7. Final implementation

### 7.1 Files changed or added

| File | Change | Why |
|---|---|---|
| `package.json`, `package-lock.json` | + `react-native-webengage`, `webengage-expo`, `webengage-expo-push` | Packages |
| `app.config.js` (new) | Reads the license from `.env`, adds the WebEngage plugin entries before the app's plugin | Env-sourced config, plugin order |
| `app.json` | `"podfileTarget": true` added to the app's own plugin entry (**user-approved edit**, D3) | F1 |
| `nse/NotificationService.merged.swift` (new) | Merged service extension | D2 |
| `plugins/withWebEngageNseSource.js` (new) | Copies the merged file to the compiled file | D4, F2 |
| `src/analytics/WebEngageManager.ts` (new) | Guarded wrapper (never throws; no-op in Expo Go and on web); `init()` only | Skill Init |
| `src/app/_layout.tsx` | Import and one `WebEngageManager.init()` mount effect | Skill Init |
| `.env.example` (new), `.gitignore` | Placeholder and a `.env` line (`.env` was not git-ignored before) | License out of git |
| `.webengage/agent.md`, `webengage-progress.md`, `webengage-support-summary.md` (new) | The skill's state and two notes files (no secrets) | Skill requirement |
| `ios/` (generated, git-ignored) | Regenerated by prebuild (no `--clean`); pods installed; `ios/Pods` React flavor restored | Native setup |

No `android/` file was touched. No git commit, stash or checkout was made by the agent.

### 7.2 The WebEngage part of `app.config.js` (sanitized)

```js
const OWN_EXTENSIONS_PLUGIN = './plugins/withDemoPushExtensions';
// …
const webengagePlugins = [
  ['./node_modules/webengage-expo/src/withWebEngage.js', {
    push: { mode: isProduction ? 'production' : 'development' },
    ios: { WEGLicenseCode: licenseCode /* from .env */, WEGEnvironment: 'DEFAULT',
           WEGLogLevel: isProduction ? 'DEFAULT' : 'VERBOSE', WEGAutoRegister: true },
  }],
  ['webengage-expo-push', {
    mode: isProduction ? 'production' : 'development',
    iPhoneDeploymentTarget: '15.1',                 // equals the app's target
    devTeam: config.ios.appleTeamId,                // from app.json, when set
    iosNSEExistingTarget: true,
    iosNSETargetName: 'DemoNotificationService',
    iosNSEFilePath: './nse/NotificationService.merged.swift',
  }],
  ['./plugins/withWebEngageNseSource', {
    from: './nse/NotificationService.merged.swift',
    to: 'DemoNotificationService/NotificationService.swift',
  }],
];
// inserted into config.plugins immediately BEFORE the app's own plugin entry
```

There is no `android` block (iOS only). `expo config` prints "WebEngage plugin without android config" once per
evaluation; it is expected and recorded in the skill's docs-alignment notes.

### 7.3 The merged service extension (`nse/NotificationService.merged.swift`)

- Class `NotificationService: UNNotificationServiceExtension` (the class name matches the extension's `NSExtensionPrincipalClass`).
- If `request.content.userInfo["source"] == "webengage"` → `WEXPushNotificationService().didReceive(...)` and return
  (and remember it was a WebEngage push so `serviceExtensionTimeWillExpire` delegates the same way).
- Otherwise → the app's own original handling, kept as it was (prefix `[demo-nse] ` on the body).
- Compiles against WebEngage's library: `WEXPushNotificationService` is an `open` subclass of `UNNotificationServiceExtension` with
  `didReceive` and `serviceExtensionTimeWillExpire` [SOURCE: `ios/Pods/WEServiceExtension/Sources/.../WEServiceExtension.swift`] and the
  build succeeded [OBSERVED].

### 7.4 The local plugin (`plugins/withWebEngageNseSource.js`)

A `withDangerousMod(['ios'])` that copies `from` (relative to the project root) over `to` (relative to `ios/`). It throws if
`from` is missing, and throws (rather than skipping) if `to` is missing, because a silent skip would hide the very symptom it exists to fix.
It must be listed before the app's plugin so it runs after that plugin has written its file (observed order in Section 5.4).

### 7.5 Result of the apply steps [OBSERVED unless noted]

| Check | Result |
|---|---|
| `npx expo config --type prebuild` | exit 0 (output discarded; it holds the license) |
| `npx expo prebuild --no-install --platform ios` (never `--clean`) | exit 0, three times (Init, Push, after the local plugin) |
| `cd ios && pod install` | exit 0, twice. `WEServiceExtension` 1.4.0 on `DemoNotificationService`, `WEContentExtension` 1.2.0 on `NotificationViewController` |
| Service extensions in the project | exactly one (`DemoNotificationService`) |
| Content extensions | two: `DemoNotificationContent` (`DEMO_CATEGORY`) and WebEngage's `NotificationViewController` (`WEG_CAROUSEL_V1`, `WEG_RATING_V1`, `WEG_RICH_V1`–`V8`); no category overlap |
| App Group `group.com.webEngage.prodSwift.WEGNotificationGroup` | on the main app, `DemoNotificationService` and `NotificationViewController`; `DemoNotificationContent` has none |
| `aps-environment` | `development` on the main app and the WebEngage content extension |
| Deployment targets | all 15.1 |
| Bundle IDs | app `com.webEngage.prodSwift`; extensions `…NotificationService`, `…NotificationContent`, `…NotificationViewController` |
| Compiled service-extension file | identical to `nse/NotificationService.merged.swift`; Xcode project still compiles only `NotificationService.swift` |
| Info.plist | license equals the one in `.env` (compared, never printed); `WEGEnvironment` DEFAULT; Background Modes `remote-notification` + `fetch` |
| `xcodebuild … -destination id=<iPhone> -allowProvisioningUpdates build` (private DerivedData) | first run failed at link (F5); second run `BUILD SUCCEEDED` |
| Built `DemoNotificationService.appex` | contains `WEXPushNotificationService`, `webengage` string, App Group entitlement |
| `devicectl device install app` + `process launch --console` | installed and launched; no crash |
| Device console | SDK created its location manager and preferences file; downloaded the account configuration from the US data center (license and region valid); in-app campaign engine logged `LifeCycle Notification shown` lines |

---

## 8. Verification ladder — what is proven and what is not

| Level | Claim | Tag |
|---|---|---|
| 1 | Config valid, prebuild merges into the existing `ios/` without error | [OBSERVED] |
| 2 | One service extension; WebEngage's pod attached to it; App Group correct; Podfile blocks correct | [OBSERVED] |
| 3 | Merged WebEngage code is what the extension compiles (file content, then binary symbols) | [OBSERVED] |
| 4 | The app, with all three extensions, builds, signs, installs and launches on iOS 26.0; WebEngage starts and downloads its config | [OBSERVED] |
| 5 | A local push, a push sent through APNs, and a WebEngage push all worked | **[USER-REPORTED]** |
| 5b | During those tests the app's console (still attached by the agent) logged: the JavaScript bundle loaded from the user's own Metro server (18:34–18:35); three `willPresent` notification callbacks (foreground presentation), consistent with the three pushes; and, at 18:39, WebEngage's push-handling lines `we_collapse_key not found in customData` and `COL : stored Notifications`, which come from WebEngage's iOS SDK processing a received WebEngage push inside the app | [OBSERVED] (mapping each `willPresent` to a specific test is [REASONED]) |
| 6 | The WebEngage push went through WebEngage's branch of the merged extension | **Not established** (5b shows the WebEngage SDK received a push in the app; it does not show what the service extension did to it) |
| 7 | The APNs (non-WebEngage) push went through the app's branch | **Not established** |

**How to close levels 6 and 7** (the discriminators built into the merged file):
- The app's branch prefixes the body with `[demo-nse] `. A non-WebEngage push with `mutable-content: 1` should show it.
- A WebEngage push should **not** show it. If it does, WebEngage's branch is not running.
- A WebEngage campaign with an image should show the image when expanded (Rich Push).
- A local notification does not pass through a service extension at all, so it says nothing about this work. It does show that
  `expo-notifications` still works beside WebEngage's setup.

**Never observed in this session:** Rich Push image rendering, the `[demo-nse] ` prefix on screen, push tap/click tracking (`push_notification_click`),
behaviour with the app killed or backgrounded (the app log shows foreground `willPresent` callbacks; the service extension runs in its own process and its output is
not in the app's console), Live Users on the dashboard, a Release or EAS build, `APP_VARIANT=production`, production APNs, Android, and any login, attribute or event.
The agent did not start Metro; the user's own Metro served the JavaScript. The `willPresent` lines come from a notification-center delegate: iOS has one delegate slot and
both `expo-notifications` and WebEngage's SDK are present, so which one printed them is not established (relevant to R10).

Existing compatibility records (skill's `references/compatibility.md`) list "`iosNSEExistingTarget` merge and plugin order" as untested and
"push alongside `expo-notifications`" as unverified. This session adds evidence for the first (levels 1–4) and partial evidence for the second (local push only).

---

## 9. Risks

| ID | Risk | Likelihood / impact | Mitigation or note |
|---|---|---|---|
| R1 | The workaround targets a naming gap in `webengage-expo-push` 1.0.0. If WebEngage later fixes it by adding `<Target>.swift` to the Xcode project, two Swift files would both declare `class NotificationService` in one target (redeclaration error) | Medium / build break after an upgrade | Pin `webengage-expo-push` while this is in place; re-check after each upgrade; remove the local plugin if upstream changes. The `^1.0.0` range allows minor updates |
| R2 | Plugin order matters in two places (WebEngage before the app's plugin; the local plugin before it too) and relies on Expo's reverse `withDangerousMod` order, observed once on SDK 55 | Medium / loud failure (prebuild throws) | Order is encoded in `app.config.js` by insertion before the named plugin. Document it |
| R3 | The local plugin assumes the app's plugin writes `ios/DemoNotificationService/NotificationService.swift` | Low / loud failure | Both paths are explicit props |
| R4 | The "other provider" branch of the merged file is a stand-in (`[demo-nse] ` prefix). A production merge needs the real vendor logic and its own `serviceExtensionTimeWillExpire` handling | High for a real migration / functional | The same structure works; replace the fallback branch |
| R5 | A real vendor plugin (OneSignal, CleverTap, Braze) has not been tested. Their NSE source file is probably named `NotificationService.swift` inside a differently named folder, so the same gap (F2) is likely | Medium / silent failure without the local plugin | Add the verification step "the file the project compiles holds `WEXPushNotificationService`" to any such recipe |
| R6 | F3 warnings: effect on a build unknown | Low / unknown | The signed Debug build and install succeeded |
| R7 | F5: a later `pod install` may drop the React core marker again and break Debug link | Medium / loud (link error) | Command in Section 6; consider documenting in the skill's troubleshooting |
| R8 | Apple signing: automatic signing with `-allowProvisioningUpdates` may have created App IDs or profiles on the user's team for the new content extension (`…NotificationViewController`) and the App Group. Production builds need production profiles and `push.mode: production` (driven by `APP_VARIANT=production`) | Medium / provisioning errors later | Review the team's Identifiers in the Apple Developer portal; the APNs key must match the environment |
| R9 | `WEGAutoRegister: true` makes the native SDK prompt for notification permission at launch, while `push-test.tsx` also requests permission through `expo-notifications` | Low / duplicate or surprising prompts | Both end up on the same system permission |
| R10 | `expo-notifications` and WebEngage both run on iOS. Only a local push was tested | Medium / unverified delegate or tap-tracking interplay | Test push taps and a cold start |
| R11 | **`NSE-CONFLICT-TEST-PLAN.md` (the user's own file) contains the license code, is untracked and is not git-ignored.** `git add .` would commit it. The SDK's device logs also print URLs containing the license | High if committed / secret exposure | Remove or redact the value from that file, or ignore it. The agent's notes files were checked and are clean |
| R12 | Untracked files that could be swept in by `git add .`: `google-services.json` (Android Firebase config, not referenced), `ios-app-init1.txt`, the new files above | Low | Review `git status` before committing; the agent never commits |
| R13 | Disk space: 91% used; the user's earlier `pod install` hit ENOSPC | Low now / build failures when full | Keep headroom; DerivedData and the agent's private build folder in the scratchpad are large |
| R14 | `webengage-expo` 0.0.3 range is exact; `react-native-webengage ^2.1.0` and `webengage-expo-push ^1.0.0` can float | Low | Pin if reproducibility matters |
| R15 | Release builds: `WEGLogLevel` VERBOSE and `push.mode: development` apply unless `APP_VARIANT=production` is set on the command line | Medium / noisy logs or wrong APNs environment | Documented in `app.config.js` comments and the notes |

---

## 10. Deviations from the skill's rules (all recorded in `.webengage/agent.md`)

| Deviation | Reason | Who approved |
|---|---|---|
| Edited the user's own plugin entry in `app.json` (adds a prop) | Required for Option A. The skill otherwise forbids editing other plugins' config | The user chose Option A |
| Added a local config plugin that writes native source (`withWebEngageNseSource`) | Option 1; not part of the skill's specification (only Install Referrer is a sanctioned local plugin) | The user chose Option 1 |
| Built, installed on a device and ran the app, and read its console (skill Core Rule 22: "integrate, don't operate", hand these back) | The user asked the agent to run it | The user |
| Changed generated `ios/Pods` state (marker file and React core flavor) | Needed to link a Debug build | Implied by the user's request to resolve the error |
| Used `-allowProvisioningUpdates` (uses the user's Xcode account to sign, may register IDs) | Needed to produce a signed device build | Implied by the user's request to run it on their phone |
| The agent did not start Metro, run a type check, send any push, or use the user's `.p8` key | Outside the requests and the skill's rules | — |

---

## 11. Recommendations (for the skill maintainers and for WebEngage)

For the skill (`skills/expo`):
1. In `references/channels/push.md` → "Other iOS push providers", add: (a) the other plugin must create a Podfile target block for its
   NSE or the push plugin throws (F1); (b) the merged file is copied to `<TargetName>.swift` and is not added to the project (F2), so add a
   required post-check: *the Swift file named in the Xcode project's service-extension Sources contains `WEXPushNotificationService`*,
   and a documented fix when it does not; (c) a bundle-ID check, because a default-mode install next to an app extension that reuses `<bundleId>.NotificationService` is not caught at prebuild (Section 5.1).
2. Add to `references/troubleshooting.md`: the Debug/Release React core marker problem after `pod install` (F5) and the stale module-cache error (F4).
3. Decide a supported answer for "the client asks the agent to build and run" (Core Rule 22 currently says hand it back), including the signing side effect.
4. Extend the user's `scripts/check-extensions.py` (or the skill's audit) to compare "compiled files" with "files on disk" per extension: that would have flagged F2 directly.
5. Maintainers' compatibility record: this session supports adding a row dated 2026-10-22 — Expo SDK 55.0.31, RN 0.83.10, `webengage-expo` 0.0.3, `webengage-expo-push` 1.0.0, iPhone 15 Pro (iOS 26.0), existing-target mode with a local copy plugin: build and install **observed**; three push tests **user-reported**, no logs.

For WebEngage (`webengage-expo-push`):
6. In existing-target mode, copy the merged file to the file the target actually compiles, or add it to the target, or accept an option naming the file.
7. Fail loudly (or warn) when the copied file is not part of the target's Sources.
8. Document the Podfile-target prerequisite and the ordering rule together.

---

## 12. Reproduction, from a project with an app-owned NSE plugin

1. `npm install react-native-webengage@latest webengage-expo@latest webengage-expo-push@latest`
2. Put the license in `.env` as `WEBENGAGE_LICENSE_CODE`, git-ignore `.env`.
3. Make sure the app's own extension plugin gives its targets Podfile blocks (here: `"podfileTarget": true`).
4. Write the merged Swift file; add `app.config.js` with the three entries in Section 7.2 **before** the app's plugin.
5. `npx expo config --type prebuild > /dev/null`
6. `npx expo prebuild --no-install --platform ios` (never `--clean` unless you accept regenerating `ios/`)
7. `cd ios && pod install` (add `WEBENGAGE_DISABLE_SPM=true` only if static linkage is on; it was not)
8. Verify, without printing the license: one service extension; the file the Xcode project compiles for it holds `WEXPushNotificationService`; the App Group on the app, the service extension and WebEngage's content extension; `Podfile.lock` lists `WEServiceExtension` and `WEContentExtension`.
9. Build: `xcodebuild -workspace ios/WEShop.xcworkspace -scheme WEShop -configuration Debug -destination 'id=<device>' -allowProvisioningUpdates build` (or `npx expo run:ios --device`). If the link fails on `facebook::react::…` symbols, restore the Debug React core (Section 6, F5).
10. Test (device): a non-WebEngage push with `mutable-content: 1` (expect `[demo-nse] ` prefix); a WebEngage push with an image (expect no prefix and the image).

Commands the agent ran, in order: `npm install …`; `npx expo config --type prebuild`; `npx expo prebuild --no-install --platform ios` (×3);
`pod install` (×2); `xcodebuild … build` (×2, private DerivedData); `node …/replace-rncore-version.js -c Debug …`;
`xcrun devicectl device install app`; `xcrun devicectl device process launch --console`. Read-only helpers: `git status/diff/grep/ls-files`, `nm`, `plutil`, `codesign -d`, `strings`.

---

## 13. Open items

- **Tracking User and Tracking Events** (Quick): plan sent, no reply. Identifier = the app's account `id`; `login()` on sign-in, sign-up and session restore;
  `logout()` on sign-out for signed-in users only; attributes `email` (personal data, flagged) and `city`; channel toggles through `setOptIn`;
  events `Order Placed` and `Added To Cart`. The user has not said whether WebEngage attribute or event names already exist.
- **Close levels 6 and 7** of Section 8 (prefix and image observations), and test a tap on a WebEngage push.
- **Dashboard-side:** confirm the APNs key environment matches `push.mode`, and the test device registration.
- **Remove or redact the license code** in `NSE-CONFLICT-TEST-PLAN.md` before any commit (R11).
- **Send F2 and F1** to WebEngage; decide whether to pin `webengage-expo-push` (R1).
- Untested by choice: Android, EAS, Release builds, In-App, In-Line, Inbox.

---

## 14. Summary

- **Handled:** one service extension shared between the app and WebEngage, through `webengage-expo-push`'s existing-target mode, a merged Swift file that routes by `payload["source"] == "webengage"`, and WebEngage's plugins listed before the app's.
- **Chosen by the user:** Quick + Push + iOS + US; Option A (`"podfileTarget": true` on their own plugin) over skipping WebEngage's service extension; Option 1 (a small local plugin that copies the merged file to the compiled file) over renaming their file or leaving Rich Push off.
- **If not chosen:** B would have left Rich Push off and the app's code handling WebEngage pushes too; skipping the Podfile block would stop prebuild; option 3 would have built cleanly and failed silently; option 2 would work here but hide the gap for real vendor plugins; the plugin's default mode would have added a second service extension with the same bundle ID, a failure that appears at build or install, not prebuild.
- **Evidence:** prebuild, `pod install` and a signed Debug build succeeded; the built extension contains WebEngage's code; the user reports local, APNs and WebEngage pushes all worked on their iPhone; the app's console during those tests showed three foreground push callbacks and WebEngage's SDK processing a received WebEngage push.
- **Not proven:** that the WebEngage push used WebEngage's branch and showed its image, push taps, backgrounded and killed states, Release/EAS, Android, any tracking.
- **Findings:** a naming gap in `webengage-expo-push` 1.0.0 (silent), the Podfile-target prerequisite (loud), a Debug/Release React core flavor trap after `pod install`, and a stale Xcode module cache.
- **Risks to act on first:** the license code in `NSE-CONFLICT-TEST-PLAN.md` (untracked, not ignored), the dependence on plugin order and on `webengage-expo-push` staying at 1.0.0, and that no real vendor plugin has been tried.
- **Deviations:** edited the user's plugin entry (approved), added a native-source local plugin, built and ran the app at the user's request, changed `ios/Pods` state, used automatic provisioning.
- **Next:** reply on the login/events plan, confirm the prefix and image observations, and send the two plugin findings to WebEngage.
