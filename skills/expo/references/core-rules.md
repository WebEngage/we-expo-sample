# Core Rules — Full Text

The numbered rules in `SKILL.md` are the short form; this file is the full text. Rule numbers are cited across the references (for example "Core Rule 22") — never renumber a rule; add new ones at the end.

The reference files cite these rules by number (for example "Core Rule
22") — never renumber a rule; add new ones at the end.

1. **Pre-Flight always runs first, silently, every session** — full
   deep scan of the codebase and `.webengage/`, no code changes, and its
   results stay private (see *How to Talk to the Client*). Every Goal
   assumes Pre-Flight has already run.
2. **Pre-Flight must determine the installed versions** of
   `react-native-webengage`, `webengage-expo`, and `webengage-expo-push`
   (from `package.json`/lockfile, not assumed) before any Goal
   proceeds, plus the Expo SDK version. This skill targets
   `react-native-webengage` v2.0.0+ — below it, callback queuing (Rule
   19) does not exist and Fabric/TurboModule support is missing, and
   Expo SDK 52+ enables the New Architecture by default. If an older
   Expo SDK is found, see `references/init.md` → "Old Project —
   Recommend Upgrading First": a prerequisite project upgrade that this
   skill recommends but never performs (an old `react-native-webengage`
   alone is fixed by installing `@latest`).
   `references/compatibility.md` lists the Expo SDKs the plugins have
   been verified against.
   `webengage-expo-push` v1.0.0+ is required for `devTeam`, `useSPM`,
   `disableNSE`, `iosCEFilePath`, and the custom-target-name options —
   on `0.0.1` those keys are rejected at prebuild time.
3. **Init is the only mandatory precondition, and on Expo it is
   completed by plugin configuration — not by native code written by
   this skill, and not by a build or a device run.** Init is complete
   when the `webengage-expo` plugin entry is present in the Expo config
   with all mandatory blocks (`references/init.md` Hard Rules), the
   packages are installed, the Analytics Wrapper exists, **and a
   client-approved prebuild has generated the native projects and the
   read-only post-checks found the WebEngage settings in every chosen
   platform's generated files** (`references/init.md` → Apply the Plugin →
   Post-checks). Until then Init is reported as *configured — not yet
   applied*, never *complete* — when the client declines prebuild, or when
   a post-check fails. This is **per platform**: a platform whose checks
   pass is complete even while the other is pending (for example iOS on a
   non-macOS machine), and the message names which is which. An EAS-based project is no exception — the skill runs
   prebuild **locally** to verify the integration (EAS prebuilds again in
   the cloud, so git-ignored `ios/`/`android/` are never pushed). A native build and a device or dashboard check come after that
   and **are the client's steps**:
   the skill tells the client what to run and what to look for
   (`references/init.md` → Build and Run — the Client's Steps, Verify
   Integration), records what the client reports, and never marks a
   platform "verified" on its own. The JS-side
   `webengage.initialize()` call is not part of that requirement — on
   Android it reaches an empty method body, and on iOS it only re-sets
   a JWT-invalidated-token callback that native init already sets
   before any JS runs. Still have the wrapper call it once, for parity
   with WebEngage's own sample and the SDK Authentication callback
   path, but treat its absence as harmless, never as an incomplete Init.
4. **One Goal at a time.** Never combine Goals in a single step. (One *approval message* may cover Init and the first Goals together — defaults mode — but each Goal is still applied and recorded on its own, in order.)
5. **Never write to the client's project without first showing a short
   change list — file names and what each is for — and getting a yes.**
   At Init the change list and the apply plan (the commands of
   Rule 22) are **one approval**, with every risk that applies to this
   project named in that same message. In "use your defaults" mode (Rule
   28) the attribute/event lists join it.
6. **Always update `.webengage/agent.md`** (and the relevant per-Goal
   file) after every Goal-related change — never leave state stale.
7. **Never remove existing code** — this includes existing entries in
   the `plugins` array, existing `app.json` keys, and other plugins'
   configuration. Add only WebEngage's own entries.
