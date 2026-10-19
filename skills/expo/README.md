# Using the WebEngage Expo Integration Skill

This skill adds WebEngage to your Expo app through your AI coding agent.
It scans your project first, then works through initialization, user
identity, event tracking, and engagement channels (Push, In-App, In-Line,
Notification Inbox) in a guided conversation — resumable across sessions,
and safe to run again later to extend or audit what's already there.

> **Status: beta.** Initialization has been verified on Android (Expo SDK
> 55 and 57). On iOS (Expo SDK 55) the app built and ran, and a physical
> iPhone's log showed WebEngage starting; dashboard confirmation wasn't
> recorded. Login, attributes and events have been run on one test app; the
> other goals follow WebEngage's documented plugin behavior but have not been
> run end to end on Expo yet, and the safety features below are designed but
> not yet run on a device. `references/compatibility.md` lists, feature by
> feature, what has been verified and what hasn't. The skill tells you so
> before it starts any part that hasn't been verified.

## What You'll Need

* A WebEngage account with dashboard access (to retrieve your license code
  and, later, to upload push credentials)
* An Expo project with `expo` in `package.json` — Expo SDK 52 or newer
  (older projects need an upgrade first; the skill recommends it but does
  not do it)
* A way to build native code: a development build, EAS Build, or the
  prebuild workflow. **Expo Go can't run WebEngage** — its native modules
  aren't included. Your app still runs in Expo Go; WebEngage just does
  nothing there
* A machine that can build your app (Xcode and CocoaPods for iOS; the
  Android toolchain for Android) — the skill does not check or install
  these
* An AI coding agent with access to your project files
* A branch or a clean working tree, so you can review everything the skill
  changes before you commit — the skill mentions it if you have uncommitted
  changes, but never stops you

## How to Run It

1. **Get your WebEngage license code.** WebEngage dashboard → Account
   Settings → Integration. Copy it exactly, including a leading `~` if
   present.
2. **Open your coding agent** with your Expo project loaded and prompt it
   with:
   > Integrate WebEngage in my Expo app using `<link to this skill's SKILL.md>`
3. **Answer the few things it can't work out from your code** — how deep to
   go, which platforms, your data center, your license code if it isn't already in the
   project. It asks at most three questions at a time, each with a
   recommended answer, and shows a short change list for your yes before it
   writes anything; nothing is added silently.

