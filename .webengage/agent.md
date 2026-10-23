# agent.md

State log for resuming this WebEngage integration. Read by Pre-Flight and every Goal.
Never contains a secret — sources and names only.

---

## Project Identity
- Project: WE Shop (`we-shop`)
- Android package / iOS bundle ID: com.webengage.reactSample / com.webEngage.prodSwift
- Skill: webengage-integration-expo
- First session started: 2026-10-22

### Build Environment

| Item | Value | Source |
|---|---|---|
| Expo SDK version | 55.0.31 | `package.json`, `node_modules/expo` |
| React Native / React version | 0.83.10 / 19.2.0 | `package.json` |
| Node.js version | v22.22.2 (dev machine; no `.nvmrc`) | shell |
| Package manager | npm | `package-lock.json` |
| `eas-cli` version | n/a (no `eas.json`) | — |
| Android — Gradle / AGP / Kotlin | Gradle 9.0.0 (AGP/Kotlin from RN plugins) | `android/gradle/wrapper/gradle-wrapper.properties` |
| iOS — CocoaPods version | 1.16.2 | `ios/Podfile.lock` |
| iOS — deployment target | 15.1 (Podfile default; none set in properties) | `ios/Podfile` line 21 |
| iOS — Xcode / macOS | not recorded | — |

---

## Locked Facts (Do Not Re-Ask)

| Fact | Value | Locked in Goal |
|---|---|---|
| Platforms integrated | iOS only (client: "ios only", 2026-10-22). Android skipped on purpose | Init |
| Integration depth | Quick — client said "quick + push" 2026-10-22 | Depth gate |
| Quick channel | Push (named by the client; In-App is the default only when none is named) | Depth gate |
| Defaults mode | Off | — |
| Depth overrides | None | — |
| Existing data model — attributes | Not asked yet | Tracking User |
| Existing data model — events | Not asked yet | Tracking Events |
| License Code (source, not value) | `WEBENGAGE_LICENSE_CODE` in `.env` (git-ignored via the `.env` line added to `.gitignore`); `.env.example` committed. Client approved the plan that named this source | Init |
| Data Center Region | US — iOS `DEFAULT` (no Android block written) | Init |
| Debug Mode | Build-variant driven: `WEGLogLevel` VERBOSE in dev, DEFAULT and `push.mode: production` when `APP_VARIANT=production` | Init |
| `react-native-webengage` Version | 2.1.0 (declared `^2.1.0`) | Init |
| `webengage-expo` Version | 0.0.3 (declared `^0.0.3` — exactly 0.0.3) | Init |
| `webengage-expo-push` Version | 1.0.0 (declared `^1.0.0`; latest on npm), plugin entry added | Push |
| Expo SDK Version | 55.0.31 | Pre-Flight |
| Expo config file | `app.json` + `app.config.js` (Init created `app.config.js`; `app.json` untouched) | Init |
| Entry point | `main: expo-router/entry`; root layout `src/app/_layout.tsx` | Pre-Flight |
| Navigation library in actual use | Expo Router (`src/app`, `Stack.Protected` auth guard) | Pre-Flight |
| Native-folder state — per platform | iOS: CNG (git-ignored, 0 tracked). Android: ignored-but-tracked (20 tracked files) — not touched, iOS-only run | Pre-Flight |
| Apply steps | Init: config check, prebuild (`--no-install --platform ios`, no `--clean`) and `pod install` run 2026-10-22, all passed. Push: the same three run again 2026-10-22 after the push config was written, all exit 0 | Init / Push |
| Rich Push (iOS) | On (default) — configured; the merged service-extension code is now the file the extension compiles (local plugin, option 1 chosen by the client 2026-10-22). Not built or run on a device | Push |
| Local plugin for the merged service-extension file | `plugins/withWebEngageNseSource.js`, listed before the app's own extensions plugin; copies `nse/NotificationService.merged.swift` over `ios/DemoNotificationService/NotificationService.swift` | Push |
| Build path | local (`expo run:*`); no `eas.json` | Init |
| Native build + init check — iOS (client-run) | The client ran the app on their iPhone with their own Metro server and reported push working (see Push); they have not reported the init log line or Live Users. Agent-run at the client's request 2026-10-22 18:33 (not a client confirmation): signed Debug build for the client's iPhone succeeded, installed and launched; device console showed the SDK starting (location manager created, preferences file, account configuration downloaded from the US data center). JS not loaded (no Metro); `WebEngage SDK Initialized` line not captured (the console stream shows NSLog output only) | Init |
| Native build + init check — Android | Not integrated | Init |
| Language | TypeScript (`strict`) | Pre-Flight |
| New Architecture | on (Expo SDK 55 default) | Pre-Flight |
| Android Install Referrer | N/A (iOS only) | Init |
| Existing Android Push Transport Found | `expo-notifications` (used only in `src/app/push-test.tsx`); `expo-task-manager` absent; Android not integrated | Pre-Flight |
| WebEngage Analytics Wrapper — File Path | `src/analytics/WebEngageManager.ts` | Init |
| WebEngage Analytics Wrapper — Methods Present | init | (running list) |
| Other Existing Analytics Wrapper | No | Pre-Flight |
| Other iOS NSE-creating plugin | Yes — app-owned `./plugins/withDemoPushExtensions` (targets `DemoNotificationService` + `DemoNotificationContent`, bundle suffixes `NotificationService` / `NotificationContent`, no App Group). Handled via `iosNSEExistingTarget` + merged file + WebEngage plugins listed before it. Client approved adding `"podfileTarget": true` to that entry (option A, 2026-10-22) | Push |
| Universal Links | Off (default) | Push |

