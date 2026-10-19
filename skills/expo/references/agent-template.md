# agent.md

**Purpose:** Machine-oriented state log for resuming this integration
in a future session, and for Pre-Flight's every-session reconciliation
against the current codebase. Read by Pre-Flight and every Goal;
corrected in place when Pre-Flight finds drift, not strictly
append-only — see `references/pre-flight.md`.

**Audience:** Future agent sessions. The people-facing files are generated
*from* this one: `webengage-progress.md` (the client) and
`webengage-support-summary.md` (the WebEngage team), refreshed silently after
every Goal (`references/progress-reports.md`), plus the on-demand
`audit-webengage-report.md` from `Goal: Audit`. This file is not meant to be
read by the client directly.

**Never record a secret anywhere in `.webengage/`** — not the license code,
credentials, tokens, `.env` values, or end-user data. Record only sources and
names (the environment variable name, the EAS variable, the file that holds
it).

---

## Project Identity
- Project: [App Name]
- Android package / iOS bundle ID: [android.package] / [ios.bundleIdentifier]
- Skill: webengage-integration-expo
- First session started: [Date]

### Build Environment (for debugging — not integration decisions)

The Locked Facts table below is about *choices made*; this is about
*what the project actually is* — the fingerprint worth having on hand
for debugging. Pre-Flight detects what it genuinely can from the repo;
the rest is only knowable by asking the client, and is not required if
the client does not know these details.