**Want fewer questions?** Say **"use your defaults"** (or "do all
recommended"). The skill then decides what it can detect or recommends —
platforms, license from `.env`, Quick depth, In-App as the first channel —
tells you afterwards what it chose, and asks for **one yes** covering the
change list and the attribute and event lists. It still asks you separately
about: every other package install, removing or overwriting anything,
and your license code if it isn't in the project. Say "ask me" to switch
back.

## How the Skill Works

1. **A silent scan first.** It reads your project — Expo SDK, config files,
   native folders, navigation, existing push setup, any existing WebEngage
   code — but doesn't report it back or write anything. It only uses what it
   finds to ask you fewer questions and to skip what's already done.
2. **One depth question.** For a plain "integrate WebEngage" it asks right
   away, together with which channels you want, whether you want **Quick**
   or **Full** — once; it doesn't ask again unless you ask to change it:
   * **Quick** — SDK init, login/logout plus one or two attributes, one or
     two events, and basic setup for **one** engagement channel.
   * **Full** — every applicable attribute and event, and every channel
     you want, each with its callbacks.
3. **Init always comes first.** Past that, you choose what to work on, in
   any order, across as many sessions as you need:

| Goal | What it covers |
|---|---|
| **Integration (Init)** | Packages, the `webengage-expo` plugin configuration, license code, data center, debug mode, the analytics wrapper. |
| **Tracking User** | Login/logout identity calls and user attributes. |
| **Tracking Events** | Custom events for the actions that matter to your product. |
| **Engagement Channels** | Push, In-App, In-Line Content, Notification Inbox — pick any subset. |

The skill remembers what's done in a `.webengage/` folder in your repo and
re-scans your actual code every session instead of trusting that record,
so it also catches anything that broke since the last visit.

### Short questions, real risks only

Each question is a few plain lines: the recommended answer first, what it
would change in **your** files (or that it only adds new ones), and a ⚠️ only
where something could genuinely go wrong — lost data, a secret ending up in
git, something that would fail silently, a cost. Where it can decide a
sensible default (debug mode, package versions, the Quick channel), it says so
instead of asking. Platforms it asks.

### Built not to break your app

* **Only adds, never rewrites.** Every edit adds WebEngage's own pieces and
  checks what's already there first, so running the skill again changes
  nothing that's already in place.
* **A safe order.** For each part it installs packages, then writes config,
  then writes code — so no step, and no stopping point, leaves your project
  unable to build or run. Every part stands alone: stop after any of them and
  you have a working app.
* **WebEngage can't throw into your code.** All WebEngage calls go through
  one small file that catches errors (shown in development builds only, never
  with user data) and does nothing on web and in Expo Go.
* **A missing license key warns, it doesn't stop you.** Only a *production*
  build without the key fails, because shipping without it would silently
  send nothing.
* **Every part can be undone.** `webengage-progress.md` lists, per part,
  exactly what was added and how to remove it.

### The commands it can run — only if you say yes

The skill lists these in its first approval message, together with the
files it will add — one yes covers both. Risks that belong to your project (for example native folders tracked
in git, which prebuild would modify) are approved by name.

| Step | Command | What it does |
|---|---|---|
| 1 | `npx expo config --type prebuild` (output discarded) | Read-only check that the resolved config and plugin entry are valid. Its output contains your license code — the skill won't copy it anywhere. |
| 2 | `npx expo prebuild --no-install` | Applies the plugin to `ios/` and `android/`, so the skill can check the generated files — also for EAS projects (EAS prebuilds again in the cloud; git-ignored folders are not pushed). Never `--clean`. |
| 3 | `cd ios && pod install` | iOS on macOS only, and only when needed to confirm the iOS integration. |

Anything else — building, running, launching an emulator — is yours; the skill tells you the exact command.

### What the skill does

* **Scans your project every session** before asking anything.
* **Picks up where you left off** — anything an earlier session did that is
  missing from the code now is simply put back, and WebEngage code that was
  already there is built on, not redone.
* **Never touches your other analytics tools.** MoEngage, GA4, Mixpanel and
  similar are read as reference only — never modified or removed.
* **Proposes before it writes.** Every event, attribute, package and config
  change is shown to you first.
* **Handles personal data by sensitivity.** Very sensitive data is skipped; email, name or phone are flagged in the one approval for you to strike.
* **Keeps the license code out of your repo by default** — it reads it from
  environment config (`.env` locally, EAS variables in cloud builds) and
  warns if native folders tracked in git would end up holding it.
* **Adds Android Install Referrer by default**, so WebEngage can report app installs and first acquisition details.
* **Enforces the non-negotiables** — for example the plugin entry form and
  mandatory config blocks — and explains why rather than bending them.
* **Never commits.** Review `git diff` and commit yourself.
* **Keeps two notes files up to date, silently** — `webengage-progress.md`
  (plain language: what's done, what's waiting on you, how to check each
  piece, how to undo it, what's next) and `webengage-support-summary.md`
  (technical, for the WebEngage team if you contact support: app identity,
  versions, data center, Quick or Full per part, files changed, what's still
  pending on your side, recorded risks, and what hasn't been verified). Neither
  ever contains your license code, credentials, or any of your users' data.
* **Ends with one short wrap-up** once you've finished what you asked for:
  what now exists, what is still yours to run and check, where the notes
  files are, what was left out, and an offer to write the audit report.
* **Generates an audit report on request** — `audit-webengage-report.md`, a
  checked snapshot with every finding tied to a file and line.
  Ask: *"Audit my WebEngage Expo integration."*

### What this skill does not do

* **It doesn't build or run your app.** After Init it tells you what to
  run (`npx expo run:ios`, `npx expo run:android`, or `eas build`) and what
  to look for.
* **It doesn't run `prebuild --clean`**, launch devices, or start servers.
* **It doesn't edit native source by hand.** On Expo the plugins do the
  native setup at prebuild time; hand edits in generated folders are erased.
* **It doesn't upgrade your Expo SDK.** If your project is too old it says
  so and recommends upgrading first.
* **It doesn't create anything on the WebEngage dashboard** — push
  credential upload, In-Line placeholders, Inbox enablement, and campaigns
  happen there. The skill tells you what's needed and in what order.
* **Late (deferred) initialization, waiting for user consent before
  starting, Android GAID tracking, and a first-party
  `FirebaseMessagingService` are not supported through the plugin.** The
  plugin starts WebEngage at app launch. Contact support@webengage.com if
  you need one of these.
* **It's only for Expo projects** (`expo` in `package.json`). For any other
  project it says so in one line and points to WebEngage's documentation at
  https://docs.webengage.com.

### How it relates to WebEngage's published docs

WebEngage's Expo and Expo push guides are the source of truth for how the
plugins are configured. Where this skill does something differently — reading
your license from `.env` instead of writing it into the config, never running
`prebuild --clean`, one shared SDK instance, the Android Install Referrer plugin — it is
deliberate and explained in `references/docs-alignment.md`.

## After the Skill: Build, Run, Confirm

1. **Build and run** your app yourself.
2. **Confirm initialization**, with debug mode on:
   * **Android:** `adb logcat -d -s WebEngage`, and look for the line
     containing `Successfully Initialized`.
   * **iOS:** in the Xcode console, search for `WebEngage SDK Initialized`
     (also `WebEngage SDK initiated`). These lines were seen on a physical
     iPhone, not documented by WebEngage — so also open **WebEngage
     dashboard → Users → Live Users** and look for your session; Data
     Platform → Integrations should show the SDK setup as `success` within
     a few minutes.
3. **Confirm what you added.** Each goal ends with a *How to Confirm This
   Works* block — the exact steps for what was built, using your real event
   and attribute names. In short: sign in on a test device, trigger what you
   added, then check **Dashboard → Users**, search your test identifier,
   and open **Activity Info** (allow a few minutes). For Push, In-App,
   In-Line and Inbox, register your device as a test device and send a test
   campaign first. These steps describe documented behavior that isn't yet
   verified on Expo; tell the skill what you saw and it records the result.

## Troubleshooting

**The build says `WEBENGAGE_LICENSE_CODE is not set`?**
WebEngage won't start in that build. Set it in `.env` (or as an EAS
environment variable) and rebuild. The code is read when native code is
generated, not by the JavaScript bundle, so no dev-server restart is needed.
A *production* build without it fails on purpose.

**Prebuild fails with "…without any props"?**
The plugin entry must use the explicit path
`./node_modules/webengage-expo/src/withWebEngage.js` with a config object
that includes the `push` and `ios` blocks, even for an Android-only app.
Ask the skill to run `Goal: Audit WebEngage Integration` to find the entry.

**No `Successfully Initialized` line on Android?**
Config changes only take effect after a new native build. Check the license
code and data center, then rebuild.

**iOS builds fail on missing pods?**
If you declined the skill's `pod install` step, run
`cd ios && pod install`, then check `ios/Podfile.lock` lists
`react-native-webengage` (and that `WebEngage` is there as a pod or a Swift package).

**Events or attributes look wrong (name, type, missing)?**
Ask the skill to run `Goal: Audit WebEngage Integration`. It re-reads the
code, cross-checks it against what's recorded, and reports what's
implemented, what's missing, and what looks off.

**Want to take WebEngage back out?**
Open `webengage-progress.md` → *How to undo*: per part, the files, config
entries and packages it added, and how to remove each. Data already sent to
WebEngage stays there; removing it is done in the dashboard or through
support@webengage.com.
