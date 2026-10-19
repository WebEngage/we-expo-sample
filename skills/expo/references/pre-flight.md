# Pre-Flight — Silent, Always Runs First

Not a Goal. Runs automatically at the start of every session, before
any Goal work begins and before any conversation with the client about
what to do next. No client interaction happens here.

**Everything Pre-Flight learns is private working knowledge.** It is never
shown to the client, never summarized, and Pre-Flight writes no files —
not even `.webengage/` (that is first written when the first Goal starts).
Its only output is your own to-do list: what is already in place and what
is still missing. See `SKILL.md` → How to Talk to the Client.

**"At the start of every session" is the minimum guarantee, not the
only time this matters (Core Rule 20).** A session is normally one
long conversation, not a fresh restart per file edit — the client
routinely makes changes by hand mid-session (in their IDE, terminal,
CI) after being told to. The full scan below still only runs once,
at the top; what must *not* be treated as one-shot is trusting its
result for the rest of the session. Before repeating any specific
finding back to the client — especially a follow-up "you still
haven't added X" — re-read that specific file right then, regardless
of how far into the session this is.

**Full deep scan, every session — no shortcuts, no caching against a
prior scan.** A prior session's `.webengage/` state is never trusted at
face value; it is always re-verified against what the code currently
shows. This lets every Goal that follows work from accurate, current
information, and it catches integration work that was done correctly
once but has since broken.

## Scope Check — Before Anything Else

Check `package.json` for the `expo` dependency — this is the only
signal to use. **Do not treat the presence or absence of `android`/`ios`
folders as evidence either way** — `expo prebuild` generates real native
folders for a project that is still fundamentally Expo-managed.

- **`expo` present** → proceed.
- **`expo` absent** — whatever else the project is → **stop right here** with
  the one neutral line in `SKILL.md` → Scope. Do not proceed into any part
  of this skill, do not adapt its Goals, and do not name another tool.

## Reads, in Full, Every Time

**General principle behind everything below:** detect the project's
existing environment/tooling facts once, then act on them consistently
for the rest of the session — never re-present a client with parallel
options (npm vs. yarn, `app.json` vs. `app.config.js`, etc.) for
something already determined by what's on disk. This skill's own
defaults are a fallback for when there's genuinely nothing to detect or
match, not a first resort.

### Expo project shape

- **Expo SDK version** (`package.json` → `expo`), and the
  `react-native`/`react` versions it implies. Expo SDK 52+ enables the
  New Architecture by default.
