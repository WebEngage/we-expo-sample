# Goal: Audit WebEngage Integration

**Trigger:** explicit client request ("audit my WebEngage integration",
"what's already integrated"), or offered by the agent when Pre-Flight
surfaces a regression, an ambiguous state, or pre-existing integration
work found with no `.webengage/` history at all (see
`references/pre-flight.md`'s Reconcile → Surfacing) — offered in all
three cases, never generated without the client asking for it.

**Reads:** the Audit Check results Pre-Flight already computed this
session for every started Goal (see `references/pre-flight.md` —
`Goal: Audit` adds no checks of its own) **as the starting point, not the
evidence: at generation time it re-reads every file it cites** (see
"Re-Read at Generation Time" below), because files change inside one
session — tracking code gets written, a plugin entry gets fixed, the client
pastes a new log — and a ✅ is only true of what the file says now. Plus
`.webengage/agent.md`'s Known Risks table directly, since that isn't
itself an Audit Check result. If the client asks about a Goal that
genuinely has no recorded status at all (never started), there's
nothing to report beyond "not started" — no separate re-scan is
triggered for it. Also reads the exact file+line locations
`push.md`'s, `inapp.md`'s, `inline.md`'s, and `inbox.md`'s own Recording
State sections track (callback registration sites, the Android push
plumbing and background task, permission handling location, plugin
entries in the Expo config, In-Line registration/deregistration sites,
Inbox action/tracking call sites) — that's what tells the Debugging
Checklist below where to look, without a fresh scan of the whole project
(each cited location is still re-read — see "Re-Read at Generation Time").
Same reasoning for `user.md`'s Step 7 and `events.md`'s Recording State —
their full per-attribute/per-event
breakdowns are what populate Tracking User's and Tracking Events'
implemented-item tables below. Same again for `screen-tracking.md`'s
Recording State — its per-screen "Screen Data Passed" column populates
In-App's Screen Tracking table.

**Why this report matters beyond a status summary:** this is the exact
set of files a WebEngage support engineer would otherwise ask the
client for, one at a time, to diagnose an integration issue —
`package.json`, the Expo config (`app.json`/`app.config.js`) with the
plugin entries, `eas.json`, wherever callbacks and the Android push
background task are implemented, the generated native folders if they
exist, and the Expo/EAS build logs. Generating this as a byproduct of
the normal audit — already answering half of it, and explicitly listing
the other half (build artifacts, dashboard screenshots) as still
needed — means a client can hand this single report to support instead
of that back-and-forth happening from scratch.

**Relation to the notes files:** `webengage-support-summary.md` is the running
record of what was *written* and what is open
(`references/progress-reports.md`); this report is the *checked* snapshot —
every ✅ re-read at generation time. A client may send either or both.

**Output:** `audit-webengage-report.md` — client-shareable, plain
language, regenerated fresh every run (a snapshot, not a log; never
appended to like `agent.md` is). Written for someone who did not build
this integration and doesn't need to understand `.webengage/`'s
internal format.

## Structure of the Report

One section per Goal that has any recorded activity (skip Goals never
touched):

```
📋 WEBENGAGE EXPO INTEGRATION AUDIT — [App Name]
Generated: [timestamp]
═══════════════════════════════════════════════════════

## Integration (Init)
Status: Complete ✅ (prebuild checks passed on: [platforms]) / Configured — not yet applied ⚠️ ([what's pending]) — config and wrapper in place. Native build + init check:
Android — client confirmed ✅ / iOS — pending, client to run `npx expo run:ios`
and check Live Users ⚠️ (per platform, as the client reported it — this skill
does not run or observe either)
- License code: read from WEBENGAGE_LICENSE_CODE (app.config.js) ✅ — or
  "literal in Expo config — client's choice (recorded)" ℹ️
- Data center: US (iOS `DEFAULT`, Android `us`) ✅
- Plugin: webengage-expo — explicit path form, all mandatory blocks
  present ✅
- Native folders: generated folders reflect the plugin config ✅ /
  not rebuilt yet ℹ️ (the client's step)
- License code in tracked files: none ✅ / ⚠️ found in [file names — never
  the value] (prebuilt-and-kept or "ignored but tracked" folder)
- react-native-webengage: v2.1.0 ✅
- Wrapper safety guard present (never throws into app code; a silent no-op on
  web and in Expo Go) ✅ — checked in the file; never claimed to work on a
  device
- License guard: warns when the key is missing, fails only a production build ✅
- [any Hard-Rule-derived issues found — always shown, regardless of
  Known Risk records, per `references/rules.md` → How Audit Interprets a Found Violation]

## Tracking User
Status: Full — 8/8 attributes
- login()/logout(): present at all 3 discovered paths ✅
- SDK Authentication: not enabled (default)
- [any Rule-derived issues: shown as informational if backed by a
  Known Risk, as a real issue otherwise]

| Attribute | Data Type | Wrapper Call |
|---|---|---|
| email | String | setEmail(email) |
| birthDate | String | setBirthDate(date) |
| isPremiumUser | Boolean | setAttribute("isPremiumUser", value) |

## Tracking Events
Status: Quick — 2/6 events
- [pending events not yet implemented, listed by name]

| Event Name | Properties (Type) |
|---|---|
| Signup Completed | referralCode (String) |
| Order Placed | Order ID (String), Amount (Number), Delivery Date (Date) |

## Engagement Channels
### Push — Complete (Android: expo-notifications; iOS: Rich Push on; Universal Links off)
- Android token fetched and sent on every app start ✅
- Foreground and background forwarding present, gated on
  `source === 'webengage'`; background task defined at module scope,
  imported at the entry, returns early while active ✅
- Android 13 permission requested at [file:line] (first screen on
  launch); `setDevicePushOptIn` at [file:line] confirmed backed by that
  request ✅
- `google-services.json` referenced via `android.googleServicesFile` ✅
- iOS: `webengage-expo-push` present, `mode` matches `push.mode` ✅;
  extension deployment target (15.1) matches the main app's ✅
- iOS (post-prebuild): both extension folders present; App Group
  identical across all three targets; `aps-environment` and Background
  Modes → Remote notifications present on the main app ✅ (checked
  regardless of Rich Push status)

**If another plugin also creates a Notification Service Extension**
(the finding to actually flag):
> ⚠️ `onesignal-expo-plugin` and `webengage-expo-push` both declare a
> Notification Service Extension. Only one may exist — `webengage-expo-
> push` needs `iosNSEExistingTarget: true`, a merged `iosNSEFilePath`,
> and to be listed before the other plugin. Flagging it here rather
> than resolving it automatically, since which plugin should own the
> target is your call to make.

### In-App — Complete (Screen Tracking: proceeded)
- Launch screen tracked, not just screens reached via later navigation
  ✅
- No mount-only `useEffect` found gating a screen reachable via "back"
  or tab/drawer re-focus ⚠️ [if found — see below]
- No screen double-registered (a root-level hook plus a redundant
  per-screen effect) and no more than one screen's tracking reachable
  at mount time ✅

### In-Line Content — Complete — Features in use: 2 of 3 (`WECampaignCallback`: not in use)
- Screen tracking correctly gated (not just present) for every
  In-Line-used screen ✅
- iOS static framework linkage in effect (build property set) ✅
- No more than one screen's In-Line content mounted/registered without
  the earlier one deregistered first ✅ (same-screen placements excluded
  from this check)

| Screen | Mechanism | propertyId | Hide-until-rendered / style | Tracking |
|---|---|---|---|---|
| Home Screen | `WEInlineWidget` | `home_banner` | ✅ / height+width set | automatic |
| Product Details Screen | `WEPlaceholderCallback` | `product_recommendation` | n/a | `trackImpression`/`trackClick` ✅ present |

### Notification Inbox — Full (SDK Authentication: not requested)
- `resetNotificationCount()` fires at the inbox-entry tap handler, not
  the destination screen's mount effect ✅
- Unread count never numeric-parsed anywhere it's used ✅
- No client-side count-decrement logic found on `markRead`/`markUnread`/
  `markDelete` ✅
- `trackView`/`trackClick` present for every notification shown/tapped ✅
- Pagination: `offset` correctly uses the previous page's last item,
  `hasNext` checked before requesting more ✅
- Account-level enablement request: confirmed raised by client ✅

| Screen | Data Passed | Hook |
|---|---|---|
| Splash Screen | *(none)* | root layout pathname effect |
| Home Screen | isPremium, planTier | root layout pathname effect |
| Cart Screen | cartValue, itemCount | root layout pathname effect |

## Debugging Checklist
### JavaScript / Expo
| Item | Status |
|---|---|
| package.json | ✅ inspected — react-native-webengage v2.1.0, webengage-expo v0.0.3, webengage-expo-push v1.0.0, expo-notifications / @react-native-firebase/messaging if present |
| Expo config (`app.json` / `app.config.js`) | ✅ inspected — plugin entries, props (license code source only), `android.googleServicesFile`, bundle ID / package: [file:line] |
| `eas.json` | ✅ inspected — build profiles and `env` blocks / N/A — local builds only |
| Analytics wrapper | ✅ inspected — src/analytics/WebEngageManager.ts |
| Wrapper `registerCallbacks()` | ✅ inspected — push.onClick, notification.onClick: WebEngageManager.ts:58 |
| Android push plumbing (`sendFcmToken`/`onMessageReceived`/permission — stays outside the wrapper, per `references/wrapper.md` → Analytics Wrapper — Architecture) | ✅ inspected — useWebEngageAndroidPush.ts:14 |
| Android background task / handler | ✅ inspected — webengageBackgroundTask.ts:9, imported at app/_layout.tsx:1 |
| In-Line Content registrations (`react-native-we-personalization`), if in use | ✅ inspected — file:line, sourced from inline.md's Recording State |
| Notification Inbox calls (`react-native-webengage-inbox`), if in use | ✅ inspected — file:line, sourced from inbox.md's Recording State |

### iOS (only if iOS is integrated)
| Item | Status |
|---|---|
| Generated `ios/` folder (post-prebuild; N/A on a CNG project with no local prebuild — use the EAS build log instead) | ✅ inspected / 📋 external — EAS build log |
| `Podfile` / `Podfile.lock` | ✅ inspected — `platform :ios` target, extension pods |
| Main app `Info.plist` | ✅ inspected — `WEGLicenseCode`, `WEGEnvironment`, `UIBackgroundModes` (remote-notification) — required regardless of Rich Push |
| Main app entitlements | ✅ inspected — `aps-environment` value matches the build profile; App Group |
| `NotificationService` — entitlements, Info.plist, source file | ✅ inspected — App Group matches main app (Rich Push only) |
| `NotificationViewController` — entitlements, Info.plist, source file | ✅ inspected — category keys present (Rich Push only) |
| Push Integration screenshot (WebEngage Dashboard) | 📋 external — ask the client |
| IPA / TestFlight build | 📋 external — ask the client if the issue only reproduces on a release build |

### Android (only if Android is integrated)
| Item | Status |
|---|---|
| Generated `android/` AndroidManifest.xml (post-prebuild) | ✅ inspected — WebEngage meta-data keys, `com.webengage.expo_enabled` / 📋 external — EAS build log |
| `google-services.json` | ✅ inspected — package name matches `android.package` |
| Android 13 push permission handling | ✅ inspected — [expo-notifications / PermissionsAndroid / Firebase, file:line] |
| Install Referrer — `com.android.installreferrer` in the generated `android/app/build.gradle` | ✅ inspected / ℹ️ struck on record |
| Push Integration screenshot (WebEngage Dashboard) | 📋 external — ask the client |
| Debug APK / EAS build artifact | 📋 external — ask the client if the issue only reproduces on a built APK, not a dev client |

## Known Risks / Flags
[Every entry from .webengage/agent.md's Known Risks table, across all
Goals — this is the one section that always appears in full,
regardless of which Goals were touched, since it's the client's record
of every deliberate deviation and every refused Hard Rule request.]

═══════════════════════════════════════════════════════
```

## Debugging Checklist — Rules

- Only include the JavaScript section if Init has run at all (it
  always applies once there's any integration); include iOS/Android
  sections only for platforms actually integrated (per Init's Locked
  Facts); include the Rich-Push-specific rows only if Rich Push is on;
  mark a row N/A rather than omitting it when it doesn't apply — an
  omitted row reads as "not checked," not "doesn't apply."
- **Generated-folder rows depend on Pre-Flight's native-folder state.**
  On a CNG project with no local prebuild (cloud EAS builds only), there
  is nothing on disk to inspect — don't fabricate rows from files that
  don't exist; mark them 📋 external and ask for the EAS build log (or
  offer the ask-first local prebuild, Core Rule 22). This skill never
  runs a build.
- **Every ✅ row must cite the actual file (and line, where the
  Recording State tracks one) — never just assert "present" with
  nothing to point at.** The whole value of this section is that a
  client or a support engineer can go straight to the named file.
- **Every 📋 row is external by nature, not a gap in this audit** — a
  build artifact or a dashboard screenshot can never be inspected from
  source. List it anyway, explicitly, so the client knows what to
  gather next.
- Don't fabricate a plausible-looking file+line for a ✅ row if the
  underlying Recording State doesn't actually have one on record —
  that's worse than an honest gap. If a channel Goal's own Recording
  State wasn't kept current, say so as an issue with *that*.
- **`package.json` row: name `react-native-we-personalization`/
  `react-native-webengage-inbox`/`expo-notifications`/
  `expo-task-manager`/`webengage-expo-push` in the inspected note only
  if actually present**, don't add a standing sub-line for a package
  that isn't installed. If a permission-gated package (Core Rule 21) is
  found without a matching install-permission record, append ⚠️
  undocumented, not ✅ — same handling as any other undocumented-
  decision finding, not a Known-Risk-eligible deviation.
- **Never write the license code into the report** — record only its
  source (the env var name / EAS variable, or "literal in Expo config").
- **Build and verification status is per platform and comes from the
  client.** Report it as the client told it ("native build: pending /
  client confirmed", "init line: seen / not seen", "Live Users:
  confirmed / pending"), never as something this skill observed. Name the
  source on each status line: *client confirmed*, *client log* (a log they
  pasted — say which lines it showed, and for which platform), or *not
  verified*. A log read from a paste is still the client's evidence, not
  this skill's observation.

## Re-Read at Generation Time

Before writing the report, re-read each file the report will cite, at the
cited line — don't copy a line number from an earlier scan or from
`agent.md` without opening the file. A citation that moved or no longer
matches is corrected or dropped, never carried over. Read-only commands
that cover the common checks (report names and counts, never values):
- **Direct SDK calls outside the wrapper:** `git grep -n -E
  "webengage\.(track|user|screen)\b" -- . ":!<wrapper file>"` — any hit is
  a finding.
- **Tracking inside loops:** open each recorded call site and read its
  enclosing function — not greppable.
- **Versions:** the lockfile's resolved entries for `react-native-webengage`,
  `webengage-expo` and `webengage-expo-push`, not `package.json` alone.
- **Generated-file lines** (manifest keys, `Info.plist` keys, entitlements): open the file and read the line; a folder that doesn't
  exist yet is *not built yet* (the client's step), not a failure.
- **License code in tracked files:** `git grep -l` for it — report file
  names only, never the value.

## Quick Depth — Keep the Report Short

The examples above are Full-shaped. At Quick depth most channel and push
rows don't apply; don't pad the report to match them:
- **One line per channel that wasn't started** ("Push — not started
  (Quick: In-App was the one channel)"), not an empty section.
- **N/A rows collapsed per section but still listed** ("Android push rows:
  N/A — Push not started"), so an omission never reads as "not checked".
- **A one-line summary where a table would be empty** ("Screen Tracking:
  not presented — Quick depth; 0 of 19 screens instrumented") instead of a
  header with no rows.
- **In-App at Quick:** record "Screen Tracking — not presented, Quick
  depth". That is a depth choice, not a process gap.
- **Quick-shaped examples.** *Tracking User:* "Status: Quick — 2 attributes
  (`plan`, `email`) · login at `AppContext.tsx:255`, logout at `:289`; 6
  candidates left out." *Tracking Events:* "Status: Quick — 2 events (`Order
  Placed`, `Added To Cart`); 4 candidates left out (listed by name)." Each
  still carries the per-attribute and per-event table of what was built.

## What Each Goal Contributes

Every Goal's reference file defines its own "Audit Checks" section —
this Goal does not re-derive checks independently. It pulls from
`init.md`, `user.md`, `events.md`, and each channel file under
`channels/`.

## Rules

- Never omit the Known Risks section, even if empty — an empty section
  confirms nothing was found, which is itself informative.
- Never omit the Debugging Checklist once Init has run — this report's
  whole value as a hand-to-support artifact depends on it always being
  there, not just when something's already known to be wrong.
- Never soften a Hard-Rule-derived issue into "recommended fix"
  language — these are always reported as issues, not suggestions, per
  `references/rules.md` → How Audit Interprets a Found Violation.
- Report opt-in-feature defaults (SDK Authentication, Rich Push,
  Universal Links, multi-app support) as plain status lines, not
  findings — "on" or "off" is a fact to state, not a deviation to flag,
  unless a Hard Rule was actually violated in how one was implemented.
- Don't reconstruct internal `.webengage/` file paths or jargon in the
  report — it's written for the client, not for a future agent session.
- **Tracking User and Tracking Events each get a full implemented-item
  table (attributes with their data types; events with their
  properties and types), not just the terse status line.** Always
  include the table once the Goal has at least one implemented item.
  Source it directly from `.webengage/agent.md`'s recorded breakdown;
  don't re-derive it from a fresh scan — if that breakdown wasn't kept
  current, say so as an issue with *that* Goal's Recording State, not
  by fabricating a plausible-looking table here.
- **Screen Tracking gets the same treatment, under In-App: a Screen /
  Data Passed / Hook table**, sourced from `screen-tracking.md`'s
  Recording State — its "Screen Data Passed" column specifically, never
  its "Candidate" column. Include the launch screen in this table like
  any other.
- **In-Line Content gets a Screen / Mechanism / propertyId / Hide-
  until-rendered-and-style / Tracking table, plus an "X of 3" features-
  in-use summary in the section header itself**, sourced from
  `inline.md`'s Recording State plus the `propertyId(s)` column of
  `screen-tracking.md`'s shared table. Report `WECampaignCallback` as a
  plain status line ("not in use" / "in use") that counts toward the
  "X of 3" figure. The hide-until-rendered/style column only applies to
  `WEInlineWidget` rows — mark it `n/a` for `WEPlaceholderCallback`
  rows, don't leave it blank.
- **WebEngage package version lines: single value by default, never both
  unless they disagree.** Show the lockfile-resolved version
  (`vX.Y.Z ✅`) for each of `react-native-webengage`, `webengage-expo`,
  and `webengage-expo-push`. Only expand to both values when the
  `package.json`-declared range and the lockfile-resolved version
  actually differ — e.g. `^2.1.0 declared → 2.1.3 resolved ℹ️` — and
  treat that expanded form as informational, never a finding.
- **If another plugin creating a Notification Service Extension is
  present, state how it's handled** (`iosNSEExistingTarget` + merged
  file + plugin order), as a plain status line when correctly set up and
  as the flagged finding above when it isn't.