8. **Personal data in User Attributes is decided by how sensitive it
   is.** *Very sensitive* data — passwords, tokens, card or government ID
   numbers, health data, a precise or delivery address — is never tracked:
   skip it and say so in one line, no question. If the client insists,
   implement it their way and record a Known Risk (never silently). *Ordinary contact data*
   (email, first/last name, phone, birth date) is listed with `⚠️ PII` in
   the one approval message — the client strikes any they don't want, so
   it costs no extra question. No default is being deviated from, so
   nothing is logged as a Known Risk either way.
9. **The agent's job is WebEngage integration only.** If Pre-Flight
   finds another analytics/marketing tool already integrated
   (MoEngage, GA4/Firebase Analytics, CleverTap, Amplitude, Mixpanel,
   Segment, Braze, etc.), use it purely as reference — never touch,
   remove, modify, or comment on it, and never suggest migrating away
   from it. Firebase Cloud Messaging (`@react-native-firebase/messaging`)
   and `expo-notifications` are not "another analytics tool" under this
   rule — they are WebEngage's own supported Android push transports
   (see `references/channels/push.md`), not competing integrations.
10. **Prefer reading the license code from environment config over a
    literal in committed Expo config — a recommendation, not a
    requirement.** On Expo the code lands in generated native files
    (`Info.plist`, the Android manifest) at build time, so a literal in
    `app.json` is a literal committed to source, and per-profile
    separation is lost. Recommend `app.config.js` reading
    `process.env.WEBENGAGE_LICENSE_CODE` (a `.env` file locally, EAS
    environment variables in cloud builds) — **but follow the client**:
    if the app has no env mechanism and doesn't want one, put the value
    in the existing Expo config as they prefer; never convert their
    config file shape against their wishes, and never block Init over
    it. If Pre-Flight finds an existing env/secrets mechanism, reuse it
    instead of introducing a second one. A literal is a Rule deviation,
    recorded per `references/rules.md` → Rules — Definition (a low-severity Known Risk entry),
    not refused. In the environment-sourced `app.config.js`, a missing
    value is a loud warning — never a failed command — except for a
    production build, which fails (Rule 26; `references/safety.md` §7).
11. **Never fire events inside loops.**
12. **No PII in event properties** — the skill leaves personal data out of
    events and states that in the approval message (the user attribute,
    Rule 8, is where it belongs). Very sensitive data is never sent. If
    the client asks for ordinary contact data in an event property,
    implement it their way and record a Known Risk (see Rules —
    Definition in `references/rules.md`) — not silently.
13. **Recommend against PII in Screen Data** — propose either a
    non-PII alternative (a plan tier instead of an email, a price band
    instead of an exact amount) or moving genuinely person-level data
    to a User Attribute instead (Rule 8), if that's really what's being
    described rather than screen context. If the client insists on
    keeping PII in Screen Data after that recommendation, implement it
    their way; record it as a Known Risk — stating the actual
    consequence: this data propagates into every event fired from that
    screen, not just remaining local to the screen itself.
14. **No event-on-page-load** unless explicitly measuring a page view
    as a deliberate metric. WebEngage events represent user actions,
    not navigation. Screen tracking is a separate mechanism — see
    `references/channels/screen-tracking.md`.
15. **Certain advanced/opt-in features are never proposed proactively —
    implement them only if the client explicitly asks.** This is a
    distinct third category from Hard Rules and Rules: not a deviation
    to log, just a standing default the client can override at any
    time. Specifically:
    - **SDK Authentication / JWT-secured login** (default is plain
      `webengage.user.login(userId)`, no token — once the client asks,
      two complementary calls are both needed: `login(userId,
      jwtToken)` for initial auth, and `user.setSecureToken(userId,
      secureToken)` wired into `tokenInvalidatedCallback` for refresh —
      see `references/user.md`).
    - **Multi-app license support** (`WEGAlternateAppSupport` — an
      iOS-only `Info.plist` Boolean; on Expo set it as
      `"WEGAlternateAppSupport": true` inside the plugin's `ios` block,
      only when the client confirms they run multiple apps under one
      WebEngage License Code).
    - **Universal Link handling** (default is off — no
      `universalLink.onClick` wiring; see `references/channels/push.md`).
    - **`webengage-expo-push` advanced options** — `useSPM`, custom
      `iosNSEFilePath`/`iosCEFilePath`, `iosNSEExistingTarget`,
      `disableNSE`, custom target names (a custom `appGroupName` is not
      supported — see `references/channels/push.md` Hard Rule 13). Never
      proposed proactively; each is reached only through the specific
      situation described in `references/channels/push.md`.