- **Expo config file:** `app.json` (static), `app.config.js`/
  `app.config.ts` (dynamic), or both. Capture the existing `plugins`
  array in full — Core Rule 7 means none of it is ever edited. Capture
  `ios.bundleIdentifier` and `android.package` (both are required for
  the plugins' App Group and extension IDs), `android.googleServicesFile`,
  `ios.googleServicesFile`, `ios.associatedDomains`, `newArchEnabled`,
  and `expo-build-properties` settings if present (deployment
  target, `useFrameworks`).
- **Entry point:** where the app actually starts — `main` in
  `package.json` (`expo-router/entry`, `index.js`, a custom file), and
  the root component/layout it renders. This decides where the root
  mount effect lives. **If an `app/` directory is used for file-based
  routes, record it — the wrapper must never be placed inside it.**
  *(Which navigation library the app uses is determined separately,
  from its actual code — see "Screens" below; never inferred from the
  entry point or a package name alone.)*
- **Native-folder state — per platform. It decides how the apply steps
  and the license warning work, and it is never inferred from a folder's
  mere existence or from `.gitignore` alone.** For each of `ios/` and
  `android/` (a mixed project — one platform CNG, the other not — is
  normal) check three things:
  - **On disk?**
  - **Tracked?** `git ls-files -- <folder> | wc -l` — any count above
    zero means tracked, **even if the folder is also in `.gitignore`**
    ("ignored but tracked": the ignore rule was added after the files were
    committed, and it does not untrack them).
  - **Ignored?** `git check-ignore -q <folder>`.

  Classify each platform:
  - **Absent** → CNG; the folders appear when a prebuild or build runs.
  - **Present, ignored, nothing tracked** → **Continuous Native
    Generation (CNG)**: regenerated from config; plugin edits take effect
    on every prebuild; manual edits are disposable.
  - **Anything tracked** → **prebuilt-and-kept** for that platform: a
    plain `expo prebuild` (no `--clean`) merges plugin changes into the
    files; `--clean` would destroy any hand edits. **Record the number of
    tracked files** — it feeds the license warning in the prebuild ask
    (prebuild writes the literal license code into tracked native files,
    so `git commit -a` would commit it). Check for signs of
    hand-integration that conflicts with the plugin — a manual WebEngage
    init already in `MainApplication`/`AppDelegate`
    (`WebEngageActivityLifeCycleCallbacks`, `WEGWebEngageBridge`,
    `autoRegister`). If found, tell the client — a second init alongside
    the plugin's would run twice (Init Hard Rule 5) — and never
    resolve it silently.
  - **Present, neither tracked nor ignored** → unversioned: `git add .`
    would sweep generated files (and, after prebuild, the license code)
    into the repo. Keep it private; it becomes a ⚠️ line only when you
    offer prebuild.
  - **Not a git repository** → tracking can't be checked; treat existing
    folders as prebuilt-and-kept and say that tracking couldn't be
    checked.
- **Working-tree state (read-only).** `git status --porcelain` — any output
  means uncommitted changes. Private, like everything here: it earns **one**
  heads-up line in the first message to the client
  (`references/safety.md` §5) and nothing else — never a stash, a commit, or
  a refusal. Not a git repository → the heads-up is the different one in the
  same section (no history to fall back on).
- **Build path:** `eas.json` present (EAS Build profiles, and whether
  `development`/`production` profiles and their `env` blocks exist),
  `expo-dev-client` in dependencies, real `ios/`/`android/` folders with
  scripts using `expo run:*`. **Any one of these is a valid
  development-build path — `expo-dev-client` is not required**, and a
  `--dev-client` flag on `expo start` is not a signal either way. Only
  if *none* exist may the client be on Expo Go only — flag it (see
  `SKILL.md` → Scope); it does not block writing config/JS.
- **Upgrade prerequisite:** Expo SDK below 52 or React Native below 0.76
  is a *blocker* finding (see `references/init.md` → Old Project —
  Recommend Upgrading First; the skill recommends the upgrade, never
  performs it). `react-native-webengage` below 2.0.0 on its own is not a
  blocker — installing `@latest` replaces it.
- **Compatibility:** compare the client's Expo SDK / package versions to
  `references/compatibility.md` and state whether the combination has
  been verified — an unlisted one is unverified, not forbidden.
- **Existing secrets/config mechanism for the license key:** an
  existing `.env`/`.env.*` convention, `EXPO_PUBLIC_*` usage, EAS
  `env` blocks in `eas.json`, or an existing `app.config.js` that
  already reads `process.env`. Reuse whichever the app already has
  (Core Rule 10) rather than introducing a second one. Also whether
  `.env`/`.env*.local` are git-ignored. **An app with no mechanism at
  all is fine** — a recommendation, not a requirement.
- **Build environment, for `agent.md`'s Project Identity → Build
  Environment table** (debugging fingerprint, not integration
  decisions): Node version (`.nvmrc`/`engines.node`), `eas-cli` version
  if `eas.json` is present, and — only if `ios/`/`android/` exist —
  Gradle version, AGP/Kotlin versions, compile/target/min SDK,
  CocoaPods version (`ios/Podfile.lock`'s `COCOAPODS:` line), and the
  iOS deployment target (`ios/Podfile`'s `platform :ios` line — this is
  also what `webengage-expo-push`'s `iPhoneDeploymentTarget` must match;
  if `ios/` doesn't exist yet, read it from `expo-build-properties` or
  note that it will be known after prebuild). Xcode and macOS versions
  are never in the repo — leave blank unless the client mentions one.

### Codebase

- **Language:** JavaScript or TypeScript (`tsconfig.json`, ratio of
  `.ts`/`.tsx` to `.js`/`.jsx` — a finding to confirm, only a question
  when genuinely mixed).
- **Package manager — detect once, then use for every install command
  in every Goal:** `package-lock.json` → npm, `yarn.lock` → yarn,
  `pnpm-lock.yaml` → pnpm, `bun.lock`/`bun.lockb` → bun. **Expo's own
  packages install with `npx expo install <pkg>`** (it picks the
  SDK-compatible version) — use that for `expo-*` packages and
  `@react-native-firebase/*`/third-party packages Expo knows; WebEngage's
  packages (`react-native-webengage`, `webengage-expo`,
  `webengage-expo-push`, `react-native-we-personalization`,
  `react-native-webengage-inbox`) install with the detected package
  manager at their latest version. Multiple or no lockfiles → take the
  manager named by the `packageManager` field, else the newest lockfile,
  else npm, and state it in the approval — no question here.
- **Which platforms the project targets:** `ios`/`android` keys in the
  Expo config, `platforms` field, and whether both bundle identifier and
  package name are set. Both present doesn't necessarily mean both are
  wanted — that's Init's question; **Both is the recommended answer**.
- All screens, and **how the app actually handles navigation — read it
  from the code, don't assume it from a dependency.** A navigation
  package in `package.json` is a lead, not a finding: confirm it's the
  one in real use by what the code imports and calls (route files under
  `app/`, `<NavigationContainer>`/`createStackNavigator`,
  `Navigation.events()`, `router.push`, a hand-rolled `screen` state
  switch…). Apps carry unused or secondary navigation packages. Record
  the library (and wrapper, if the app routes through its own helper)
  and the file where navigation is set up, since it determines which
  hook `screen-tracking.md` uses later.
- **Whether a navigation-change hook already exists, for any purpose**
  — an existing `onStateChange` on a `NavigationContainer`, a
  `usePathname`/`useSegments` effect in a root layout, an existing
  screen-view call for another analytics tool, or an existing
  navigation observer. A `screen-tracking.md` concern to act on;
  Pre-Flight is only where the finding comes from.
- API call patterns (fetch/axios calls, Redux/Zustand/Context action
  handlers, async success paths tied to a user action) — seeds
  candidate events.
- Auth flow: exact file + function for login success (all paths —
  email, social, OTP, biometric, SSO), logout, session restore, token
  refresh (if it re-identifies the user).
- Existing hooks/lifecycle effects relevant to app-wide setup (the
  root layout's or root component's mount effect, where a
  callback-registration block would belong).

### Existing WebEngage installation

Capture **both** the declared range in `package.json` and the
actually-resolved version in the lockfile/`node_modules`, for each of:
`react-native-webengage`, `webengage-expo`, `webengage-expo-push`
(Core Rule 2). These are not interchangeable: a caret range resolves
forward on its own; the lockfile-resolved value is what's running and
what every version-gated check must key off.

- `react-native-webengage` v2.0.0 is the floor (peer dependency of
  `webengage-expo`); v2.0.1+ is needed for Universal Links on a
  Bridgeless/New Architecture project; v2.1.0+ links the native iOS SDK
  via SPM automatically when supported. Below v2.0.0 is a real finding,
  not just staleness.
- `webengage-expo-push` below v1.0.0 → `devTeam`, `useSPM`,
  `disableNSE`, `iosCEFilePath`, and custom target names are rejected.
- **The plugin entries in the Expo config:** is `webengage-expo`
  present, and in which form? A bare `"webengage-expo"` entry or a
  string with no config object is a real finding (it throws at
  prebuild). Is `webengage-expo-push` present, and does its `mode`
  match `webengage-expo`'s `push.mode`? Capture every prop value
  (without the license code itself — record only its *source*).
- **A manual hand-integration** (see "Native-folder state" above)
  coexisting with the plugin.
- **Installed but not listed (read-only):** for each WebEngage package —
  the three above plus `react-native-we-personalization` and
  `react-native-webengage-inbox` — compare `node_modules/<pkg>/package.json`
  with `package.json` and the lockfile. Present in `node_modules` but in
  neither is a leftover from an earlier branch or a partial install: keep
  it private. Never use `node_modules` as the
  source of truth for versions (Core Rule 2 still reads the manifest and
  lockfile).

### Existing push setup, if any

Which Android push transport the app already uses — this drives Core
Rule 16, so detect it precisely:

- `@react-native-firebase/messaging` (+ `@react-native-firebase/app`)
  in `package.json`.
- `expo-notifications` in `package.json`, and `expo-task-manager`.
- Both, neither, or something else (OneSignal, a custom native module).
- `google-services.json` present and referenced via
  `android.googleServicesFile` (Android FCM delivery needs it
  regardless of which JS library is used).
- Existing usage of the library: `setNotificationHandler`,
  `addNotificationReceivedListener`, `registerTaskAsync`/
  `TaskManager.defineTask` (an existing background task — a second
  `defineTask` with a different name is fine; the same name is a
  collision), `messaging().onMessage`/`setBackgroundMessageHandler`.
- Existing iOS push providers: any other plugin creating a
  `NotificationService` target (OneSignal's `onesignal-expo-plugin`,
  Braze, etc.) — **this decides whether `iosNSEExistingTarget` and
  plugin ordering matter** (see `references/channels/push.md`).
- `UIBackgroundModes`/`aps-environment`/App Groups already declared in
  the Expo config (`ios.infoPlist`, `ios.entitlements`).

Keep these findings private — except the two that change what Push does
(the library-detection result, Core Rule 16, and an existing
NSE-creating plugin); those come up only when the Push Goal starts, inside
its first question.

### Feature packages and other tools

- **`react-native-we-personalization` / `react-native-webengage-inbox`
  presence in `package.json`**, if either — existing state to
  reconcile against. Still check `.webengage/agent.md`'s Locked Facts/
  Known Risks for a record of the client having explicitly granted
  install permission (Core Rule 21) — found with no matching record just
  means the permission is asked for when that Goal starts. If present, also
  capture what each channel's own Pre-Flight Reconciliation needs: for
  In-Line, which screens already use `WEInlineWidget`/
  `registerWEPlaceholderCallback` and their `propertyId`s; for Inbox,
  which screens already call `getNotificationList`/`markRead`/etc. and
  whether `resetNotificationCount()` is wired at an inbox-entry tap.
- **Existing third-party analytics tools**, if any (MoEngage, GA4/
  Firebase Analytics, CleverTap, Amplitude, Mixpanel, Segment, Braze,
  AppsFlyer): extract event names, properties, and login/logout/
  identify call locations as reference input only — never to migrate,
  modify, or comment on (Core Rule 9).
- **License source and data center already in the project** (read-only,
  private): the license in `.env`, the Expo config or an env variable (record
  only the *source*, never the value) and any data center already named
  (`WEGEnvironment`, `com.webengage.sdk.android.environment`). Init asks for
  them only when they are missing. The operating system and whether `pod`
  is installed are **not** read here (Core Rule 22) — the pod apply step
  reports them if it can't run.
- **The skill's own Analytics wrapper file** (see `references/wrapper.md` →
  Analytics Wrapper — Architecture) — check `.webengage/agent.md`'s
  Locked Facts for a recorded path first, then confirm it still exists
  and re-read its current contents (which methods it already has:
  `init`, `login`/`logout`/attributes, `trackEvent`, `trackScreen`,
  `registerCallbacks()` and which blocks).
- **Any other existing generic analytics wrapper** (e.g.
  `AnalyticsService`, `TrackingManager`): reference only, for naming/
  folder/placement conventions — never a file this skill adds WebEngage
  methods into (Core Rule 9).

### Screens, at full depth, every session

- `webengage.screen()` presence per screen (a direct SDK call if
  present at all, since Screen Tracking hasn't run yet on a fresh
  project).
- Functional role inferred from the code (product detail, cart,
  settings, etc.).
- Candidate Screen Data keys worth proposing for targeting/
  personalization, reasoned from functional role — never a PII
  candidate (Core Rule 13).
- Navigation mechanism per screen container, as found in the code
  (above): Expo Router (the root `_layout` and nested layouts — and
  whether a single root layout can host a route-change effect), React
  Navigation (Stack/Tab/Drawer — single `NavigationContainer` with a
  state-change listener, or multiple disconnected containers),
  `react-native-navigation`, manual conditional rendering, or any other
  library/custom wrapper — for an unfamiliar one, record its name and
  where its "route/screen changed" signal (if it exposes one) lives.

Pre-Flight writes no file for this. It keeps the screen table for the
session; the first Goal that needs screen tracking (In-App at Full, or
In-Line) writes it to `.webengage/channels/screen-tracking.md` at its own
Recording State, so later Goals read it instead of re-scanning.

**Candidate events and candidate user attributes:** drafted from
handlers/API calls/state models the same way, for `Tracking Events` and
`Tracking User` to present later. Pre-Flight only proposes — it never
confirms or implements.

**`.webengage/agent.md`** and any relevant per-Goal file, if present:
what a prior session recorded as done, pending, or locked.

**Integration depth** (`Integration depth` and `Depth overrides` in
Locked Facts): read it and carry it silently into every Goal (Core Rule
23). Pre-Flight never asks about depth — it only reads it. A missing
value is not an error; it means depth hasn't been asked yet — it is
asked once, right after Pre-Flight and before Init for an open-ended
request, otherwise at the first scope-bearing Goal (`references/depth.md`).

## Reconcile — Turn What You Found Into a Private To-Do List

After reading the project, you know — privately — what is already in
place and what is still missing for each Goal. That becomes the to-do list
the integration works through. **Missing work is work to do — never an
"issue", a "violation", or a "regression".** The client came to get
WebEngage integrated; a missing plugin entry or an undecided setting is
simply the next thing to do, and you ask for whatever you can't decide
yourself.

- **Use each Goal's own Audit Checks as the checklist** (`references/
  init.md`, `references/user.md`, `references/events.md`, each
  `references/channels/*.md`) to tell what is done, partly done, or
  missing. Pieces that are present and correct are simply reused — don't
  list them to the client.
- **Pre-existing work with no `.webengage/` record** (a client-built or
  hand-integrated setup, or an earlier session) is just the starting point.
  Reuse the existing wrapper, events, and attributes; the to-do list is
  whatever is missing or wrong. Fixing something wrong in WebEngage's own
  code is part of the work: it goes on the short change list the client
  approves, in plain terms ("I'll correct the plugin entry so Expo can find
  it") — never presented as a finding.
- **Recorded work that has since gone missing from the code** (the record
  says done, the code disagrees) is also just a to-do — "I'll put it
  back" — mentioned only if the client has to decide something.
- **Decisions nobody has made yet** (for example whether to keep sending
  PII attributes that already exist) are asked when that Goal starts, in
  the Goal's own question — never up front.
- **Re-verify before relying on an earlier read (Core Rule 20).** Before
  telling the client anything specific about a file, re-read that file
  right then. Nothing here watches files continuously.
- **For Tracking User and Tracking Events, record what already exists.**
  Read every implemented attribute's name and type and every event's name,
  properties, and types now, and write them into `.webengage/agent.md` when
  that Goal starts (not during Pre-Flight), so the audit tables render
  without a fresh scan.
- **The "issue / violation / regression" classification and the Known Risk
  labels belong to `Goal: Audit`** (`references/rules.md` → How Audit Interprets a Found Violation). They are used with the client only when the client asks
  for an audit.

## What Pre-Flight Says Out Loud

Almost nothing. The client never sees a "Pre-Flight result", a findings
list, or an inventory of their project. Say something only in these cases,
in one or two plain sentences, inside the conversation that follows:

1. **Something stops the integration and only the client can fix it** —
   a project that isn't an Expo project (the one neutral line in
   `SKILL.md` → Scope), an Expo SDK below 52 (a project upgrade comes first — `references/init.md` → Old
   Project), or a hand-written WebEngage init in committed native folders
   (`references/init.md` → Hand-Written WebEngage Init in Committed Native
   Folders).
2. **A risk that belongs to a question you are about to ask** — attached to
   that question as a single ⚠️ line (for example native folders tracked in
   git when you offer prebuild, or a `.env` that isn't git-ignored when you
   ask about the license code).
3. **Where you are starting from**, only if part of the integration
   already exists: one short sentence such as "I'll build on what's already
   in your project." No inventory.
4. **Uncommitted changes in the client's repository** (or no git history at
   all) — one heads-up line, once, in the first message
   (`references/safety.md` §5). Never a stash, a commit, or a refusal.
5. **What hasn't been verified**, if the Goal about to start involves a
   feature `references/compatibility.md` lists as documented-but-not-run or
   designed-but-not-run — one plain sentence at the start of that Goal
   (`references/confirm-and-wrap-up.md` → The Unverified Label).

Everything else — SDK and package versions, native-folder state, build
path, existing code that is fine, compatibility status, other analytics
tools, push libraries, leftovers, toolchain reads — stays private. Never
narrate what you checked, ran, or didn't run. When more than one thing
stops the integration, lead with the one that comes first and give a
single recommendation.

## Produces

All of it private, for the Goals that follow:
- The to-do list: what exists and what is missing, per Goal.
- Candidate discovery (events, attributes, screens, navigation
  mechanisms) for Goals not yet started.
- The Android push transport detection result (Core Rule 16) and the
  per-platform native-folder state, with the tracked-file count.
- The recorded Integration depth, or "not chosen yet".

## Never Produces

- A message to the client that lists findings, issues, or an inventory.
- A formatted report. `Goal: Audit`'s `audit-webengage-report.md` is the
  only report, generated only on request.
- Any file in the client's repo — including `.webengage/`, which is first
  written when the first Goal starts.
- Any code change, install, prebuild, or build. Pre-Flight is read-only,
  always.
