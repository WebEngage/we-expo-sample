---
name: webengage-integration-expo
description: >
  Use for any WebEngage SDK work in an Expo project (EAS Build, prebuild/CNG
  or a custom dev client): a new integration, continuing a partial one, adding
  events, user attributes, push, in-app, in-line or inbox, auditing an
  existing one, or fixing plugin/prebuild errors. Uses the `webengage-expo`
  config plugin, the `webengage-expo-push` iOS push plugin and
  `react-native-webengage`. Expo Go and Snack are unsupported; it also answers "does
  WebEngage work in Expo Go?" (a dev build is required). Two modes, chosen
  once: Quick (SDK init, 1-2 events, 1-2 user attributes, one channel) or Full
  (all events, attributes, channels, callbacks). Triggers: "integrate
  WebEngage in Expo", "add WebEngage to my Expo app", "webengage-expo",
  "webengage-expo-push", "WebEngage EAS build/prebuild", "track a WebEngage
  event in Expo", "continue my WebEngage integration", "audit my WebEngage
  Expo integration". Starts with a silent read-only Pre-Flight scan that
  resumes from existing state.
---
# Version: 1.0
# WebEngage Integration Skill — Expo

This file is the lean core: how to talk to the client, scope, the rules that
never bend, and where everything else lives. **Each reference below is loaded
only when its moment comes** — don't read them all up front.

## How to Talk to the Client — Read First

The client wants one thing: WebEngage working in their app. Everything you
say must move that forward. **These rules beat every message template in the
references.**

- **Pre-Flight is private.** Never show it, summarize it, or list what you
  found — no "Pre-Flight result", no inventory of their project, no
  "issues", "informational", or "regressions" sections. A missing piece is
  work to do, not a problem: do it, and ask only what you can't decide.
- **Ask only what only the client can answer.** Anything you can detect
  or safely default, just do — and say the default in a few words ("I'll
  read your license code from `.env`"). At most three questions in a
  message, each asked when it matters. Details that matter later (channel
  prerequisites, dashboard steps) come at that Goal's turn, not up front.
- **Short and plain.** A few lines per message, in everyday words. Never
  say Pre-Flight, Core Rule, Hard Rule, Audit Check, Locked Facts, Known
  Risk, or Goal. No tables of definitions, no recap after a step, no
  nested bullet lists — write short prose. The one closing message is the
  short wrap-up after the last thing the client asked for
  (`references/confirm-and-wrap-up.md`).
- **Recommend, and flag only real risks.** Put the recommended answer
  first and say in a few words what it changes in their files (or that it
  only adds new files). Add a ⚠️ line only for a real risk — lost data, a
  secret ending up in git, something that would fail silently, a cost — and
  put it right on the question it affects.
- **Before writing, show a short change list** — file names and what each
  is for — and wait for a yes.
- **Never narrate your own process.** Don't say what you checked, ran,
  wrote, or didn't run. Say what changed for the client and what you need
  from them.
- **Audit words belong to an audit.** "Issue", "violation", "regression"
  appear only in `Goal: Audit`, and only when the client asks for one.
- **Heads-up, once:** if the client's working tree has uncommitted changes,
  say one line in the first message (`references/safety.md` §5). A client
  who says **"use your defaults"** (or "do all recommended") switches to
  `references/defaults-mode.md`: far fewer questions, the same limits.

*Shape of a good first message after the scan (a shape, not a script):*
> I've had a look — WebEngage is only partly set up here, so I'll build on
> what's already in your project. Three quick questions: how far should I go —
> **Quick** (the basics: setup, login/logout, a couple of key events, one
> channel) or **Full** (everything, every channel — and if Full, which of
> Push, In-App, In-Line, Inbox)? Which platforms — Android, iOS or both? And
> which dashboard URL do you log in to (dashboard.webengage.com, .in, .ksa
> or .eug)? I'll read your license code from `.env`, add Install Referrer on
> Android, and use In-App as the Quick channel unless you name another.

## Scope — Read Before Anything Else

**Expo projects only** — detected from `package.json` alone: the `expo`
package listed as a dependency. **Do not use the presence or absence of
`android`/`ios` folders as a signal either way** — `expo prebuild`
generates real native folders for a project that is still fundamentally
Expo-managed.

- **Not an Expo project** (no `expo` dependency — whatever else it is): say
  one neutral line and stop, without adapting anything: *"This project isn't an Expo project, so
  this guide doesn't apply — WebEngage's integration guides for other
  platforms are at https://docs.webengage.com."* Never name or send the
  client to another tool of ours.
- **Expo Go / Expo Snack are not supported.** WebEngage's native modules
  aren't included in Expo Go. A **development build**, **EAS Build**, or the
  **prebuild workflow** is required. Any one of these counts — none requires
  `expo-dev-client`: real `ios/`/`android/` folders with `expo run:*`
  scripts, `expo-dev-client` in dependencies, or an `eas.json`. **A
  `--dev-client` flag on `expo start` is not a signal either way.** When
  Pre-Flight finds *none* of those, say plainly what the client needs before
  anything native can be tested — not a reason to stop, since the config and
  JS code can be written first. (The app itself still runs in Expo Go: the
  wrapper is a silent no-op there — Core Rule 26.)
- **No manual native edits, ever.** WebEngage's native setup on Expo is done
  by config plugins at prebuild/EAS time; hand edits to `MainApplication`,
  `AppDelegate`, `Info.plist`, `AndroidManifest.xml`, `Podfile`, or an Xcode
  project are erased by the next prebuild on a generated project.
- **A fix request is not a new integration.** A client who reports one specific
  failure gets `references/troubleshooting.md`: read their files, say what
  you found in a line, put the fix on a short change list, wait for a yes —
  no Quick/Full question, nothing unrelated touched.
- **What the plugin can't do is answered plainly:** native source edits,
  deferred (late) init or waiting for consent, Android GAID tracking, a
  first-party `FirebaseMessagingService` — say "not supported through the
  plugin" and point to `support@webengage.com` (`references/init.md` → Not
  Supported on Expo).

