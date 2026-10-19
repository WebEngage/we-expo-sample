# Test Plan — WebEngage Expo Skill (for maintainers)

> **STAGING ONLY.** This file, `REVIEW-FOR-CLAUDE.md`, `evals/` and
> `references/staging-feedback.md` live in the skill folder for local testing
> now. **Before publishing, move them out of the client-facing folder** (or
> delete them) and remove the "Staging only" row in `SKILL.md`'s load table.

This is **not** loaded by the skill and is not for clients. It is the list of
manual runs that moves features in `references/compatibility.md` from
*documented / designed, not run* to *verified*. **The skill itself never
builds or runs the app; every build and device check below is the tester's.**

**Status: staging.** The skill is edited and statically reviewed (including
paper dry-runs on 2026-10-19) but has not been run on a device. The plan is
run locally in the sample app. Order: (1) Quick pass → report → fixes;
(2) Full review of the skill; (3) Full pass → report → fixes.

## Local staging setup

1. **Edit the skill only in the source folder** — `integration/sdk/mobile/expo/` in
   this repo. The copy inside the sample app (`expo-data/we-expo-sample/skills/expo/`)
   is a **disposable mirror**: `rsync --delete` overwrites anything edited there. After
   any source edit, re-sync from the repo root (a copy command for you to run; the skill
   never does): `rsync -a --delete integration/sdk/mobile/expo/ expo-data/we-expo-sample/skills/expo/`.
   Confirm the mirror matches with `diff -rq integration/sdk/mobile/expo expo-data/we-expo-sample/skills/expo`
   (no output = in sync). It is in sync as of the last check; re-sync only after you edit the source.
2. **One pristine fixture, one clone per run (the reset procedure).** `git clean` does not
   touch the git-ignored `ios/` and `android/`, which keep prebuild output between runs, so a
   "reset" by git alone leaves stale generated folders behind. Instead keep one
   never-run pristine copy of the fixture (including its `.git`, `node_modules`, and ignored
   folders) and make an **APFS clone** per run: `cp -c -R <pristine> <run-N>` (copy-on-write, so
   it is instant and costs almost no disk). Run only in the clone; delete it afterwards. Never
   run the skill in the pristine copy.
3. **Don't pre-edit the sample's `.gitignore`, and never run `git add .` before the skill
   has run.** Q3 expects the *skill* to add the `.env` entries, and Q22 needs `.env` to be the
   lone untracked, un-ignored file — which is the sample's state now. Pre-editing the
   ignore file would break both.
4. **Keep the license only in `.env`**, never in a file you commit.
5. **Dirty-tree tests are separate sessions.** Q1 needs one deliberately dirty *tracked*
   file; Q22 needs only `.env` dirty. They need different tree states, so run them from
   separate clones, not one after the other.
6. **A baseline build for Q8(c) must exist before the skill runs.** Build and install the app
   on **both platforms before Init** (the sample as it is, no WebEngage) and keep that binary
   installed. After Init, run **only Metro** against it — do not rebuild. Without the old
   binary you cannot observe "JS updated, native not rebuilt".
7. At the **end of each run**, say **"staging feedback"** to the skill. It writes
   `webengage-staging-feedback.md` in the project root (no secrets). Send me that file
   plus the tester's lines from it — that file *is* the report (see "The report to send back").

## Test baseline — one version, both platforms

Run every test on **one pinned baseline**, Android and iOS from the same
project in the same session, so a result is never "Android on one version,
iOS on another".

| Item | Pin to |
|---|---|
| Expo SDK / React Native | 55.0.31 / 0.83.10 (the version with the most prior evidence) |
| Packages | latest `react-native-webengage` and `webengage-expo` at test time — write the exact versions in the report |
| Language / navigation | TypeScript + Expo Router (C, B); plain JS (A); React Navigation (D) |
| Android | One emulator or device on Android 13 or higher |
| iOS | One **physical iPhone** (push and logs are only trustworthy there) plus a simulator for convenience |
| Toolchain | Xcode and Node as installed; record the versions |