---

## Goal Status

| Goal | Status | Scope applied | Confirmation (client-reported) | Last Updated |
|---|---|---|---|---|
| Integration (Init) | Complete on iOS (prebuild checks + pod check passed) | Quick | pending — client to build and run | 2026-10-22 |
| Tracking User | Not started | Quick | — | — |
| Tracking Events | Not started | Quick | — | — |
| Engagement Channels — Push | Complete on iOS (config applied, generated files and pods checked; the compiled extension file holds the merged code) | Quick | client reported 2026-10-22: a local push, a push from APNs and a WebEngage push all worked on their iPhone (no logs from the client; whether the WebEngage push showed its image and skipped the `[demo-nse]` prefix was not reported) | 2026-10-22 |

---

## Files Changed

| Goal | File | What was added or changed | Last known line | Added / edited | Date |
|---|---|---|---|---|---|
| Init | `package.json` | `react-native-webengage`, `webengage-expo`, `webengage-expo-push` | 36–39 | edited | 2026-10-22 |
| Init | `package-lock.json` | lockfile for the three packages | — | edited | 2026-10-22 |
| Init | `app.config.js` | license from env, `webengage-expo` plugin entry (US, iOS block, `push.mode`) inserted before `./plugins/withDemoPushExtensions` | 30–38 | added | 2026-10-22 |
| Init | `.env.example` | placeholder for `WEBENGAGE_LICENSE_CODE` | 1 | added | 2026-10-22 |
| Init | `.gitignore` | `.env` line | 34 | edited | 2026-10-22 |
| Init | `src/analytics/WebEngageManager.ts` | guarded wrapper, `init()` | 106 | added | 2026-10-22 |
| Init | `src/app/_layout.tsx` | wrapper import and `init()` in a mount effect | 8, 61 | edited | 2026-10-22 |
| Push | `app.json` | `"podfileTarget": true` added to the client's own `withDemoPushExtensions` entry (client approved, option A) | 48 | edited | 2026-10-22 |
| Push | `app.config.js` | `webengage-expo-push` entry (mode, `iPhoneDeploymentTarget` 15.1, `devTeam` from `ios.appleTeamId`, `iosNSEExistingTarget`, `iosNSETargetName` DemoNotificationService, `iosNSEFilePath`) and the `withWebEngageNseSource` entry | 42-63 | edited | 2026-10-22 |
| Push | `plugins/withWebEngageNseSource.js` | local plugin: copies the merged Swift file over the file the app's extension compiles; stops with a clear error if the target file is missing (wrong plugin order) | 27 | added | 2026-10-22 |
| Push | `nse/NotificationService.merged.swift` | merged service extension: WebEngage payloads to `WEXPushNotificationService`, other pushes keep the app's own handling | 8 | added | 2026-10-22 |
| Init, Push | `ios/` (generated, git-ignored) | plugins applied by prebuild; pods installed (`WEServiceExtension` 1.4.0, `WEContentExtension` 1.2.0, `WebEngage` 7.1.0) | — | generated | 2026-10-22 |

## Open at the Client

| Item | Goal | Raised | Status |
|---|---|---|---|
| Build, run and test pushes on an iPhone | Push | 2026-10-22 | done 2026-10-22 (client reported local, APNs and WebEngage pushes worked) |
| Say whether the WebEngage push showed its image and did NOT show the `[demo-nse]` prefix, and whether the APNs push showed the prefix — these prove the merged extension routes correctly | Push | 2026-10-22 | pending |
| Remove or redact the license code in the client's own `NSE-CONFLICT-TEST-PLAN.md` (untracked, not git-ignored) before any commit | Init | 2026-10-22 | pending |
| Reply to the login/logout and events plan, and say whether attribute / event names already exist | Tracking User, Tracking Events | 2026-10-22 | pending |
| Build and run on iOS (`npx expo run:ios --device`), check the init lines in Xcode or Live Users | Init | 2026-10-22 | pending |
| Register `com.webEngage.prodSwift.NotificationViewController` and the App Group `group.com.webEngage.prodSwift.WEGNotificationGroup` for device builds (Xcode automatic signing can do it) | Push | 2026-10-22 | pending |
| Upload the APNs key (.p8, Key ID, Team ID, bundle ID) in the WebEngage dashboard | Push | 2026-10-22 | pending |

