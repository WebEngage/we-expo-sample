# WebEngage integration — support summary
Generated 2026-10-22 · skill: webengage-integration-expo v1.0 · compatibility record: references/compatibility.md (last row 2026-10-22)

## App
WE Shop · slug `we-shop` · iOS `com.webEngage.prodSwift` · Android `com.webengage.reactSample` (not integrated) · Expo SDK 55.0.31 · React Native 0.83.10 · React 19.2.0 · TypeScript (strict) · Expo Router · New Architecture on · native folders: iOS CNG (git-ignored, 0 tracked), Android ignored-but-tracked (20 tracked files, untouched) · build path: local (`expo run:*`), no `eas.json`

## Packages (declared → lockfile-resolved)
- react-native-webengage `^2.1.0` → 2.1.0
- webengage-expo `^0.0.3` → 0.0.3
- webengage-expo-push `^1.0.0` → 1.0.0 (latest on npm)
- expo-notifications `~55.0.27` (app's own; used in `src/app/push-test.tsx`)
- iOS pods (from `Podfile.lock`): WebEngage 7.1.0, WebengageExpo 0.0.3, WEServiceExtension 1.4.0, WEContentExtension 1.2.0

## Configuration
Data center: US (iOS `DEFAULT`; no Android block) · license source: `WEBENGAGE_LICENSE_CODE` from `.env` (never recorded) · debug: `WEGLogLevel` VERBOSE in development, DEFAULT with `APP_VARIANT=production` · `push.mode`: development / production by the same switch; `webengage-expo-push` `mode` uses the same expression · `WEGAutoRegister`: true · plugin entry form: explicit path `./node_modules/webengage-expo/src/withWebEngage.js` with `push` and `ios` blocks · push plugin: `iPhoneDeploymentTarget` 15.1 (matches the app), `devTeam` from `ios.appleTeamId`, `iosNSEExistingTarget` true, `iosNSETargetName` DemoNotificationService, `iosNSEFilePath` `./nse/NotificationService.merged.swift`; WebEngage's plugins are listed before the app's own extensions plugin · local plugin `./plugins/withWebEngageNseSource` copies the merged file over `ios/DemoNotificationService/NotificationService.swift` · Rich Push: on · Universal Links: off · Android extras: not applicable · defaults mode: off

## Goals
| Goal | Depth | Status | Client confirmation | Updated |
|---|---|---|---|---|
| Integration (Init) | Quick | Complete on iOS (prebuild checks and pod check passed) | pending — native build not yet reported | 2026-10-22 |
| Tracking User | Quick | Not started — plan sent, awaiting reply | — | — |
| Tracking Events | Quick | Not started — plan sent, awaiting reply | — | — |
| Push (iOS) | Quick | Complete on iOS (config applied; generated files and pods checked; the file the extension compiles holds the merged code) | pending — build, run and test push not yet reported | 2026-10-22 |

## Files changed
| Goal | File:line | What |
|---|---|---|
| Init | `package.json:36-39` | three WebEngage packages |
| Init | `package-lock.json` | lockfile |
| Init | `app.config.js:30-38` | `webengage-expo` plugin entry, inserted before the app's own extensions plugin |
| Init | `.env.example:1` | placeholder |
| Init | `.gitignore:34` | `.env` |
| Init | `src/analytics/WebEngageManager.ts:67,106` | guarded factory, `init()` |
| Init | `src/app/_layout.tsx:8,61` | import and `init()` mount effect |
| Push | `app.json:48` | `"podfileTarget": true` on the client's `withDemoPushExtensions` entry (client approved) |
| Push | `app.config.js:42-63` | `webengage-expo-push` entry and the `withWebEngageNseSource` entry |
| Push | `nse/NotificationService.merged.swift:8` | merged service extension (WebEngage payloads to `WEXPushNotificationService`; the app's own handling otherwise) |
| Push | `plugins/withWebEngageNseSource.js:27` | local plugin that copies the merged file where the extension compiles it |

## Pending at the client
- iOS native build and init check by the client (`npx expo run:ios --device`). Agent-run at the client's request 2026-10-22: signed Debug build succeeded, installed on an iPhone 15 Pro (iOS 26.0) and launched; console showed the SDK starting and the account configuration downloading (US). Not a client confirmation
- Apple-portal items for device builds: extension bundle ID `com.webEngage.prodSwift.NotificationViewController`, App Group `group.com.webEngage.prodSwift.WEGNotificationGroup`
- Dashboard: APNs key upload, test device registration
- Client reported 2026-10-22: a local push, a push from APNs and a WebEngage push worked. Still to confirm: the WebEngage push's image and absence of the `[demo-nse]` prefix, and the APNs push's prefix (they show which branch of the merged extension ran). Full write-up: `NSE-COEXISTENCE-REPORT.md`
- Reply on the login/logout and events plan

## Recorded risks and refusals
No Hard Rule refusals. Recorded: `webengage-expo-push` 1.0.0 copies the merged service-extension file to a name the existing extension does not compile; worked around with a local plugin (client's choice). `.env` was not git-ignored at the start; the `.gitignore` line was added.

## Unverified
- iOS Init: observed once on one project (Expo SDK 55); not yet reported by this client.
- Sharing a service extension with an app-owned one (`iosNSEExistingTarget` + merged file + plugin order + the local copy plugin): prebuild, structure, `pod install` and the compiled file's content checked by reading; the Swift file has not been compiled and nothing has run on a device.
- Push alongside the app's own `expo-notifications` on iOS (notification delegate, tap tracking): not verified in the compatibility record.

## Open issues for WebEngage review
Both are *unconfirmed*, noted for review.
1. **Merged service-extension file copied to a name the existing extension does not compile.**
   - Symptom: after prebuild with `iosNSEExistingTarget: true` and `iosNSEFilePath`, the log reads `webengage-expo-push: Copied custom NSE file to existing target: …/ios/DemoNotificationService/DemoNotificationService.swift`, while the Xcode project's service extension compiles `NotificationService.swift`, which kept the original code (0 mentions of `WEXPushNotificationService`).
   - Cause as read in `webengage-expo-push` 1.0.0 (`build/webengage/withWebEngageIos.js`, `build/support/iosConstants.js`): the file name is `<iosNSETargetName>.swift`, and the file is not added to the project.
   - Versions: `webengage-expo-push` 1.0.0, `webengage-expo` 0.0.3, Expo SDK 55.0.31, no device run.
   - Steps: `npx expo prebuild --no-install --platform ios` with the plugin config above.
   - Workaround in use: `plugins/withWebEngageNseSource.js`.
   - Note: the client's earlier run (`results/C1/prebuild.log`) logged a copy to `NotificationService.swift`; the reason for the difference is not known.
2. **Two `PBXTargetDependency … unknown UUID … target_proxy` warnings from `pod install`** once the app's extension targets have Podfile entries (0 before, 2 now, 2 in the client's earlier C1 log). They come from the Xcode project written by the client's own plugin. A Debug build for a device succeeded with them present.
3. **Release flavor of React core left in `ios/Pods` with no `.last_build_configuration` marker** caused a Debug link failure (25 undefined React debug symbols). The swap script treats "no marker and Debug" as already Debug. The marker was most likely removed by `pod install` (not confirmed). Restored with `replace-rncore-version.js -c Debug -r 0.83.10 -p ios/Pods`. React Native 0.83.10, Expo SDK 55.0.31, Xcode 26.0.1.
