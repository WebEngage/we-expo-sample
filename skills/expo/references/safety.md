# Do No Harm — Order, Re-Runs, Self-Contained Goals, Undo

Load this before the first write to a client's project, and again when a
client asks "what did you change?" or "how do I undo this?". It backs Core
Rules 25–27.

The standard: **at no point — after any single step, or if the session simply
ends — is the client's project unable to install, build, or run because of
something this skill did.**

## 1. The order of every change: install → config → code

Each Goal is applied as **one approved change list**, in this order:

| Step | What | Why this position |
|---|---|---|
| 1. Install | Packages the Goal needs (Core Rule 21 decides which ones need an ask) | Config and code both refer to them — config that names a plugin path that isn't installed fails the next Expo command, and code that imports a missing package fails the bundler. |
| 2. Config | The Expo config: plugin entries, `app.config.js`, `.env.example`, `.gitignore` entries, build properties | The native side. On its own it does nothing until a native build, so it can't change how the app behaves today. |
| 3. Code | The wrapper and its call sites | JavaScript that calls WebEngage. The guarded wrapper (Core Rule 26) makes these calls harmless until the native build catches up, and harmless on web and in Expo Go. |
| 4. Apply (ask-first) | Up to three command steps (Core Rule 22) | Only after 1–3 are in place; in Init's one approval. |

If the session ends after any of the first three, the project still builds
and runs: unused packages are inert, config without a rebuild changes
nothing, and code without the native piece no-ops instead of crashing.
Never reorder (code before install, config before install), and never write
a *partial* Goal — show the whole change list for the Goal, get the yes, and
apply it in this order without stopping in between.

## 2. Additive and idempotent

Every edit only **adds** WebEngage's own pieces (Core Rule 7), and every edit
is safe to repeat: before each write, look at what is already there.

| Artifact | Before writing, check | If already there |
|---|---|---|
| Package in `package.json` | Is it listed (and at what range)? | Don't reinstall; if the range is below a floor (Core Rule 2), raise it on the change list. |
| Plugin entry in the Expo config | Is the WebEngage entry already present (any form)? | Leave it, unless it is wrong (a bare name, a missing `push`/`ios` block): then fix *that entry only*, shown first. Never add a second one. |
| `app.config.js` | Does it exist? Does it already read `WEBENGAGE_LICENSE_CODE`? | Extend its returned object; never restructure it; never duplicate the guard block. |
| `.env.example`, `.gitignore` | Is the line there? | Skip. Never rewrite either file. |
| Wrapper file | Does the file exist (Pre-Flight recorded its path)? | Extend it. Add a method only if it isn't there; never regenerate the file. |
| A wrapper call at a call site | Does that site already call the wrapper (or the SDK directly)? | Skip it; if the site calls the SDK directly, propose moving it onto the wrapper as its own change. |
| A `registerCallbacks()` block | Is this Goal's block present? | Skip; never touch another Goal's block. |
| Imports | Is the import already there? | Don't add it twice. |
| Android Install Referrer | Is the local plugin already there? | Skip it. |
| `.webengage/`, the two notes files | Do they exist? | Update in place; never append duplicates. |

**A re-run that finds everything in place changes nothing and says nothing.**
Re-running a Goal is how a client resumes, so it has to be safe.

**Keep diffs minimal.** Match the file's quote style, semicolons, and
indentation; never reformat, re-sort, or "tidy" lines that aren't WebEngage's.

## 3. Every Goal stands on its own

A Goal never leaves the project half-wired. Stopping after any Goal — or
never starting the next — leaves a working app:

| Goal | Leaves the project with | Needs |
|---|---|---|
| Init | WebEngage configured (plugin, license from env, wrapper, `init()` call). The app builds and runs; WebEngage starts at native launch after the next native build. | Nothing |
| Tracking User | `login()`/`logout()`/attributes calls on the wrapper. | Init (the wrapper) |
| Tracking Events | `trackEvent()` calls on the wrapper. | Init (the wrapper) |
| Push | Android: the push library's token/foreground/background hooks and the opt-in call — added together in one change; iOS: the `webengage-expo-push` plugin entry. | Init |
| In-App | Nothing to add at Quick; at Full, the callbacks block and screen tracking. | Init |
| In-Line Content | The feature package, the static-linkage build property, its helper file, the widget, screen tracking — added together. | Init |
| Notification Inbox | The feature package, its helper file, and its calls. | Init |

No Goal depends on a *later* Goal, and none depends on a sibling Goal having
run: each adds the wrapper methods it uses itself, whichever order the client
picks.

## 4. The wrapper never throws into app code

Core Rule 26. The guard, the no-op on web and Expo Go, and the
development-only logging are in `references/wrapper.md`.

## 5. A dirty working tree gets one heads-up