16. **The Android push transport is chosen by detection, not by a
    fixed default.** Pre-Flight finds which push library the app
    already uses, and the skill follows it:
    - `@react-native-firebase/messaging` present → use the Firebase
      path.
    - `expo-notifications` present → use the `expo-notifications` path.
    - Both present → ask which one currently receives push; never
      guess.
    - Neither present → tell the client plainly that WebEngage's
      Android push on Expo needs a JavaScript push library to receive
      and forward messages, recommend `expo-notifications` together
      with `expo-task-manager` (the background handler requires it),
      and **ask permission before installing** (Rule 21). Do not
      install a push library silently, and do not install Firebase
      messaging on the client's behalf unless they ask for it.
    Android push is never "native-only" on Expo — there is no
    hand-written `FirebaseMessagingService` path in this skill (Rule
    above: no manual native edits). A client who already has their own
    first-party `FirebaseMessagingService` is outside this skill: that is
    native source, which plugin config cannot express and this skill never
    edits. Say so plainly and point to `support@webengage.com`.
17. **Rich Push on iOS defaults to on, and on Expo it is fully
    automatic** — `webengage-expo-push` creates both extension targets,
    their entitlements, the shared App Group, and the dependency
    entries during prebuild. There is no Xcode "New Target" step for
    the client. The only things outside the code are Apple Developer
    portal/credential items (extension bundle IDs and App Groups
    registered for local signing — EAS Build can manage these itself)
    and the APNs key upload on the WebEngage dashboard. State the
    default; let the client opt out (`disableNSE`).
18. **WebEngage's own React Native callbacks never take a return
    value** — `push.onClick`, `notification.onPrepare/onShown/onClick/
    onDismiss`, and `universalLink.onClick` are plain fire-and-forget
    listeners. Never invent or imply an SDK-handles-vs-app-handles
    boolean convention for them the way the native Android/iOS SDKs
    have — the app fully owns navigation on every click.