---

## Goal Log

### 2026-10-22 — Pre-Flight
- Language: TypeScript — Expo SDK 55.0.31 — New Arch: on
- Navigation library in use (from code): Expo Router
- Native folders: iOS CNG, Android ignored-but-tracked (20 files) — build path: local
- Platforms found: Android configured (package) — iOS configured (bundle id, team id)
- Existing Android push transport found: expo-notifications
- Other iOS NSE-creating plugin found: `./plugins/withDemoPushExtensions` (app-owned)
- Third-party analytics found: none
- Auth flow locations: `src/context/AppContext.tsx` — `login`, `signup`, `continueAsGuest`, `logout` (central functions)
- Channel opt-in toggles found: `src/app/notification-settings.tsx` (push, email, sms, whatsapp), state in `AppContext` `optIns` / `setOptIn`

### 2026-10-22 — Integration (Init)
- Status: Complete on iOS — Info.plist (license matches the chosen one, `WEGEnvironment` DEFAULT, `WEGLogLevel` VERBOSE, `WEGAutoRegister` true), `aps-environment: development`, App Group `group.com.webEngage.prodSwift.WEGNotificationGroup`, Background Modes `remote-notification` + `fetch`; `Podfile.lock` lists `react-native-webengage` 2.1.0, `WebEngage` 7.1.0, `WebengageExpo` 0.0.3 as pods (static linkage off, so no `WEBENGAGE_DISABLE_SPM` prefix)
- No tracked file holds the license
- Android warning `without android config` is expected for an iOS-only run
- Native build (client-run): not yet reported