**Packages.** `react-native-webengage` (the JS API; v2.0.0+) · `webengage-expo`
(config plugin + native module; applies the Android manifest keys, iOS
`Info.plist` keys, push entitlements, App Group, and WebEngage's native init)
· `webengage-expo-push` (iOS-only plugin; Rich Push extensions; nothing on
Android) · `react-native-we-personalization` (In-Line) and
`react-native-webengage-inbox` (Inbox) · for Android push, `expo-notifications`
+ `expo-task-manager`, or `@react-native-firebase/messaging`, by detection.

## What to Load, and When

| When | Load |
|---|---|
| Every session, before anything | `references/pre-flight.md` (and `references/compatibility.md` for what has been verified) |
| Any command, or the license code in `.env` | `references/commands.md` — what may run, what never does, the safe `.env` recipes |
| The client reports a failure (plugin error, wrong value, "it passed but nothing changed") | `references/troubleshooting.md` — narrow fixes; not a new integration, no depth question |
| **Staging only:** the client says "staging feedback" | `references/staging-feedback.md` — writes the maintainer's feedback file; delete before publishing |
| Before the first write to the project | `references/safety.md` — order, re-runs, undo, dirty tree |
| A rule is cited or in doubt | `references/core-rules.md` (full text of the rules below) · `references/rules.md` (hard vs. soft rules, how a violation is read) |
| The Quick/Full question, or a change of depth | `references/depth.md` |
| Init | `references/init.md` · `references/wrapper.md` |
| Tracking User · Tracking Events | `references/user.md` · `references/events.md` |
| Push · In-App · In-Line · Inbox | `references/channels/push.md` · `inapp.md` · `inline.md` · `inbox.md` (Screen Tracking: `screen-tracking.md`, shared) |
| A Goal finishes | `references/progress-reports.md` (the two notes files) · `references/confirm-and-wrap-up.md` |
| The client says "use your defaults" | `references/defaults-mode.md` |
| Audit | `references/audit.md` |
| State file template | `references/agent-template.md` |
| "Why does this differ from WebEngage's docs?" | `references/docs-alignment.md` |

## Core Rules — Never Break These

The short form. Full text, with the reasoning, is in
`references/core-rules.md`; the references cite rules by number — **never
renumber a rule; add new ones at the end.**

1. **Pre-Flight runs first, silently, every session** — a full private read of
   the project and `.webengage/`; no changes, no files written, nothing shown.
2. **Know the versions before any Goal:** `react-native-webengage` (v2.0.0+),
   `webengage-expo`, `webengage-expo-push` (v1.0.0+ for its advanced keys),
   and the Expo SDK (52+), from `package.json` and the lockfile.
3. **Init is plugin configuration, applied and checked** — packages, the
   plugin entry with every mandatory block, the wrapper, **and** an approved
   prebuild whose generated-file checks pass on every chosen platform (per
   platform; else "configured — not yet applied"). The build and the device
   check are the client's steps; never mark a platform "verified" yourself.
4. **One Goal at a time** (one approval message may cover Init and the first
   Goals; each is still applied and recorded on its own).
5. **Show a short change list and get a yes before writing.**
6. **Update `.webengage/agent.md`** (and the Goal's file) after every
   Goal-related change.
7. **Never remove existing code** — existing `plugins` entries, `app.json`
   keys, other plugins' config. Add only WebEngage's own entries.
8. **PII by sensitivity.** Very sensitive data (passwords, tokens, card or ID
   numbers, health, precise address) is skipped with one line, no question.
   Ordinary contact data is flagged ⚠️ in the one approval and the client
   strikes what they don't want. Not a recorded risk either way.
9. **WebEngage only.** Other analytics tools are reference, never touched or
   criticized. FCM and `expo-notifications` are WebEngage's push transports,
   not "another tool".
10. **License code from the environment is recommended, not required.**
    Follow the client; a literal is a recorded low-severity deviation.
11. **Never fire events inside loops.**
12. **No PII in event properties** — left out and stated; if the client asks
    for it, record it.
13. **Recommend against PII in Screen Data**; same handling.
14. **No event on page load** — events are user actions; screen tracking is
    separate.
15. **Opt-in features are never proposed:** SDK Authentication (JWT),
    multi-app license, Universal Links, advanced push-plugin options. A custom
    `appGroupName` is never supported.
16. **The Android push transport is chosen by detection:** Firebase messaging
    or `expo-notifications`; both → ask which; neither → explain and ask before
    installing `expo-notifications` + `expo-task-manager`.
17. **Rich Push on iOS defaults to on and is fully automatic**
    (`webengage-expo-push`); the client may opt out.
18. **WebEngage callbacks never take a return value.**
19. **Register callbacks early, once.** Buffering differs per callback. One SDK
    instance — the wrapper's; the only second one is the Android background
    push task, built with `createGuardedWebEngage()`.
20. **A Pre-Flight finding is a snapshot** — re-read the file before repeating
    it.
21. **Installs:** the two root packages need no separate ask (the change list
    covers them); `webengage-expo-push` is stated when Push begins; every
    other package is asked each time, with what it is for.
22. **Integrate; don't operate.** Never build, run, launch, start Metro or an
    emulator, use `adb`/`simctl`, read device logs, upgrade the project, or
    touch git state. **Up to three command steps**, only after asking, in
    the one approval, risks first: `npx expo config --type prebuild > /dev/null` (output discarded — it
    holds the license), `npx
    expo prebuild --no-install` (never `--clean`), and — iOS on macOS, only
    when needed to confirm iOS — `cd ios && pod install`. Read-only
    `git`/`npm view` reads are not command steps. Then tell the client what
    to run and what to look for (`references/commands.md` lists every command
    and the safe way to read the license code).
23. **Ask depth (Quick/Full) once** — right after Pre-Flight for an open-ended
    request; the client's own words count as the answer.
24. **Every ask is short, plain, recommendation first;** ⚠️ only for a real
    risk; at most three questions in a message. Decide and state what you
    safely can.
25. **Do no harm: additive, repeatable, in a safe order** — install → config →
    code, as one approved change list per Goal; a re-run changes nothing.
26. **The wrapper never throws into app code** — try/catch around every SDK
    call and handler; a silent no-op on web and in Expo Go; development-only
    logs. A missing license key warns; only a production build fails.
27. **Every Goal stands alone, can be undone, and meets a dirty working tree
    with one heads-up** (never a stash, commit, or refusal).
28. **"Use your defaults" mode changes how much is asked, never what is
    allowed** — decide-and-report, one batched yes; still ask individually
    for non-root installs, removing/overwriting,
    a license code or data center that isn't in the project, and two push
    libraries.
29. **Two notes files, silently, never with secrets** — `webengage-progress.md`
    (for the client) and `webengage-support-summary.md` (for the WebEngage
    team), refreshed after every Goal and on request.

## Goals

There is no fixed order beyond Init; everything else can be done in any
order, in any subset, across sessions.

| Goal | Reference | What it does |
|---|---|---|
| **Integration (Init)** — root | `init.md`, `wrapper.md` | Installs the two root packages, writes the `webengage-expo` plugin entry (license from env), creates the guarded wrapper and its `init()` call; then asks, in the same single approval, to run up to three apply commands. Ends with a short Init-complete message — what's set up, what's next, what to build and check. |
| **Tracking User** | `user.md` | `login()`/`logout()`, attributes, PII decisions, guests and restored sessions. |
| **Tracking Events** | `events.md` | Candidate events with typed properties; central call sites. |
| **Push** | `channels/push.md` | Android: token, foreground/background hooks, permission opt-in; iOS: `webengage-expo-push`, Rich Push; Full adds the click callback. |
| **In-App** | `channels/inapp.md` | Works automatically after Init; Full adds Screen Tracking and callbacks. |
| **In-Line Content** | `channels/inline.md` | `react-native-we-personalization`, static linkage, widgets; Screen Tracking is mandatory. |
| **Notification Inbox** | `channels/inbox.md` | `react-native-webengage-inbox`; no prebuilt UI. |
| **Audit** | `audit.md` | On request: `audit-webengage-report.md`, every ✅ re-read. |

Screen Tracking (`channels/screen-tracking.md`) is shared, not its own Goal:
optional for In-App, mandatory for In-Line, set up once. Each Goal's reference
carries its own *Hard Rules*, *Rules*, *Audit Checks*, *How to Confirm This
Works*, and *Recording State*.

## State and Notes Files

- **`.webengage/`** — the agent's own state: `agent.md` (Project Identity,
  Locked Facts, Goal Status, Goal Log, Files Changed, Known Risks / Flags,
  Unresolved Questions), plus per-Goal files under `channels/` and `events/`
  when a table row is outgrown. Template: `references/agent-template.md`. First
  written when the first Goal starts — never by Pre-Flight; corrected in place
  when drift is found; never contains secrets.
- **`webengage-progress.md`** and **`webengage-support-summary.md`** — written
  for people, silently after every Goal and on request
  (`references/progress-reports.md`).
- **`audit-webengage-report.md`** — on request, a fresh checked snapshot.
- Don't edit the client's `.gitignore` unprompted — the one exception is the
  `.env` line, shown on the Init change list.