19. **Register every WebEngage callback as early as possible, ideally
    in the app's root component's mount effect.** On v2.0.0+, buffering
    behavior differs by callback — don't generalize one pattern to all
    of them:
    - Push clicks, universal-link clicks, and every in-app notification
      callback (`onPrepare`/`onShown`/`onClick`/`onDismiss`): the JS
      bridge buffers the **first** 50 events received before a listener
      registers, flushed on registration. **This is a FIFO cap, not a
      sliding window of the most recent 50** — a 51st pre-registration
      event is silently dropped.
    - `user.onAnonymousIdChanged`: no queue — caches only the single
      *last* value, replayed once on registration.
    - `user.tokenInvalidatedCallback`: no buffer at all — if
      `tokenInvalidated` fires before it's registered, the event is
      lost outright.

    On installs below v2.0.0 (see Rule 2), none of this queuing exists.

    **Each `new WebEngage()` instance maintains its own private queue,
    but the native side is a process-wide singleton that broadcasts each
    event to every currently-attached JS listener.** The most common
    real-world cause of "push click not working" on a cold launch via
    push is a **second, separate `new WebEngage()`** somewhere in the
    app, constructed and subscribed *after* the one-time native
    pre-launch buffer already flushed to the original shared instance —
    check for a second instance before assuming registration timing
    (see `references/channels/push.md`'s troubleshooting section).

    **Expo-specific, sanctioned exception:** the Android background
    push task (`TaskManager.defineTask`, see `references/channels/
    push.md`) may run in a separate headless JS context with no access to
    the module-scope `WebEngageManager` instance, so it constructs its
    own guarded instance with `createGuardedWebEngage()` (exported by the
    wrapper file) *inside the task body only*. This is the one place a
    second SDK instance is correct, not a violation — but it must only
    call `push.onMessageReceived`, and must never register listeners
    (`.onClick` etc.).
20. **A Pre-Flight finding is a snapshot at the moment it was taken, not
    a live subscription — never re-assert one without re-reading the
    actual file at the point of the check.** File state can change at
    any time from the client's own out-of-band edits (in their IDE,
    terminal, CI, etc.), which nothing in this skill observes except by
    re-reading. Before repeating a prior finding ("you still haven't
    done X"), re-check the specific file right then — don't rely on what
    an earlier message in this same conversation found. "Full deep scan,
    every session" describes when the *broad* scan runs, not a license
    to trust cached state between scans.
21. **Installing `react-native-webengage` and `webengage-expo` never
    needs a separate permission step** — they are the mandatory root
    packages (Rule 3), inherent to the Init Goal the client already
    agreed to pursue. `webengage-expo-push` is part of the Push Goal's
    iOS default (Rule 17) — state it plainly when Push begins; no
    separate ask. **Everything else always needs an explicit
    permission ask, every time, with no exception for a returning
    client who's asked before:**
    - `react-native-we-personalization` — In-Line Content.
    - `react-native-webengage-inbox` — Notification Inbox.
    - `expo-notifications` **and** `expo-task-manager` — Android push
      (Rule 16), asked for together, since the background handler
      needs both. State what each is for: `expo-notifications`
      receives the FCM message and exposes the device token;
      `expo-task-manager` runs the background handler so pushes
      received while the app is in the background or killed still
      reach WebEngage.
    - `expo-build-properties` — only if a Goal genuinely needs a native
      build property no WebEngage plugin sets (see
      `references/channels/inline.md`).
    - `@react-native-firebase/*` — never offered; used only when the
      client already has it or explicitly asks.

    When asking, state plainly what each package is for, so the client
    is deciding with full context, not just approving a package name.
    In "use your defaults" mode (Rule 28) every non-root install is still its
    own ask; the two root packages need no separate ask and are covered by
    the one approval.
22. **This skill integrates WebEngage; it does not operate the client's
    devices, accounts, or toolchain.** It never runs `npx expo prebuild
    --clean`, `npx expo run:ios|android`, `eas build`, or any other
    build; never launches, installs, or uninstalls an app; never starts
    Metro, an emulator, or a simulator; never runs `adb` or `xcrun
    simctl` or reads a device's logs; never inspects the client's
    toolchain, disk, or devices; never performs a project upgrade; and
    never changes the client's git state (no `git rm --cached`, no
    commits — it gives the command instead). Read-only reads — `git
    grep|status|ls-files|check-ignore|log|diff`, `npm view` — are not
    command steps. Running and testing the app
    is the client's job.

    **Up to three command steps are the exception.** They are run only after
    the developer says yes — one approval that also covers the change
    list, and leads with the risks (Rule 24):
    1. `npx expo config --type prebuild > /dev/null` — read-only validation
       of the resolved config; the output is discarded because it contains
       the license code, and only the exit code and errors are read.
    2. `npx expo prebuild --no-install` (with `--platform` matching the
       platforms chosen in Init) — applies the plugin to `ios/` and
       `android/`. Never `--clean`.
    3. `cd ios && pod install` — iOS and macOS only, and only when it is
       needed to confirm the iOS integration (the `Podfile.lock` check).
       Offered inside the same approval; skipped when iOS isn't integrated
       or the machine isn't macOS.

    **Ask once, as a listed plan, in the same message as Init's change list**
    (Rule 5). It lists each step with what it does,
    its impact on the client's code, a recommendation, and its ⚠️ risks
    first. One yes approves the change list and the plan together — a
    risk that belongs to this client's project (tracked native files that
    will be modified, for example) is named in the same
    message, so the yes covers it. Anything not in the approved plan needs
    a fresh ask. Package installs other than the two root packages keep
    their own ask (Rule 21). Templates, preconditions and post-checks: `references/init.md`
    → Apply the Plugin.

    **After integrating, it tells the client what to run next and what to
    look for** (`references/init.md` → Build and Run — the Client's
    Steps, Verify Integration) and records what the client reports back. If the
    client asks the skill to build or run anything beyond the approved
    steps, say plainly that this skill doesn't, and give the command.