### 2026-10-22 — Engagement Channels — Push
- Status: configured, applied, checked — but Rich Push is NOT effective yet (see "Found" below).
- Android: not integrated (client chose iOS only). iOS: `webengage-expo-push` 1.0.0, Rich Push on (default), Universal Links off.
- Before the config: the Podfile had only `target 'WEShop'`; the push plugin with `iosNSEExistingTarget: true` throws when `target 'DemoNotificationService'` is missing (`webengage-expo-push/build/support/updatePodfile.js`). Client chose option A: `"podfileTarget": true` on their plugin entry.
- Applied 2026-10-22: config check, `prebuild --no-install --platform ios` (no `--clean`), `pod install` — all exit 0.
- Checks that passed: exactly one service extension (`DemoNotificationService`); content extensions `DemoNotificationContent` (category `DEMO_CATEGORY`) and `NotificationViewController` (categories `WEG_CAROUSEL_V1`, `WEG_RATING_V1`, `WEG_RICH_V1`–`V8`) — no overlap; App Group `group.com.webEngage.prodSwift.WEGNotificationGroup` on the main app, `DemoNotificationService` and `NotificationViewController`; `aps-environment: development`; every deployment target 15.1; Podfile blocks for all three extensions with `WEServiceExtension` on the service extension and `WEContentExtension` on `NotificationViewController`; `Podfile.lock` lists both pods.
- **Found:** `webengage-expo-push` 1.0.0 copies the merged file to `ios/<iosNSETargetName>/<iosNSETargetName>.swift` (here `DemoNotificationService.swift`; log: "Copied custom NSE file to existing target: …/DemoNotificationService.swift") and does not add it to the Xcode project. The client's plugin compiles `NotificationService.swift` (project.pbxproj lines for that file), which still holds the original code, 0 mentions of `WEXPushNotificationService`. So the merged WebEngage code is on disk but not built. Client's earlier run (`results/C1/prebuild.log`) logged a copy to `NotificationService.swift`; why this run differs is not known.
- Also seen: `pod install` prints 2 `PBXTargetDependency … unknown UUID … target_proxy` warnings. 0 before the extension targets were in the Podfile, 2 now, 2 in the client's earlier C1 log. They come from the Xcode project the client's plugin writes; effect on the build not known.
- The app builds and runs as before; plain pushes use the client's own extension.
- **Fixed (client chose option 1, 2026-10-22):** added `plugins/withWebEngageNseSource.js`, listed before the app's own plugin, so it runs after that plugin writes its file. Re-ran the config check and `prebuild --no-install --platform ios` (both exit 0; `pod install` not re-run, Podfile unchanged). Log: `[withWebEngageNseSource] Copied ./nse/NotificationService.merged.swift to ios/DemoNotificationService/NotificationService.swift`. Verified by reading: the compiled file is identical to the merged file and mentions `WEXPushNotificationService`; the Xcode project still compiles only `NotificationService.swift`; `Podfile.lock` still lists both pods; one service extension; principal class `NotificationService`.
- Side effect: the push plugin still writes an unused `DemoNotificationService.swift` next to it. It is not in the Xcode project and is harmless.
- Not verified: Rich Push on a device. Verified later in the same session (agent-run at the client's request): the Swift compiles, the service-extension binary contains `WEXPushNotificationService` and is signed with the WebEngage App Group, all three extensions embed in the app, and the two `PBXTargetDependency` warnings did not stop the build.
- **Client report, 2026-10-22:** a local push, a push from APNs and a WebEngage push all worked. The agent's console stream, still attached during those tests, logged the JavaScript bundle loading from the client's Metro, three foreground `willPresent` callbacks, and WebEngage push-handling lines (`we_collapse_key not found in customData`, `COL : stored Notifications`). Not established: that the service extension routed each push to the right branch (needs the image and the `[demo-nse]` prefix observations); which notification-center delegate (`expo-notifications` or WebEngage) printed `willPresent`.
- Full write-up for review: `NSE-COEXISTENCE-REPORT.md` at the project root (decisions, options, alternatives, risks, evidence).
- 2026-10-22 18:33 device run (agent-run, client's iPhone 15 Pro, iOS 26.0): `BUILD SUCCEEDED`; installed; console shows the SDK starting and downloading the account configuration (US) — no crash. The in-app campaign engine logged `LifeCycle Notification shown` lines (an in-app campaign from the account may have displayed). Not yet seen: a push received, the permission prompt result, the JS-side init.

---

## Issues Reported by the Client

| Symptom | Cause | Fix |
|---|---|---|
| Xcode: `assert.h:42:2: Module file '…/ExplicitPrecompiledModules/_DarwinFoundation1-….pcm' not found` while compiling `ios/Pods/libwebp/src/dec/alpha_dec.c` | Stale or racing Xcode module cache in the client's DerivedData (`WEShop-fiqrei…`); the cache folder held a `.scan` file with a different hash than the one requested. Not reproduced in a clean cache | Product → Clean Build Folder (⇧⌘K) and run again; or delete that project's DerivedData folder with Xcode closed. Not WebEngage code |
| Link error building `WEShop.debug.dylib`: 25 undefined symbols (`facebook::react::Sealable::Sealable()`, `ShadowNode::getDebugName`, `hermes::inspector_modern::chrome::enableDebugging`, …) referenced from ExpoModulesCore, RNScreens, RNGestureHandler, RNWorklets | `ios/Pods/React-Core-prebuilt` held the Release flavor of React core (12 MB, none of the debug symbols) while building Debug; its marker `React-Core-prebuilt/.last_build_configuration` was missing, so React Native's swap script assumed Debug and did nothing. The marker was most likely removed by a `pod install` (the skill's, 2026-10-22) — not confirmed | Wrote `Release` to the marker and ran `node node_modules/react-native/scripts/replace-rncore-version.js -c Debug -r 0.83.10 -p ios/Pods` from `ios/Pods`: Debug flavor restored (63 MB, symbols present), marker now `Debug`. The build phase swaps flavors by configuration from here on. If it recurs after a `pod install`: run the same two commands |

## Known Risks / Flags Raised

| Risk | Goal | Type | Resolved |
|---|---|---|---|
| `.env` was not git-ignored when Init started | Init | — (fixed on the change list: `.gitignore` line) | Yes |
| Client asked the skill to build, install and run the app and read the device console; done at the client's request, 2026-10-22 (the skill's default is to hand these back, Core Rule 22). Built with a private DerivedData folder (`-allowProvisioningUpdates`, which uses the client's Xcode account to sign), installed with `devicectl`, console streamed. Metro was not started | Init, Push | Rule deviation — client's request | n/a |
| Merged service-extension file is copied by `webengage-expo-push` 1.0.0 to a file name the existing extension does not compile | Push | Rule deviation — worked around with a local plugin (client's choice, 2026-10-22); reported to WebEngage as an open issue in the support summary | Worked around, not resolved upstream |

## Unresolved Questions Across Sessions

| Question | Raised in Goal | Status |
|---|---|---|
| Existing WebEngage attribute / event names to follow? | Tracking User, Tracking Events | open |
