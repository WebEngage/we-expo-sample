# Alignment With WebEngage's Published Expo Docs

Load this when a client asks why the skill does something differently from
WebEngage's documentation, when the published docs change, or before editing
a rule that touches setup.

**WebEngage's published guides are the source of truth** for how the plugins
are configured and how Android push is forwarded: the *WebEngage Expo Plugin*
integration guide (`https://docs.webengage.com/docs/expo`) and the *WebEngage
Expo Push* integration guide, plus the React Native JavaScript API guides they
link to. Where this skill follows them, it says nothing. Where it differs, the
difference is deliberate and listed here. If a published guide changes, change
the skill — or add a row here saying why not.

## Where the skill differs, and why

| Topic | The published docs | This skill | Why |
|---|---|---|---|
| License code | A literal in the plugin config (`WEGLicenseCode`, the manifest key) | Reads `WEBENGAGE_LICENSE_CODE` (`.env` locally, an EAS variable in cloud builds) through `app.config.js`; a literal if the client prefers, recorded as a low-severity risk | On Expo the code is written into generated native files and a literal sits in committed source. Same plugin keys either way. |
| Install commands | `npm install <package>` | The detected package manager, always `@latest` | A project that already lists an old `react-native-webengage` range fails with `ERESOLVE` against `webengage-expo`'s `>=2.0.0` peer on a plain install (observed). |
| Building | `npx expo prebuild`, then `expo run:*` or `eas build` | Runs only up to three steps, in one approval — `expo config --type prebuild` (output discarded), `expo prebuild --no-install`, and on iOS `pod install` when needed — and never `run:*`, `eas build`, or a launch. Tells the client what to run | Integrating, not operating the client's machine. Prebuild only runs CocoaPods when it newly creates `ios/` (read from the Expo CLI source), so an explicit `pod install` step is the dependable one. |
| `prebuild --clean` | Recommended when the push plugin is added to an already-prebuilt project, and for the "extension target already exists" error | Never runs it; tells the client the same fix, what it deletes, and that they run it | It deletes and regenerates `ios/` and `android/` — hand edits and tracked files go with them. |
| Android Install Referrer | Not in the Expo guides | Added by default through a small local config plugin; named in the change list. | Taken from WebEngage's Android integration guidance. Without it, `App Installed` and `First Acquisition Details` aren't tracked. |
| Custom App Group (`appGroupName`) | Listed as an optional push-plugin key | Never set; declines, redirects to support, records a refusal | From reading the plugins: `webengage-expo-push` writes a custom name only into the two extensions, while `webengage-expo` writes the default into the main app — so they end up in different groups and rich push silently falls back to plain text. Not device-tested. |
| SDK instances | `new WebEngage()` in each file that uses it | One guarded instance in a wrapper file; a second only inside the Android background task | A second instance subscribed after the native pre-launch buffer flushed is the usual cause of "push click not working"; one wrapper also holds the safety guard. |
| Safety | Calls made directly | The wrapper never throws, is a silent no-op on web and in Expo Go, logs in development builds only | A WebEngage problem must not become an app problem; the native module isn't in Expo Go or on web. *Designed from the SDK source, not run.* |
| Android 13 permission | Shows requesting permission and passing the result | Adds the request only if the app has none; otherwise adds just `setDevicePushOptIn(result)` at the existing site | Never prompts twice; `setDevicePushOptIn(true)` with no real request behind it is a known bug pattern. |
| Debug logging | Example config uses `VERBOSE` / `debug: true` | Driven by the build profile — verbose in development, off in production | So a release build doesn't ship verbose logging. |
| Scope | The push plugin also lists bare React Native as supported | Expo projects only; any other project gets one neutral line pointing at WebEngage's docs | One skill, one technology. |
| iOS-only project | The official page lists the android keys as required | Omits the `android` block (the plugin only warns) | Nothing on Android to configure; recorded here so it isn't mistaken for a mistake. |
| iOS init log lines | Docs name `WebEngage SDK Initialized` | Also lists two observed lines (`Verification complete…`, `App Group configured`) as seen on a device, not documented | The extra lines were observed once on a physical iPhone. |

## Where the skill adds to the docs

The docs describe setup; the skill adds the engineering around it: scanning
the project first, resuming from recorded state, the Quick/Full depth choice,
proposing events and attributes with PII decisions, call-site placement, the
Goal-by-Goal order with a working app after each one, per-Goal "how to
confirm" steps, undo lists, the two notes files, an audit report, and a
record of what has and hasn't been verified (`references/compatibility.md`).

## Where it matches the docs exactly (no row needed)

The explicit-path plugin entry with a config object; the `push` and `ios`
blocks always present; `push.mode` matching `webengage-expo-push`'s `mode`;
Rich Push on by default; Android token sent on every start; forwarding only
messages with `data.source === 'webengage'`, as `{ data }`; the `AppState`
guard in the background task; the log lines for confirming init (Android
Logcat `WebEngage Successfully Initialized`, Xcode `WebEngage SDK Initialized`,
Live Users); Expo Go and Expo Snack unsupported;
`support@webengage.com` for anything outside the plugin.

## Open items in the published docs

The source guide carries two unresolved items: the *Advanced* guide link
needs a real page, and the *App Inbox* page was not yet published. The skill
doesn't link to either.