| Item | Value | Source |
|---|---|---|
| Expo SDK version | | `package.json` → `expo` (also in Locked Facts — keep in sync, don't duplicate-track separately) |
| React Native / React version | | `package.json` |
| Node.js version | | `.nvmrc` or `package.json` → `engines.node`, if present — otherwise ask |
| Package manager | npm / yarn / pnpm / bun | lockfile (Pre-Flight) |
| `eas-cli` version | | `eas.json` → `cli.version`, if present |
| Android — Gradle / AGP / Kotlin | | generated `android/` only — `gradle-wrapper.properties`, `android/build.gradle` |
| Android — compileSdk / targetSdk / minSdk | | generated `android/app/build.gradle`, or `expo-build-properties` |
| iOS — CocoaPods version | | generated `ios/Podfile.lock` → `COCOAPODS:` line |
| iOS — deployment target | | generated `ios/Podfile` → `platform :ios`, or `expo-build-properties` |
| iOS — Xcode version | | not in the repo — ask only if an issue looks Xcode-version-shaped |
| macOS version (dev machine) | | not in the repo — ask only if relevant to an iOS build issue |

Re-verify this the same way Locked Facts is re-verified (Core Rule
20/Pre-Flight) — these are exactly the values that drift silently when
someone upgrades a tool without mentioning it.

---

## Locked Facts (Do Not Re-Ask)

| Fact | Value | Locked in Goal |
|---|---|---|
| Platforms integrated | Android / iOS / Both | Init |
| Integration depth | Quick / Full — chosen [date], applies to every Goal. Asked once, never re-asked (Core Rule 23). If the client's own words answered it, say so: "client said 'quick setup'" | Depth gate (right after Pre-Flight for an open-ended request; otherwise the first scope-bearing Goal) |
| Defaults mode | Off / On — client said "[their words]" [date]; changed back on [date] if so. Never says what was defaulted — that is in Goal Log | Whenever the client says it, or turns it off |
| Depth overrides | None / one line per override — [Goal → Quick/Full, client's request, date]. Written only when the client asks to change depth for a single Goal | On client request |
| Existing data model — attributes | None / yes — [where the spec lives: dashboard / doc]. Asked in Tracking User | Tracking User |
| Existing data model — events | None / yes — [where the spec lives: dashboard / doc]. Asked in Tracking Events | Tracking Events |
| License Code (source, not value) | env var name + where it's supplied (`.env` / EAS variable), or "literal in Expo config — client's choice" (Known Risk recorded) | Init |
| Data Center Region | US / IN / KSA / EUG — iOS value + Android value written | Init |
| Debug Mode | true / false / build-profile-driven | Init |
| `react-native-webengage` Version | lockfile-resolved (the version actually running) — add the declared range only if it differs | Init |
| `webengage-expo` Version | lockfile-resolved | Init |
| `webengage-expo-push` Version | lockfile-resolved / not installed | Engagement Channels — Push |
| Expo SDK Version | | Pre-Flight |
| Expo config file | `app.json` / `app.config.js` / both — and whether Init created `app.config.js` | Pre-Flight / Init |
| Entry point | `main` / root component or layout file | Pre-Flight |
| Navigation library in actual use | Expo Router / React Navigation / `react-native-navigation` / manual / other — [name, setup file] | Pre-Flight |
| Native-folder state — per platform | CNG (ignored, nothing tracked) / prebuilt-and-kept — [N tracked files, even if also in `.gitignore`] / unversioned (neither tracked nor ignored) / absent | Pre-Flight |
| Apply steps (ask-first, Core Rule 22) | Config check: [run date — passed/failed / declined / n/a] · Prebuild: [run date / declined] · `pod install`: [run date / declined — client runs it / n/a] | Init |
| Build path | EAS Build / local (`expo run:*`) / both | Init |
| Native build + init check — Android (client-run, as reported) | Pending — client to run / Client confirmed: build run, `WebEngage Successfully Initialized` seen / Client reported a problem — [summary] / Not integrated | Init |
| Native build + init check — iOS (client-run, as reported) | Pending — client to run / Client confirmed: build run, Live Users seen / Client reported a problem — [summary] / Not integrated | Init |
| Language | TypeScript / JavaScript | Pre-Flight |
| New Architecture | on / off | Pre-Flight |
| Android Install Referrer | Added / Struck by the client / N/A | Init |
| Existing Android Push Transport Found | `expo-notifications` / `@react-native-firebase/messaging` / both / none | Pre-Flight |
| WebEngage Analytics Wrapper — File Path | | Init |
| WebEngage Analytics Wrapper — Methods Present | init / login / logout / attributes / trackEvent / trackScreen | (running list) |
| WebEngage Analytics Wrapper — `registerCallbacks()` Blocks Present | push.onClick / universalLink.onClick / notification.onPrepare-onShown-onClick-onDismiss / onAnonymousIdChanged / tokenInvalidatedCallback | (running list — only if `registerCallbacks()` exists at all) |
| Other Existing Analytics Wrapper (reference only) | Yes / No — [class name] | Pre-Flight |
| Login identifier type | email / phone / userId / CUID | Tracking User |
| Guest mode / restored sessions | N/A (no guest mode, no session restore) / guest: no `login()`, `logout()` only after a sign-in · restored session: `login()` re-called at the restore site / left as is — [client's choice] | Tracking User |
| SDK Authentication (JWT) enabled | Yes / No (default No, client-requested only) | Tracking User |
| Hashed email/phone attributes in use | Yes / No — WebEngage support enablement disclosed: Yes / No | Tracking User |
| Event naming convention | Title Case / snake_case / other | Tracking Events |
| Android push transport | `expo-notifications` (+ `expo-task-manager`) / Firebase — how decided (detected / client chose between both / installed with permission) | Engagement Channels — Push |
| Rich Push (iOS) | On (default) / Off (`disableNSE`) | Engagement Channels — Push |
| Other iOS NSE-creating plugin | None / [plugin name] — handled via `iosNSEExistingTarget` + merged file | Engagement Channels — Push |
| Universal Links | Off (default) / On | Engagement Channels — Push |
| In-Line mechanism per placement | `WEInlineWidget` (every placement under Quick depth) / `WEPlaceholderCallback` (Full depth, only for a placement that needs custom rendering) — per placement, not app-wide | Engagement Channels — In-Line |
| `WECampaignCallback` (In-Line) | Not in use (default) / In use — client-requested | Engagement Channels — In-Line |
| Inbox scope applied | Follows Integration depth unless overridden — Quick: count/first-page/tap-to-read only / Full: + pagination + all actions | Engagement Channels — Inbox |
| Inbox account-level enablement | Pending / Confirmed by client (support@webengage.com request) | Engagement Channels — Inbox |

---

## Goal Status

| Goal | Status | Scope applied (Quick/Full — from Integration depth unless overridden) | Confirmation (client-reported) | Last Updated |
|---|---|---|---|---|
| Pre-Flight | Runs every session | — | — | — |
| Audit WebEngage Integration | On request | — | — | — |
| Integration (Init) | | | pending / client confirmed [date] / problem — [summary] | |
| Tracking User | | | pending / client confirmed [date] / problem — [summary] | |
| Tracking Events | | | pending / client confirmed [date] / problem — [summary] | |
| Engagement Channels — Push | | | pending / client confirmed [date] / problem — [summary] | |
| Engagement Channels — In-App | | | pending / client confirmed [date] / problem — [summary] | |
| Engagement Channels — In-Line Content | | | pending / client confirmed [date] / problem — [summary] | |
| Engagement Channels — Notification Inbox | | | pending / client confirmed [date] / problem — [summary] | |

*Init's Status uses: Complete (prebuild checks passed, per platform) / Configured — not yet applied (what is pending) / Partial / Skipped.*

---

## Files Changed

One row per file the skill added or edited — the source for the per-Goal undo
list and for `webengage-support-summary.md` (`references/progress-reports.md`).
The line is the last one known; it is re-read from the file whenever the notes
are written, never trusted (Core Rule 20).

| Goal | File | What was added or changed | Last known line | Added / edited | Date |
|---|---|---|---|---|---|
| | | | | | |

## Open at the Client

What only the client can do or confirm — the source for "Waiting on you" in
`webengage-progress.md` and "Pending at the client" in the support summary.

| Item | Goal | Raised | Status |
|---|---|---|---|
| (a native build to run · a dashboard upload (APNs key, FCM credentials) · a device check to report · a test campaign · a support request) | | | pending / done [date] |

---

## Goal Log (One Entry Per Session Touching a Goal)

In "use your defaults" mode (Core Rule 28) every entry also lists **Defaults
applied:** each item decided without asking, so the notes can report it.

### [Timestamp] — Pre-Flight
- Language: TypeScript / JavaScript — Expo SDK: [x] — New Arch: on/off
- Navigation library in use (from code): [name / manual / other]
- Native folders: CNG / prebuilt-and-kept / absent — build path: EAS / local / none found
- Platforms found: Android [configured/not] — iOS [configured/not]
- Screens found: [count] — navigation mechanism — the full table is in `.webengage/channels/screen-tracking.md` once a screen-tracking Goal has written it
- Existing Android push transport found: [none / expo-notifications / @react-native-firebase/messaging / both]
- Other iOS NSE-creating plugin found: [none / name]
- Third-party analytics found: [tool names, or "none"] — reference only, per Core Rule 9
- Auth flow locations: [file:function list]
- Previously-done items found missing this session (and restored): [list, or "none"]

### [Timestamp] — Integration (Init)
- Status: Complete (prebuild checks passed on every chosen platform) / Configured — not yet applied (per platform: [what's pending]) / Partial / Skipped
- Platforms integrated: Android / iOS / Both
- Files changed: [list — Expo config, `.env`, wrapper, root layout]
- Native build (client-run): not yet reported / client confirmed [date] — init check reported via [Logcat / Xcode / Live Users]

### [Timestamp] — Tracking User
- Status: Quick [n/total] / Full [total/total]
- Identifier type (pre-filled from login code / asked — ambiguous):
- SDK Authentication: enabled (client-requested) / not enabled
- PII attributes — tracked: [list] / struck by the client: [list] / very sensitive, skipped: [list]

### [Timestamp] — Tracking Events
- Status: Quick [n/total] / Full [total/total]
- Naming convention (decided by the skill):

### [Timestamp] — Engagement Channels — Push
- Status:
- Android transport: expo-notifications (+ task-manager) / Firebase — [how decided]
- iOS: webengage-expo-push [version] — Rich Push on (default) / off
- Universal Links: off (default) / on
- See `.webengage/channels/push.md` for full detail

### [Timestamp] — Engagement Channels — In-App
- Status:
- See `.webengage/channels/inapp.md` for full detail

### [Timestamp] — Engagement Channels — In-Line Content
- Status:
- Placements: [screen → propertyId → mechanism (Widget/Placeholder)]
- `WECampaignCallback`: not in use (default) / in use (client-requested)
- See `.webengage/channels/inline.md` for full detail; per-screen
  `propertyId` mappings live in `.webengage/channels/screen-tracking.md`

### [Timestamp] — Engagement Channels — Notification Inbox
- Status: Quick [scope] / Full [scope]
- SDK Authentication: not requested (default) / requested — client
  routed to WebEngage team
- Account-level enablement request: pending / confirmed raised /
  confirmed completed
- See `.webengage/channels/inbox.md` for full detail

---

## Issues Reported by the Client

Symptom → cause → fix for any build/toolchain/device problem the client
told us about after running their own build — exactly what a returning
session needs and can't derive from the code. This skill never hits these
itself (Core Rule 22); it records what the client reports. Append; don't
rewrite.

| Symptom | Cause | Fix |
|---|---|---|
| | | |

---

## Known Risks / Flags Raised

Every Hard Rule refusal and every recorded Rule deviation lands here —
see `references/rules.md` → Hard Rules — Definition and Rules — Definition. Opt-in
feature defaults (Core Rule 15–17) do **not** get an entry merely for
being turned on by client request — only if implementing the client's
choice itself required a Rule deviation. Never edit or remove a prior
entry; append new ones and mark Resolved if a later session addresses
it.

| Risk | Goal | Type (Hard Rule refusal / Rule deviation) | Resolved |
|---|---|---|---|
| | | | |

---

## Unresolved Questions Across Sessions

| Question | Raised in Goal | Status |
|---|---|---|
| | | |