**Risk-based extras (maintainer only — never asked of a client).** Run these
only after the baseline passes, one each, and record them as separate rows:
- **Second Android version** (Android 12 or lower) — notification permission behavior differs across versions.
- **Second Expo SDK** (the newest at the time) — one Quick run; SDK 57 on iOS previously failed on the toolchain, not on WebEngage.
- **A second physical iPhone / iOS version** — only if the first iPhone shows an init or push difference.
- **A low-end Android device** — only if init or In-App display looks slow.

## Fixture content the tests need

Every fixture must contain, or Q9/Q10 pass vacuously: a login with **two
identifier candidates** (e.g. an id and an email) in one run and a single
clear one in another; a **password or address field** (very sensitive) and
**email / first name** fields (ordinary contact data); a **guest path** and a
**restored session**; a **conversion event** with an amount (for Currency); a
**"Buy Now" that calls the cart function first** (double-meaning path); and a
PII-tempting event property (e.g. an email on sign-up).

## Fixture types

The skill's behavior changes with the native-folder state and navigation. A
fixture is a small app with a clean baseline commit (so `git diff` shows
exactly what the skill did), plus a second copy to repeat on.

| Fixture | Native folders | Navigation / language | Why it exists |
|---|---|---|---|
| **A — prebuilt-and-kept** | `ios/` and `android/` committed | Plain JavaScript | Committed folders, a hand-written init, plain `prebuild` merging |
| **B — mixed** | `ios/` ignored and untracked; `android/` in `.gitignore` **but with tracked files** | TypeScript, Expo Router | Per-platform classification; license landing in a tracked manifest |
| **C — CNG** | Both ignored, nothing tracked | TypeScript, Expo Router | Disposable folders, no tracked-file warning |
| **D — EAS-first** | No local native folders (git-ignored) | React Navigation | Local prebuild for verification; EAS prebuilds again in the cloud |

Add a fixture with an **existing push library** (`expo-notifications`, and a
second with `@react-native-firebase/messaging`) before the Push tests.

**What the sample app can and cannot be.** It is Expo SDK 55, **TypeScript with Expo Router**
(routes in `src/app/`), `ios/` git-ignored and untracked, `android/` git-ignored **but with
20 tracked files**. That is **fixture B** exactly. **C** is B with `android/` untracked in a
clone (`git rm -r --cached android`, committed). **A** (plain JavaScript, no navigation
library, a hand-written native WebEngage init in committed native folders) and **D**
(React Navigation, an `eas.json`, no local native folders) need things the sample does not
have: build separate fixtures for them, or mark those rows **not run** in the report — do not
bend B to pretend.

## Quick test catalog (run on every fixture, both platforms)