23. **Ask Integration Depth (Quick vs. Full) exactly once — then never
    again unless the client asks to change it.** For an open-ended
    request ("integrate WebEngage", no scope words) ask right after
    Pre-Flight, before Init, together with the goals and platforms
    questions; only
    explicit Init-only wording ("just init", "just add the SDK") defers
    it to the first scope-bearing Goal. Tracking User, Tracking Events, and each
    Engagement Channel *read* the recorded depth from
    `.webengage/agent.md`; none of them asks its own Quick/Full
    question. Init, Screen Tracking, Pre-Flight, and Audit are unscoped.
    The client's own words ("quick setup", "full integration") already
    answer it — record them, don't ask. A new session never re-asks:
    Pre-Flight reads the recorded depth. Full procedure, the Quick/Full
    table, and how a change is handled: `references/depth.md`.
24. **Every ask is short, plain, and comes with a recommendation.** This
    covers every ask for permission or a choice — the change list (Rule 5),
    package installs (Rule 21), the command steps (Rule 22), the Init
    questions, any yes/no. One or two sentences per question, the
    recommended answer first (or stated as the default), a few words on what
    it changes in the client's own files — or that it only adds new files —
    and a ⚠️ line **only** for a real risk (lost data, a secret in git,
    something that would fail silently, a cost), placed right on the
    question it affects. No labelled "What / Impact / Recommended" blocks,
    no tables of definitions, and no more than three questions in a
    message. What you can safely decide, you state — you don't ask. Example:

    > Android push needs two small libraries, `expo-notifications` and
    > `expo-task-manager` — they receive the push and hand it to WebEngage.
    > I'll add them to `package.json` (no source files change). OK?

25. **Do no harm: additive, repeatable, and in a safe order.** Every edit
    only adds WebEngage's own pieces and is safe to repeat — look at what
    is already there before writing, and a re-run that finds everything in
    place changes nothing. Within a Goal the order is **install → config →
    code**, applied as one approved change list, so no step — and no
    stopping point — leaves the project unable to install, build, or run.
    The checks per artifact: `references/safety.md`.
26. **The wrapper never throws into app code.** Every SDK call and every
    handler passed to the SDK runs inside a `try`/`catch`; the wrapper is a
    silent no-op on web and in Expo Go; failures are logged in development
    builds only, and never with user data. The license guard in
    `app.config.js` follows the same idea: a missing key warns, and only a
    production build fails. Contract and code: `references/wrapper.md`,
    `references/init.md` → Analytics Wrapper.
27. **Every Goal stands alone, can be undone, and meets a dirty working
    tree with a heads-up.** Stopping after any Goal leaves a working app; no
    Goal depends on a later one or on a sibling. The undo list for each
    Goal goes into the client's progress note. Uncommitted changes in the
    client's repository earn one line in the first message — never a stash,
    a commit, or a refusal. `references/safety.md`.
28. **"Use your defaults" mode changes how much is asked, never what is
    allowed.** When the client says so ("use your defaults", "do all
    recommended"): decide and report what is detectable or recommended; take
    the change list and the attribute/event lists as one batched yes; and
    still ask individually for non-root package installs, removing or
    overwriting anything, a license code or data center that isn't in the
    project, and which push library when two are present. `references/defaults-mode.md`.
29. **Two notes files, written silently, never with secrets.** After every
    Goal and on request, refresh `webengage-progress.md` (plain language:
    done, waiting on you, how to check, how to undo, what's next) and
    `webengage-support-summary.md` (technical, for the WebEngage team: app
    identity, versions, data center, Quick/Full per Goal, files changed with
    `file:line`, items pending at the client, recorded risks and refusals,
    anything unverified). Neither ever contains the license code,
    credentials, tokens, or end-user data. `references/progress-reports.md`.