Pre-Flight reads `git status --porcelain` (read-only, private). If there are
uncommitted changes, say **one line** in the first message — a heads-up, not a
blocker, and never a stash or commit (Core Rule 22):

> You have uncommitted changes. I only add to your files, but committing or
> branching first makes everything I do easy to review and undo.

**One exception:** if the only uncommitted change is an untracked `.env`
(nothing else in `git status --porcelain`), skip this line — it would only
tell the client to commit a secret. Say the `.env`-not-git-ignored warning
instead, once.

If the project isn't a git repository, say instead that there is no git
history to fall back on, so undoing means following the undo list in
`webengage-progress.md` by hand. Don't repeat either line later.

## 6. The undo list, per Goal

Every Goal can be taken back. The client progress note
(`references/progress-reports.md`) prints the rows for the Goals that were
done, with the real file names filled in from `.webengage/agent.md`.

**Always true:** data already sent to WebEngage stays there — undoing the code
stops new data, and removing what was already collected is done in the
WebEngage dashboard or through `support@webengage.com`. If the project is in
git, `git diff` shows every change and `git restore -- <file>` undoes one
file (the skill never runs either; it gives the command).

| Goal | What it added | How to undo |
|---|---|---|
| **Init** | `react-native-webengage` and `webengage-expo` in `package.json` · the `webengage-expo` plugin entry in the Expo config · `app.config.js` (if the skill created it, or the lines it added to yours) · `.env.example`, and the license in `.env` · `.gitignore` entries · the wrapper file and its `init()` call and import in the root component/layout · Android Install Referrer: `plugins/withWebEngageAndroidExtras.js` with its plugin entry · after prebuild: changes inside `ios/` and `android/` | Remove the plugin entry (and the Android extras entry) from the Expo config; delete the wrapper file and its call and import; delete `app.config.js` if the skill created it, otherwise remove the lines it added; remove the `.env.example` lines and the `.env` value; run `npm uninstall react-native-webengage webengage-expo` (or the project's package manager). Native folders: on a project that generates them (`ios/`/`android/` ignored), nothing else — they are regenerated by the next prebuild; if they are committed, `git restore -- ios android` restores the committed versions ⚠️ it also discards uncommitted edits there. Rebuild the app afterwards. |
| **Tracking User** | Wrapper methods (`login`, `logout`, attribute setters) and their call sites | Delete those call sites and methods (every `file:line` is in `webengage-support-summary.md`). |
| **Tracking Events** | `trackEvent()` and its call sites | Delete those call sites and the method. |
| **Push — Android** | `expo-notifications` and `expo-task-manager` (if the skill installed them) · `webengageBackgroundTask` and `useWebEngageAndroidPush` files · the side-effect import at the app entry and the hook call in the root · the permission/opt-in function or the one `setDevicePushOptIn` line at the existing permission site | Delete the two files, the import, the hook call, and the opt-in line or function; `npm uninstall` the two packages only if nothing else in the app uses them. |
| **Push — iOS** | `webengage-expo-push` and its plugin entry · after prebuild: the notification extension targets in `ios/` | Remove the plugin entry; `npm uninstall webengage-expo-push`; regenerate or restore `ios/` as under Init. |
| **In-App** | The in-app callbacks block in `registerCallbacks()` (Full) · screen-tracking call sites and `trackScreen()` (Full) | Delete the block and those call sites. |
| **In-Line Content** | `react-native-we-personalization` · `expo-build-properties` and its static-linkage entry (if added for this) · the helper file `webengagePersonalization` · the widget/callback code · screen tracking | Remove the widget code and the build-property entry; delete the helper file; `npm uninstall` the package(s); rebuild. |
| **Notification Inbox** | `react-native-webengage-inbox` · the helper file `webengageInbox` and its calls | Delete the calls and the helper file; `npm uninstall` the package. |
| **Notes files** | `.webengage/`, `webengage-progress.md`, `webengage-support-summary.md`, `audit-webengage-report.md` | Delete them. They contain no secrets and nothing else depends on them. |

## 7. The license guard: a warning, not a failure

`app.config.js` reads `WEBENGAGE_LICENSE_CODE`. **A missing value is a loud
warning, never a failed command** — except for a production build.

Why: a throw also breaks a teammate's checkout, a CI job, `expo doctor`, and
(observed) an already-running dev server that was started before the variable
existed — the standard says no step may leave the project unable to build or
run. The cost of a warning is that a *development* build without the key
builds and runs without WebEngage; the config prints the fix, and Live Users
stays empty. A *production* build is different: shipping without the key
sends nothing and nobody notices, so that one case fails, with the fix
spelled out. (This replaces an earlier version that threw for `prebuild`,
`run:ios`, and `run:android`.)