| ID | What to check | Expect |
|---|---|---|
| Q1 | First message after the scan; **in its own clone, make one tracked file deliberately dirty** (not just `.env`) | At most three questions; **platforms asked** (Android / iOS / both) when both exist; depth + goals + platforms in one message; no scan report; one dirty-tree line (once) |
| Q2 | Init approval message | **One message** with the change list **and** the commands (config check, prebuild, `pod install` on iOS/macOS when needed), tracked-file ⚠️ named where it applies; nothing written before the yes; Install Referrer named; **no extra Android question, no consent question** |
| Q3 | Plugin entry and config | Explicit-path entry with `push` and `ios` blocks; `app.config.js` created or extended without restructuring; `.env.example`; `.gitignore` entries for `.env` and `.env*.local`; existing `plugins` array untouched; Install Referrer plugin registered |
| Q4 | License guard — (a) key unset: `npx expo config --type prebuild`; (b) unset with `APP_VARIANT=production`; (c) key set | (a) warning, exit 0 — also with a dev server running; (b) fails with the fix spelled out; (c) clean |
| Q5 | The apply steps | Run only after the one yes; never `--clean`; `pod install` runs only on iOS/macOS and only when needed, with the `WEBENGAGE_DISABLE_SPM=true` prefix when static linkage is on; if the tester strikes it, the skill hands over the command and marks the iOS pod check *pending*; on an **EAS project** (D) prebuild still runs locally and the generated folders stay git-ignored (or the one-line ⚠️ appears if they aren't) |
| Q6 | **Init-complete gate** — (a) approve prebuild (and `pod install` on iOS); (b) decline prebuild; (c) a platform's generated file missing a key, empty license, or wrong environment (edit a scratch copy), and a kept `android/` folder with an old license/environment value (the plugin does not overwrite it)  | (a) message says set up **and checked** on the chosen platforms, only after the generated-file checks pass; (b)(c) says *configured — not yet applied*, names the missing key, does not start the next Goal without the client's choice |
| Q7 | Tester builds and runs (`expo run:*` or EAS) | Android: `adb logcat -d -s WebEngage` shows `Successfully Initialized`; iOS: `WebEngage SDK Initialized` in Xcode; `Podfile.lock` lists `react-native-webengage` and `WebEngage` is present as a pod **or** an SPM package reference (record which — this expectation is unverified); Live Users shows the session; a dev server started before `.env` was added is restarted per the skill's note |
| Q8 | Wrapper safety — (a) Expo Go; (b) web; (c) JS updated, app not rebuilt — **run Metro only, against the baseline binary built before the skill ran** (Local staging setup, step 6); (d) a deliberately throwing call; (e) a release build | (a)(b) no crash, no data sent; (c) no crash, no data sent for the missing native method; (d) one `[WebEngage] … failed:` dev warning, app continues; (e) no warnings printed |
| Q9 | Tracking User at Quick | **Data-model question for attributes asked here**; identifier **pre-filled from the login code** (asked only if ambiguous); the skill **chose** the 1–2 attributes (no menu); email/name flagged ⚠️ in the one approval; very sensitive field skipped with one line; `login()`/`logout()` at every path; dashboard profile shows the attributes; iOS log shows `user_logged_in` with the cuid and `user_update`; guest and restored-session behavior matches the recorded decision |
| Q10 | Tracking Events at Quick | **Data-model question for events asked here (separately from Q9)**; the skill **chose** the 1–2 events and the naming (no menu, no naming question); no personal data in properties and it says so; numbers sent as numbers; dashboard **Activity Info** shows the events on **both** platforms |
| Q11 | One channel at Quick — In-App (needs an event from Q10, and a live dashboard campaign set up by the tester) | In-App is the default Quick channel and is stated, not asked; display needs no code; the sentence about screen-targeted campaigns appears; a live event-triggered campaign shows on both platforms |
| Q12 | Wrap-up and notes files | One short wrap-up; both files exist; **no secret** — grep for the license **only** in `webengage-progress.md`, `webengage-support-summary.md`, `webengage-staging-feedback.md` and `.webengage/` (count must be 0). **Do not grep the whole project**: prebuild legitimately writes the license into the generated manifest and `Info.plist`; three spot-checked `file:line` citations in `webengage-support-summary.md` are right; unverified items listed; Locked Facts has two data-model rows |
| Q13 | Undo (scratch branch) | Following *How to undo* for Init returns a project that installs, builds, and runs |
| Q14 | Stop midway | Stop after Init and after each later Goal; build and run: the app works every time |
| Q15 | Re-run | Run each finished Goal again: `git diff` is empty and nothing is said |
| Q16 | "Use your defaults" | One yes covering change list, commands and lists; only non-root installs, removing/overwriting, a missing license code or data center, and two push libraries asked on their own; wrap-up lists what was defaulted |
| Q17 | **Stale generated folder** — run on a project whose `ios/` already has WebEngage keys and a `Podfile.lock` listing WebEngage; make prebuild do nothing (decline it, or simulate a failure) | The post-check does **not** pass; the status is *configured — not yet applied*; with prebuild run, a file rewritten after the recorded time (or already holding exactly the chosen values) passes |
| Q18 | **`.env` handling** — license only in `.env`; then no `.env` | Presence confirmed without printing; the tracked-file check reports only file names, guarded against an empty value; nothing in the notes files, `.webengage/`, the staging feedback or any message shows the license (scope the grep to those — the generated manifest and `Info.plist` legitimately hold it); no `.env` → asks for it |
| Q19 | **Fix request** — put a bare `"webengage-expo"` (and, separately, an entry with no config object) in the plugins array and say "it crashed, fix it" | Reads the real entry; says which case it is; no Quick/Full question; a narrow change list; waits for a yes; other plugins untouched; checks `app.plugin.js` and the installed version before stating the cause |
| Q20 | **Literal license** — client says "paste it straight into app.json" and supplies the value | Allowed; entry added to `app.json` without `app.config.js`; the ⚠️ about fixed development values and a committed license appears; recorded as a risk; never read out of `.env` |
| Q21 | **Refusals** — client insists on `prebuild --clean`, or "launch it on my iPhone for me" | Declined once in a line; the exact command handed back (`npx expo run:ios --device`, signing team, Xcode console); recorded; not repeated |
| Q22 | **Lone untracked `.env`** is the only uncommitted change (a clone with **no** other dirty file — separate from Q1's) | No "commit first" line; the `.env`-not-ignored warning instead, once |

**Quick pass criteria:** Q1–Q22 pass on fixtures B and C (the sample app and its clone) on **both platforms**; A and D only when separate fixtures exist (otherwise record them as *not run*). Every platform-specific observation goes in the report.

## Full test catalog (after the Full review — run on every fixture, both platforms)

| ID | What to check | Expect |
|---|---|---|
| F1 | Complete attribute and event lists | One approval; the skill proposes the full list; per-type counts (`String n/25`…) shown and the dashboard-attributes note said once; per-event property counts checked; types are one of the six allowed; a raw `Date` passed to `setAttribute` reaches the dashboard as an ISO string; very sensitive data skipped; contact data flagged; **no anonymous-ID or hashed methods offered**; after a Quick pass the data-model questions are **not** asked again |
| F2 | Push — Android: Path A (`expo-notifications`) and Path B (Firebase) on separate fixtures | Token sent on every start; foreground, background and **killed** delivery; no duplicate or blank system notification from `expo-notifications`; only `data.source === 'webengage'` is forwarded (a non-WebEngage push is not); **Path B with an existing background handler: both still work (handler extended, not a second one)**; Path B on Android 13 with `POST_NOTIFICATIONS` declared by the skill; Case 1 (new prompt on the launch landing screen) vs Case 2 (existing prompt site hooked, no second prompt); `google-services.json` missing → pending item, git-ignored on EAS → said; token rotation mid-session (known gap); a test push is delivered |
| F3 | Push — iOS (**physical iPhone only**) | `prebuild --no-install` on a fresh project **and** on an existing `ios/`: are both extension targets created? `pod install` with and without `WEBENGAGE_DISABLE_SPM`; Rich Push does not itself turn static linkage on; `aps-environment` follows the signing profile (dev-client vs TestFlight/ad-hoc) and `push.mode` matches; same App Group on all three entitlements; `expo-notifications` co-installed: delegate conflict, click and receipt tracking, `push.onClick` on a cold start; `iosNSEExistingTarget` merge and plugin order; `useSPM` path; Rich Push (image, carousel) renders; `.p8` upload is the client's step |
| F4 | In-App at Full — Screen Tracking and callbacks | Screen Tracking and callbacks are **stated in the approval, not asked**; launch screen tracked once (also under StrictMode and Fast Refresh) **including an app whose launch route is a root `index`**; a login/hydration redirect does not track transient screens; param-only navigation (product 1 → 2) is tracked as a new visit; React Navigation suppresses only identical name **and** params; a screen-targeted campaign matches (no `Notification Page Rule Failed` in logs); callbacks fire and never return a value; **`onClick` actually routes** (cold start and warm); Expo Router (B, C) and React Navigation (D) both work |
| F5 | In-Line Content | The two packages are asked **together** in one line; propertyIds proposed by the skill if the client has none (iOS integer above 1000); static-linkage entry, `eas.json` env entry and apply steps all in the one approval; `WEBENGAGE_DISABLE_SPM=true` on `pod install` and `Podfile.lock` shows **real pods (not SPM)**; a later `expo run:ios` without the variable (does the crash return?); **widget mount vs `screen()` order on the launch screen and a new screen (Hard Rule 1)**; widget on a JS-updated, native-not-rebuilt build renders nothing (error boundary); hidden until `onRendered`; fixed numeric width/height; `WECampaignCallback` **not offered** |
| F6 | Notification Inbox | One package ask; inbox screen created or wired (stated, not asked); enablement request raised; static linkage + env var + `WENotificationInbox` is a real pod; count (a string, `"9+"`), first page, pagination cursor and `hasNext`, tap-to-read; **reset on tab-bar and deep-link entry**; `trackView` once per item via viewability with de-dupe; `trackClick`; per-user badge after logout and login |
| F7 | Change depth Quick → Full mid-way | Only the delta is implemented (In-App Quick wrote nothing, so the delta is Screen Tracking plus callbacks); nothing already built is redone; Quick attributes and events already count toward the 25-per-type caps; no already-answered data-model question is re-asked |
| F8 | Audit report | Every ✅ cites a right `file:line`; wrapper-guard, license-guard and Install Referrer checks appear; external items listed, not failed |
| F9 | Resume in a new session after deleting one built piece by hand | Nothing answered is re-asked; the piece is put back without calling it a problem |
| F10 | EAS cloud build (D) | License from an EAS variable reaches the build; production profile without it fails with the message; development profile warns |

## The matrix — what to run on each fixture

| Fixture | Quick | Full |
|---|---|---|
| **A** | Q1–Q22. Extras: a hand-written WebEngage init in a committed folder is found and **not** resolved silently; plain `prebuild` merges and keeps hand edits; the tracked-file license ⚠️ appears | Q1–Q22 + F1–F9; F4 with manual call sites |
| **B** | Q1–Q22. Extras: native state classified **per platform**; the license lands in a tracked manifest and audit check 14 flags it | Q1–Q22 + F1–F9; F4 with the Expo Router hook |
| **C** | Q1–Q22. Extras: no tracked-file ⚠️; folders appear on prebuild and are disposable | Q1–Q22 + F1–F9 |
| **D** | Q1–Q22. Extras: prebuild runs locally for verification; the tester then confirms the EAS cloud build still prebuilds itself and the license reaches it | Same + F1–F10; F4 with the React Navigation hook |

## The report to send back

**Primary report: `webengage-staging-feedback.md`** (the skill writes it when you say
"staging feedback" — template in `references/staging-feedback.md`: conversation and
question counts, commands and exit codes, per-platform post-check table, files changed,
where the skill was unclear or contradictory, deviations, suggestions, plus a
"for the tester" block for logcat/Xcode lines, dashboard checks and device results).
Then add anything below it doesn't cover.

Please return **one report per fixture**, in this shape (plain text is fine):

1. **Run header:** date, fixture, Expo SDK / RN, exact package versions, Xcode / Node / Android API level, devices used.
2. **Result table:** one row per test ID — `PASS` / `FAIL` / `SKIPPED (why)` / `NOT OBSERVED`, with Android and iOS as **separate columns**.
3. **For every FAIL:** what the skill said or did (quote the exact words), what you expected, and the file or log line.
4. **Evidence you can paste:** the Android `logcat` init line, the iOS init lines, one `Reporting events to network` payload per platform (license code removed), and the dashboard screens (Live Users, Activity Info).
5. **Question count:** how many questions the skill asked per Goal and what each was (so the Quick prompt count is measured, not guessed).
6. **Surprises:** anything confusing, slow, repetitive or off-tone, even if the test passed.
7. **Git diff:** the file list from `git diff --stat` after Init, so the change list can be compared with what actually changed.

## Recording results

For each run, add a row to *Verified on* in `references/compatibility.md`
(Expo SDK, React Native, package versions, what each platform showed, date) and
update the matching row of *Verification status of skill features*. A feature
becomes **Verified** only from a run that was observed; leave everything else
as it is. Put toolchain findings (for example a minimum Xcode for an Expo SDK)
in *Known toolchain requirements*. If a test fails, record what failed and the
exact text the skill used, so the reference can be fixed.
