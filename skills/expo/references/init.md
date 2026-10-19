# Goal: Integration (Init)

Root Goal — no other Goal (Tracking User, Tracking Events, Engagement
Channels) can proceed until this is complete. Pre-Flight has already
run before this Goal begins; do not re-scan anything it already
covered.

**On Expo, Init is plugin configuration — applied by a prebuild, then
built and run by the client.** Nothing in this Goal edits native source.
Beyond file edits and package installs, the only commands this skill
runs are the ask-first apply steps (Core Rule 22) — read-only checks such as
`git grep`, `git status` and `npm view` are not part of the approval; it
never builds or runs the app. The `webengage-expo` config plugin applies, at prebuild/EAS
time: the Android manifest meta-data and the
native lifecycle hook that initializes the SDK; the iOS `Info.plist`
keys, `aps-environment` entitlement, Background Modes, App Group, and
the `AppDelegate` subscriber that initializes the SDK and registers for
push. See `SKILL.md` → Scope.

## How This File Is Organized

Work through Init in this order. Each row names the section to read; the
last column says whether the client's explicit yes is needed first.

| # | Step | Section | Who acts | Client's yes needed |
|---|---|---|---|---|
| 1 | Check what's already there | Start From What's Already There | skill, read-only | no |
| 2 | Ask what Pre-Flight couldn't determine | Questions → "Then ask" (at most three questions) | skill asks | answers, in one message |
| 3 | Stop if the Expo SDK is too old | Old Project | skill explains | — |
| 4 | Install the WebEngage packages | Installation | skill, package manager | in the one approval — the root packages need no separate ask (Core Rule 21) |
| 5 | Write the plugin config | Plugin Configuration | skill edits config | yes — shown first (Core Rule 5) |
| 6 | Android Install Referrer — Android only | Android Install Referrer | skill adds a local plugin | named in the change list (one approval) |
| 7 | Create the Analytics Wrapper | Analytics Wrapper | skill adds a file | yes — shown first |
| 8 | Apply the plugin and check the generated files | Apply the Plugin — Ask-First Steps | skill runs up to 3 commands, then reads the generated files | yes — one listed plan |
| 9 | Build, run, confirm | Build and Run · Verify Integration | **the client** | — |
| 10 | Close Init — only once step 8's post-checks pass on every chosen platform | Init-Complete Message · Recording State | skill | no |

**Steps 4–7 are one approved change list, applied in that order — packages,
then config, then code — so no step (and no stopping point) leaves the project
unable to build or run** (Core Rule 25; `references/safety.md`). Every write is
additive and checked against what is already there.

A request this skill can't serve on Expo (late init, waiting for consent,
GAID, native edits) → "Not Supported on Expo". Rules that always apply —
read them before step 4; Pre-Flight re-runs them every session: Hard
Rules, Rules, Audit Checks. Only auditing? Go straight to Audit Checks.

**Reading conventions.** `> quoted blocks` are what to say to the client;
`*{…}*` and `{{…}}` are placeholders to fill from Pre-Flight or
`.webengage/agent.md`. Every ask is short, plain prose with the recommendation first and a ⚠️
only for a real risk (Core Rule 24).
"Core Rule N" lives in `SKILL.md`; "Hard Rule N" lives in this file's Hard
Rules. Quoted section names are exact headings.

## Start From What's Already There

Before asking anything, use what Pre-Flight found — privately; none of it is
reported to the client:

- **Init already complete** — say nothing about it; go to the Goal the
  client wants. Don't re-ask anything already answered or locked.
- **Part of Init already in place** (packages, the wrapper, the `init()`
  call, maybe an older Install Referrer plugin) — reuse it. A missing plugin
  entry, license source or data center is simply what is
  left to do; the questions below ask only for what's missing. If something
  WebEngage-related is wrong — for example a bare `"webengage-expo"` plugin
  name, which Expo can't resolve (it must be the explicit
  `./node_modules/webengage-expo/src/withWebEngage.js` path with a config
  object, Hard Rule 1) — fix it as part of the change list, in plain words
  ("I'll correct the plugin entry so Expo can find it"). Never present it
  as a finding. A missing JS `webengage.initialize()` call is harmless
  (Core Rule 3).
- **A hand-written WebEngage init in committed native folders**
  (`WebEngageActivityLifeCycleCallbacks`, `WEGWebEngageBridge`,
  `autoRegister` in `MainApplication`/`AppDelegate`) would run alongside the
  plugin's init (Hard Rule 5). This is the one thing the client does need to
  hear, once and plainly — see "Hand-Written WebEngage Init in Committed
  Native Folders". Never resolve it silently.
- **Not yet started** — go straight to the questions.
- If it's genuinely unclear whether something is WebEngage's own code, ask.

## Input from Pre-Flight

Expo SDK version, language (JS/TS), package manager, Expo config file
shape (`app.json` / `app.config.js`), native-folder state (CNG /
prebuilt-and-kept / absent), build path (EAS / dev client / local), New
Architecture status, existing license-key/env mechanism, and the
installed WebEngage package versions if present — already known. Do not
ask for these again.

## Questions (Only What Pre-Flight Couldn't Determine)

Follow `SKILL.md` → How to Talk to the Client — short, plain, the recommended
answer first, a ⚠️ only for a real risk, and never more than three
questions in a message. **Ask only what only the client can answer; decide
and state the rest.**

**If the client asked for "your defaults"** (`references/defaults-mode.md`),
skip the questions below that mode decides: the items in the table below are
decided and reported, the change list goes out as one batched yes, and only
the always-asked items (non-root installs, removing/overwriting, a
license code or data center that isn't in the project, two push libraries)
are asked — each on its own.

**Decide without asking — say it in a few words:**

| Item | Default |
|---|---|
| License code source | the environment (`WEBENGAGE_LICENSE_CODE` — `.env` locally, an EAS variable in cloud builds), reusing the project's own env convention if it has one; a literal in the Expo config only if the client prefers it |
| Debug mode | verbose logging in development builds, off in release builds (driven by the build profile when the project has one); remind the client in the final message to confirm release builds stay quiet |
| Package versions | latest `react-native-webengage` and `webengage-expo` (see Installation) |

**Then ask — in one short message, at most three questions** (when depth, platforms and the other open items would make more than three, ask the license code and data center in a second short message after the first answer):

1. **How far to go (Quick or Full), for Full which channels, and which
   platforms** — see `references/depth.md` → Integration Depth — Asked Once
   for the wording. Platforms: when the project is configured for both,
   ask "Android, iOS, or both (recommended)?" — the client can want one now
   and the other later, so never refuse that. A single-platform project:
   state it, don't ask. When the client's own words already answer a part,
   don't ask that part.
2. **License code and data center.**
   - *License code:* if it is already in the project (`.env`, the config, or
     an environment variable), don't ask — say you'll read it from there. If
     `.env` isn't git-ignored, say you'll add it to `.gitignore`, with one
     ⚠️ line: otherwise `git add .` would commit the code. If it isn't in the
     project, ask for it (Dashboard → Account Settings → Integration).
   - *Data center:* if existing config or env already names one, state it
     in the approval message ("US, as in your existing config") — not a
     question. **Only the Expo config or `.env` counts** — a value that
     exists only in generated `ios/` or `android/` files may be stale
     (`references/troubleshooting.md`), so ask. Otherwise
     ask which URL they log in to: dashboard.webengage.com (US),
     dashboard.in.webengage.com (IN), dashboard.ksa.webengage.com (KSA), or
     dashboard.eug.webengage.com (EUG) — it has to match, or no data
     arrives.

Then, before writing anything, send **one approval message** (Core Rules 5
and 22): the change list **and** the apply plan together, with the ⚠️ risks
that apply to this project. Keep it to a few plain lines, for example:

> Here's the plan. I'll install `react-native-webengage` and `webengage-expo`
> (this changes `package.json` and your lockfile) and add the plugin entry,
> an `app.config.js` that reads your license from `.env`, `.env.example`,
> `.gitignore` entries for `.env`, the analytics wrapper with one `init()`
> call in your root layout, Android Install Referrer, and a few notes files
> (no secrets). Then I'll check your Expo config, run `expo prebuild`, run
> `pod install` on iOS, and check the generated files. *{⚠️ only what
> applies: tracked native files that prebuild will modify; on iOS the plugin
> always adds the Push entitlement and an App Group, so signing needs the
> Push capability, and the app will show the notification-permission prompt at
> launch (`WEGAutoRegister`).}* OK? You'd run the build and the app yourself.

### Reference for the agent — not for the client

**License code:** Core Rule 10 — a recommendation, not a requirement; follow the client. If
Pre-Flight found an existing env mechanism, use its convention (name,
file) without asking. If the client prefers the literal in their config
(or already has no env mechanism and doesn't want one), do that — it's a
Rule deviation recorded as a low-severity Known Risk, never refused and
never blocking. When using env: offer to create a committed
`.env.example` (placeholder value) and to append `.env` and
`.env*.local` to `.gitignore` — confirm `.env` is git-ignored before
writing the real value into it, and flag it if it isn't.

**Data center — value formats.** The two platforms take different formats —
do not reuse one string for both:

| Dashboard URL | iOS `ios.WEGEnvironment` | Android `com.webengage.sdk.android.environment` |
|---|---|---|
| dashboard.webengage.com (US) | `DEFAULT` | `us` |
| dashboard.in.webengage.com | `IN` | `in` |
| dashboard.ksa.webengage.com | `KSA` | `ksa` |
| dashboard.eug.webengage.com | `EUG` | `eug` |

(iOS `DEFAULT` is the US data center — there is no `US` value on iOS
here. The Android values are lowercase.) Both keys are required by the plugin.

**Debug mode.** Maps to `ios.WEGLogLevel` (`VERBOSE` / `DEFAULT`) and
`com.webengage.sdk.android.debug` (`true` / `false`). The build-profile
form ties both to a build variant in `app.config.js`. **`EAS_BUILD_PROFILE` is
unset in local builds**, so a rule keyed only on it can never select
"production" locally — use `process.env.APP_VARIANT ?? process.env.
EAS_BUILD_PROFILE` (or the client's own variant variable if Pre-Flight
found one), and tell the client a local release build needs
`APP_VARIANT=production` on the command line.

**Version — not a question, a default:** always install/target the
latest `react-native-webengage` and `webengage-expo` releases on npm.
Check the actual current latest (`npm view <pkg> version`) rather than
assuming a number from memory.

**If Pre-Flight found versions already installed**, confirm each against
the same check:
- **Already latest:** proceed, nothing to ask.
- **Behind latest:** recommend upgrading and say why — a Rule-level
  recommendation the client can decline, not a Hard Rule.
- **`react-native-webengage` below v2.0.0:** a real compatibility
  finding, not just staleness — `webengage-expo` requires `>=2.0.0` as a
  peer dependency, and the New Architecture (default on Expo SDK 52+)
  needs v2.0.0+.

**Installing or upgrading writes a caret range, not a pin.** Leave it as a
caret unless the client explicitly asks for a pinned dependency. Mention
the installed versions in one short line; explain what a caret allows only
if the client asks. What a caret allows depends on the version:
`^2.1.0` accepts any later 2.x (so a fresh install can resolve newer
without this skill running again — which is why Pre-Flight re-reads the
lockfile's resolved version every session), but **`^0.0.3` accepts only
exactly 0.0.3** (a caret on a `0.0.x` version doesn't float at all), and
`^0.1.0` accepts only 0.1.x. Don't tell the client a `0.x` package "may
silently update" when its range can't.

## Old Project — Recommend Upgrading First (Not WebEngage Work)

**Trigger (Pre-Flight finding):** Expo SDK below 52 or React Native below
0.76. `webengage-expo` requires `react-native-webengage >=2.0.0`, and that
release pairs with the New Architecture that Expo SDK 52+ enables by
default — so an old project cannot take the plugin without moving its Expo
SDK too (a project on SDK 47 needs a ten-SDK jump, not a version bump).
**If only `react-native-webengage` is old and the Expo SDK is 52+, there
is nothing to upgrade** — Installation's `@latest` install replaces it.

**Say this plainly — it is a blocker, so a decision is needed before
anything else:**
- This is a prerequisite *project* upgrade, outside WebEngage scope. It
  can break the client's own code (other native libraries, deprecated
  APIs), which this skill cannot fix.
- **This skill does not perform it** — no `expo install expo@…`, no
  `--fix`, no SDK jump. Expo's own upgrade guide and the target SDK's
  release notes are the authority; suggest a dedicated git branch and a
  clean working tree.
- **Recommended:** upgrade first, then come back — Pre-Flight re-reads the
  versions every session and continues from there.
- There is **no manual path** for an Expo-managed project that cannot
  upgrade: the plugin is the only supported route. Say so; point to
  `support@webengage.com` for a project that genuinely can't move.
- Check `references/compatibility.md` for the target SDK and state
  whether it's verified. An unlisted SDK is unverified, not forbidden.

## Installation

Use whichever package manager Pre-Flight detected — don't present this
as a choice. Both packages are required (the plugin configures native
projects; `react-native-webengage` supplies the JS API and bundles the
native SDKs). **Always install at `@latest`:** if the project already
lists `react-native-webengage` (for example an old `^1.3.0`), a plain
`install` honors that old range and fails with `ERESOLVE` against
`webengage-expo`'s `>=2.0.0` peer — `@latest` replaces it.

```shell
npm install react-native-webengage@latest webengage-expo@latest      # package-lock.json
yarn add react-native-webengage@latest webengage-expo@latest         # yarn.lock
pnpm add react-native-webengage@latest webengage-expo@latest         # pnpm-lock.yaml
bun add react-native-webengage@latest webengage-expo@latest          # bun.lock
```

These are not `npx expo install` packages (WebEngage versions
independently of the Expo SDK). Use `@latest` the same way in every
Goal that installs a WebEngage package (`webengage-expo-push`,
`react-native-we-personalization`, `react-native-webengage-inbox`).

## Plugin Configuration

The plugin goes in the Expo config's `plugins` array. **Two valid
shapes — follow the client's license-source choice (the default is the
environment):**

- **Environment-sourced (recommended, Core Rule 10).** The config must be
  dynamic. **If the project has only a static `app.json`:** add an
  `app.config.js` next to it. Expo passes the static file in as the
  `config` argument, so nothing in `app.json` needs to change or move —
  the new file only extends it. Tell the client explicitly before
  creating it, since it changes how their config is read. **If an
  `app.config.js`/`.ts` already exists:** extend its returned object the
  same way; never restructure it.
- **Literal in the existing config.** If the client keeps the value in
  their Expo config and wants nothing else, add the same plugin entry
  directly to `app.json`'s `plugins` array with the literal values — no
  `app.config.js`, no conversion. Record it as a Known Risk (Core Rule
  10).
  **Template for the literal form** (the client supplies the value — never read it
  out of `.env` to paste it here; if it is only in `.env`, use the env form
  above or ask the client to paste it):

  ```json
  ["./node_modules/webengage-expo/src/withWebEngage.js", {
    "push": { "mode": "development" },
    "ios": { "WEGLicenseCode": "<client's value>", "WEGEnvironment": "<DEFAULT|IN|KSA|EUG>",
             "WEGLogLevel": "VERBOSE", "WEGAutoRegister": true },
    "android": { "manifest": {
      "com.webengage.sdk.android.key": "<client's value>",
      "com.webengage.sdk.android.environment": "<us|in|ksa|eug>",
      "com.webengage.sdk.android.debug": true } }
  }]
  ```
  ⚠️ one line: the values are fixed — `push.mode: development`, verbose
  logging and Android `debug: true` have no build profile to switch them, so a
  release build would ship them unless the client changes the three values
  by hand before releasing; and the license sits in a committed file.

```javascript
// app.config.js — environment-sourced form
const licenseCode = process.env.WEBENGAGE_LICENSE_CODE ?? '';

// EAS_BUILD_PROFILE is unset in local builds; APP_VARIANT works locally.
const variant = process.env.APP_VARIANT ?? process.env.EAS_BUILD_PROFILE;
const isProduction = variant === 'production';

// A missing license code must never stop a teammate's checkout, a CI job, an
// unrelated Expo command, or an already-running dev server — so by default it
// is only a loud warning. The one exception is a PRODUCTION build, where
// shipping without a key would silently send no data to WebEngage: that one
// fails, with the fix spelled out.
if (!licenseCode) {
  const message =
    'WEBENGAGE_LICENSE_CODE is not set — WebEngage will not start in this build. ' +
    'Copy .env.example to .env (cloud builds: set it as an EAS environment variable).';
  if (isProduction) throw new Error(message);
  console.warn(`[WebEngage] ${message}`);
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      './node_modules/webengage-expo/src/withWebEngage.js',
      {
        push: { mode: isProduction ? 'production' : 'development' },
        ios: {
          WEGLicenseCode: licenseCode,
          WEGEnvironment: '{{DEFAULT|IN|KSA|EUG}}',
          WEGLogLevel: isProduction ? 'DEFAULT' : 'VERBOSE',
          WEGAutoRegister: true,
        },
        android: {
          manifest: {
            'com.webengage.sdk.android.key': licenseCode,
            'com.webengage.sdk.android.environment': '{{us|in|ksa|eug}}',
            'com.webengage.sdk.android.debug': !isProduction,
          },
        },
      },
    ],
    // Android only — appended next to the WebEngage entry, same array:
    './plugins/withWebEngageAndroidExtras.js',
  ],
});
```

```shell
# .env.example — committed; the real .env is git-ignored
WEBENGAGE_LICENSE_CODE=your-license-code
```

Adapt `isProduction` to the debug-mode default (Questions → "Decide
without asking": driven by the build profile; a fixed `true`/`false` only
for a project with no build profile whose client asks for always-on or
always-off logging). Keep any existing `config.ios.bundleIdentifier`/
`config.android.package` — the plugin needs both (App Group name, and
`webengage-expo-push`'s extension IDs, derive from them); if Pre-Flight
found either missing, ask the client for it rather than inventing one.

**Cloud builds:** the value reaches an EAS build only through EAS
environment variables/secrets (an `env` block in an `eas.json` build
profile, or `eas env:create`). If Pre-Flight found no `eas.json`, say so —
nothing supplies it until EAS is set up. This is part of the build-path
finding, not something to improvise here.

### Changing application identifiers

The skill keeps the client's existing `ios.bundleIdentifier` and
`android.package`. If the client *needs* to change one (for example to
match a `google-services.json`, or an Apple/Firebase registration),
state the consequences first — it's a bigger change than it looks:
- The iOS App Group name (`group.<bundleId>.WEGNotificationGroup`) and
  both extension bundle IDs (`webengage-expo-push`) all derive from it.
- The signing identity changes. On a device that has the old build
  installed under a different signing key, the install fails with
  `INSTALL_FAILED_UPDATE_INCOMPATIBLE` (Android) — the fix is for the
  client to uninstall the old build; this skill never uninstalls an app.
- What must be re-registered: Apple Developer portal (App ID, App Group,
  extension IDs), Firebase (`google-services.json` package), and the
  WebEngage dashboard (push credentials, the app/package).

### Config reference

**`push`**

| Key | Description | Required |
|---|---|---|
| `push.mode` | APNs environment: `development` or `production` | Yes — the plugin throws without the `push` block, and without `mode` |

**`ios`**

| Key | Description | Required |
|---|---|---|
| `WEGLicenseCode` | Your license code | Yes |
| `WEGEnvironment` | `DEFAULT`, `IN`, `KSA`, or `EUG` | Yes |
| `WEGLogLevel` | `DEFAULT` or `VERBOSE` | Optional |
| `WEGAutoRegister` | Whether the native SDK registers for push (and requests notification permission) at launch. Defaults to `true`. Native init and push-callback registration happen regardless of this value. | Optional |
| `WEGAlternateAppSupport` | Multi-app license support — **opt-in only (Core Rule 15)**, set `true` only when the client confirms multiple apps share one license code | Optional |

Every key in the `ios` block is written to `Info.plist` as-is.

**`android.manifest`** — each entry becomes an `<application>`
meta-data entry.

| Key | Description | Required |
|---|---|---|
| `com.webengage.sdk.android.key` | Your license code | Yes |
| `com.webengage.sdk.android.environment` | `us`, `in`, `ksa`, or `eug` | Yes |
| `com.webengage.sdk.android.debug` | `true` / `false` | Optional |

**Do not remove the plugin's own default** — it adds
`com.webengage.expo_enabled` itself, which is what switches the native
lifecycle hook on. Never add it by hand.

**Do not add `webengage-expo-push` here.** It belongs to the Push Goal
(iOS) — see `references/channels/push.md`.

## Android Install Referrer (a Rule, not a Hard Rule)

A recommendation the skill applies by default on Android — not a question.
It is named in the change list; a client who strikes it from the list
loses only the reporting it provides. Expo exposes no direct config for
it, so it needs a small *local* config plugin.

- **Google Play Install Referrer** — without it, WebEngage's `App
  Installed` event and `First Acquisition Details` are never tracked.
  Adds `implementation 'com.android.installreferrer:installreferrer:2.2'`
  to the app's `dependencies`.

```javascript
// plugins/withWebEngageAndroidExtras.js
const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = (config) =>
  withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('com.android.installreferrer')) {
      c.modResults.contents = c.modResults.contents.replace(
        /^dependencies\s*\{/m,
        (m) => `${m}\n    implementation 'com.android.installreferrer:installreferrer:2.2'`
      );
    }
    return c;
  });
```

Registered in the Expo config as `['./plugins/withWebEngageAndroidExtras.js']`
(or the bare path string — it takes no props). An existing
`plugins/withWebEngageAndroidExtras.js` from an earlier version of this
skill may still contain extra code beyond Install Referrer: leave it
untouched (Core Rule 7) and mention in one line that it can be trimmed to
the Install Referrer part — no question.

## Analytics Wrapper

Per `references/wrapper.md` (architecture and safety contract), this is where
Init's JS-side trigger call lives (see Core Rule 3 for what it actually
does — Init's completeness never hinges on it). Check Pre-Flight's finding
first:

- **Wrapper already exists** (from a prior session): confirm its `init()`
  method calls `webengage.initialize()`. Don't recreate the file. If it has
  no safety guard (Core Rule 26) — a wrapper written by hand, or by an
  earlier version — offer to add the guard as one small item on the change
  list; it only wraps the SDK handle and removes nothing.
- **Doesn't exist yet:** create it now. Default name/location:
  `WebEngageManager.ts` (or `.js` for a plain JavaScript project) in
  `src/analytics/` — **never inside an Expo Router `app/` directory**
  (every file there is a route) — unless Pre-Flight found an existing
  convention worth matching.

**The guard at the top of the file is part of the wrapper, not optional
decoration** (Core Rule 26). It makes every SDK call and every handler passed
to the SDK run inside a `try`/`catch`, turns every call into a silent no-op on
web and in Expo Go (where the native module doesn't exist), and logs failures
in development builds only. `expo` is always present in an Expo project, so
`isRunningInExpoGo` needs no extra install. Write it as shown; later Goals'
snippets rely on it and stay short because of it.

```typescript
// src/analytics/WebEngageManager.ts
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type WebEngage from 'react-native-webengage';

// --- Safety guard (Core Rule 26) ---------------------------------------
// WebEngage must never break the app: every SDK call and every handler passed
// to it runs inside try/catch, and on web or in Expo Go — where the native
// module doesn't exist — every call is a silent no-op. Failures are logged in
// development builds only, and never with user data.
const warn = (where: string, error: unknown): void => {
  if (__DEV__) console.warn(`[WebEngage] ${where} failed:`, error);
};

/** True where WebEngage's native module can exist (not web, not Expo Go). */
export const webengageAvailable: boolean =
  Platform.OS !== 'web' && !isRunningInExpoGo();

// A stand-in that accepts any property access or call and does nothing.
// (`then` is undefined so awaiting or returning the handle can never hang.)
const NOOP: any = new Proxy(function () {}, {
  get: (_target, prop) => (prop === 'then' ? undefined : NOOP),
  apply: () => undefined,
});

/** Wraps any function arguments (listeners, handlers) so an error inside one
 *  can't escape through the SDK. */
export function guardArgs<T extends unknown[]>(where: string, args: T): T {
  return args.map((arg) =>
    typeof arg === 'function'
      ? (...cbArgs: unknown[]) => {
          try {
            return (arg as (...a: unknown[]) => unknown)(...cbArgs);
          } catch (e) {
            warn(`${where} handler`, e);
          }
        }
      : arg
  ) as T;
}

function guarded(target: any, path: string): any {
  if (target == null) return NOOP;
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop);
      const where = `${path}.${String(prop)}`;
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          try {
            const result = value.apply(obj, guardArgs(where, args));
            return result && typeof result.catch === 'function'
              ? result.catch((e: unknown) => warn(where, e))
              : result;
          } catch (e) {
            warn(where, e);
          }
        };
      }
      return value && typeof value === 'object' ? guarded(value, where) : value;
    },
  });
}

/** A new guarded SDK handle — never throws, a silent no-op where unavailable.
 *  The wrapper holds one; the Android background push task builds its own
 *  inside the task body (Core Rule 19). */
export function createGuardedWebEngage(): WebEngage {
  if (!webengageAvailable) return NOOP;
  try {
    // Required lazily so importing this file can never throw where the
    // native module is missing.
    const Sdk = require('react-native-webengage').default;
    return guarded(new Sdk(), 'webengage');
  } catch (e) {
    warn('create', e);
    return NOOP;
  }
}

/** Runs a call on an optional feature package (In-Line, Inbox) under the
 *  same contract: the fallback when unavailable, thrown, or rejected. */
export async function safeCall<T>(
  where: string,
  fn: () => T | Promise<T>,
  fallback: T
): Promise<T> {
  if (!webengageAvailable) return fallback;
  try {
    return await fn();
  } catch (e) {
    warn(where, e);
    return fallback;
  }
}

// --- The wrapper ---------------------------------------------------------
class WebEngageManagerClass {
  private webengage = createGuardedWebEngage();

  // Exposes the same guarded handle for the one-shot, action-style SDK calls
  // that deliberately stay outside this class (Android push token/message
  // plumbing, `setDevicePushOptIn`/`setOptIn` — see references/wrapper.md) —
  // those call sites reuse this handle rather than constructing a fresh SDK
  // instance of their own.
  get instance() {
    return this.webengage;
  }

  init(): void {
    this.webengage.initialize();
  }

  // Tracking User, Tracking Events, and Screen Tracking each add
  // their own methods here in later Goals — do not add those methods
  // now; Init only writes init().

  // Engagement Channels (Push, In-App) and Tracking User's opt-in
  // callbacks add a `registerCallbacks()` method here the first time
  // any of them is actually chosen — Init does not create a stub for
  // it. See references/wrapper.md.
}

const WebEngageManager = new WebEngageManagerClass();
export default WebEngageManager;
```

**Plain-JavaScript variant** (Pre-Flight found no TypeScript — write this,
not the `.ts` above; keep the two method lists in sync as later Goals add
methods):

```javascript
// src/analytics/WebEngageManager.js
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

// --- Safety guard (Core Rule 26) — see the TypeScript version for comments ---
const warn = (where, error) => {
  if (__DEV__) console.warn(`[WebEngage] ${where} failed:`, error);
};

export const webengageAvailable = Platform.OS !== 'web' && !isRunningInExpoGo();

const NOOP = new Proxy(function () {}, {
  get: (_target, prop) => (prop === 'then' ? undefined : NOOP),
  apply: () => undefined,
});

export function guardArgs(where, args) {
  return args.map((arg) =>
    typeof arg === 'function'
      ? (...cbArgs) => {
          try {
            return arg(...cbArgs);
          } catch (e) {
            warn(`${where} handler`, e);
          }
        }
      : arg
  );
}

function guarded(target, path) {
  if (target == null) return NOOP;
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop);
      const where = `${path}.${String(prop)}`;
      if (typeof value === 'function') {
        return (...args) => {
          try {
            const result = value.apply(obj, guardArgs(where, args));
            return result && typeof result.catch === 'function'
              ? result.catch((e) => warn(where, e))
              : result;
          } catch (e) {
            warn(where, e);
          }
        };
      }
      return value && typeof value === 'object' ? guarded(value, where) : value;
    },
  });
}

export function createGuardedWebEngage() {
  if (!webengageAvailable) return NOOP;
  try {
    const Sdk = require('react-native-webengage').default;
    return guarded(new Sdk(), 'webengage');
  } catch (e) {
    warn('create', e);
    return NOOP;
  }
}

export async function safeCall(where, fn, fallback) {
  if (!webengageAvailable) return fallback;
  try {
    return await fn();
  } catch (e) {
    warn(where, e);
    return fallback;
  }
}

// --- The wrapper ---------------------------------------------------------
class WebEngageManagerClass {
  webengage = createGuardedWebEngage();

  get instance() {
    return this.webengage;
  }

  init() {
    this.webengage.initialize();
  }
}

const WebEngageManager = new WebEngageManagerClass();
export default WebEngageManager;
```

Class fields need no `private`/type annotations here; later Goals add
their methods the same way (drop type annotations and `as` casts from
the TypeScript snippets in their references).

**Say once, when you add the first handler** (a callback or a click
handler): errors thrown inside the client's own handler are caught and
shown in the development console, not rethrown — by design, so a handler bug
can't take the app down.

Call it once, as early as possible, from the app's root — whichever root
component or layout Pre-Flight recorded as the app's entry (the root
layout if the app uses Expo Router's `app/` routes, the root component
otherwise). It is safe to call anywhere: it does nothing on web and in Expo Go:

```typescript
// the app's actual root — e.g. app/_layout.tsx (Expo Router) or App.tsx.
// Adjust the import path to the wrapper's location from this file
// (e.g. '../src/analytics/WebEngageManager' from app/, './src/...' from App.tsx).
import { useEffect } from 'react';
import WebEngageManager from '../src/analytics/WebEngageManager';

export default function RootLayout() {
  useEffect(() => {
    WebEngageManager.init();
    // A later Goal (Push, In-App, or Tracking User's opt-in callbacks)
    // adds this line to this same effect once `registerCallbacks()`
    // exists — don't add a second, separate mount effect for it.
    // WebEngageManager.registerCallbacks();
  }, []);

  // ...rest of the layout
}
```

## Not Supported on Expo

When a client asks for any of these, answer plainly: **"not supported
through the plugin"**, and point to `support@webengage.com`.

| Request | Why it can't be done here |
|---|---|
| Late (deferred) initialization | The plugin's native init is unconditional and runs at app launch, with no hook to defer it. |
| Waiting for user consent before starting | Same reason — the plugin's native init runs at launch, with no hook to wait. |
| Android GAID tracking | It needs native source edits this skill doesn't make. |
| Any manual native edit (`MainApplication`, `AppDelegate`, `Info.plist`, the manifest, `Podfile`) | The plugins do the native setup; a hand edit in the generated folders is erased by the next prebuild. |
| A first-party `FirebaseMessagingService` | It is native source that plugin config can't express. |

## Apply the Plugin — Ask-First Steps

Config plugins act only when native code is generated. The apply steps
are part of **Init's one approval message** (Questions → the change list and
apply plan; Core Rules 5 and 22) — one line each, a ⚠️ only for a risk that
applies. Once the packages, config and wrapper are written, run the steps
that message approved, in order. You never build or run the app; if the
client struck a step, give them the command (see "Build and Run — the
Client's Steps"). Anything not in the approved message needs a fresh ask.

**Plan at a glance:**

| Apply step | Command | Offer when | Headline risk |
|---|---|---|---|
| A | `npx expo config --type prebuild > /dev/null` | always | the output (discarded) contains the license code |
| B | `npx expo prebuild --no-install --platform …` | no hand-written init (also for EAS projects — it verifies locally) | modifies tracked native files, if any |
| C | `cd ios && pod install` | iOS integrated, macOS, `ios/` exists, and needed to confirm iOS | network, minutes |

**Preconditions (all from Pre-Flight — no new scanning):**
- **Platforms** come from the project's configured platforms and set
  `--platform android|ios|all`.
- **A hand-written WebEngage init in committed native folders → do not
  offer prebuild.** Read "Hand-Written WebEngage Init in Committed Native
  Folders" below; the fix is regeneration, which the client runs.
- **EAS workflow** (cloud builds) → still offer prebuild: it is how the
  skill verifies the integration locally; EAS prebuilds again in the cloud,
  and git-ignored `ios/`/`android/` are not uploaded, so nothing needs to
  be pushed. ⚠️ If `ios/`/`android/` are **not** git-ignored and not
  tracked, the new folders would be swept in by `git add .` and EAS would
  then build from them instead of prebuilding — say so in one line and
  suggest ignoring them (advice only; the `.gitignore` is the client's,
  Core Rule 7).
- **Expo Go only** → WebEngage can't run there at all; tell the client
  they need a development build (`expo-dev-client` is an optional package —
  ask first, Core Rule 21).
- Run the commands in the client's normal environment — no `CI=1`. If a
  command prompts for something, ask the client; if `ios.bundleIdentifier`
  or `android.package` is missing, prebuild prompts for it, so get the
  value first and write it as a config edit (Rule 5).

### Apply step A — Config validation

- **Command:** `npx expo config --type prebuild > /dev/null` — standard
  output discarded, error output and exit code kept. Read-only; it fails
  fast on an invalid plugin entry, before a multi-minute prebuild. The
  resolved config contains your license code, which is why its output is
  never read or shown; report only pass or fail. It also runs
  `app.config.js`, like any Expo command.
- **If it fails:** show the error plainly and do not go on to prebuild. A
  fix to the plugin entry is a config edit on the change list (Rule 5).

### Apply step B — Prebuild

- **Before running it,** note the time (`date +%s`) and which of `ios/` and
  `android/` already exist, read-only. After it, a post-check counts only
  when prebuild exited 0 **and** the generated file was rewritten after that
  time (`stat -f %m <file>` on macOS, `stat -c %Y <file>` on Linux) **or**
  already holds exactly the chosen values. Otherwise report *configured — not
  yet applied*, not a pass: a stale folder can carry the same keys without
  prebuild having done anything (`references/troubleshooting.md`).
- **Command:** `npx expo prebuild --no-install --platform <android|ios|all>`.
  It applies the WebEngage plugin to `ios/` and `android/` — creates them
  if missing, merges into them if present, deletes nothing (`--clean` is
  never used). `--no-install` skips Expo's automatic npm and CocoaPods
  install, so `pod install` is its own step (below). Takes a minute or more and
  needs disk space.
- **Say (⚠️, only when it applies):** `ios/` or `android/` is tracked in
  git (*N* files), so prebuild modifies tracked files — your license code
  goes into `android/app/src/main/AndroidManifest.xml` and the iOS
  `Info.plist`, the Xcode project and a bridging header are edited, and
  development-mode values (verbose logging, `push.mode: development`) are
  baked in unless `APP_VARIANT=production` — `git commit -a` would commit
  all of it. Options: stop tracking the folder (`git rm -r --cached
  android` — give the command, don't change their git state), accept the
  literal (recorded as a Known Risk), or avoid staging that file. This
  risk is approved by name, not by a blanket "ok".
- **Post-checks — read-only; report structure only, never the license
  value. Run them for every platform integrated; Init is complete only
  when each one passes (Core Rule 3):**
  - **Android** (`android/app/src/main/AndroidManifest.xml`,
    `android/app/build.gradle`): the manifest has the WebEngage meta-data
    keys and `com.webengage.expo_enabled`, **the license value is non-empty,
    and the environment and debug values match what was chosen** (never
    print the license); the Install Referrer dependency is present, unless
    the client struck it. ⚠️ The plugin never overwrites a meta-data entry
    that already exists, so on a kept `android/` folder a later prebuild
    leaves an old or empty license, environment or debug value as it was:
    if a value is wrong, tell the client to regenerate the folder
    (`npx expo prebuild --clean` — they run it, saying what it deletes,
    Core Rule 22). Never hand-edit the generated file.
  - **iOS** (`ios/<App>/Info.plist`, `ios/<App>/<App>.entitlements`):
    `WEGLicenseCode` is **non-empty** and `WEGEnvironment` matches what was
    chosen; the entitlements have `aps-environment` (the plugin writes it
    even without Push). `Podfile.lock` / SPM is checked after `pod install`,
    below.
  - **A platform that fails a check, or a skipped prebuild:** say which
    key is missing and offer a fix to the config (a config edit, Core Rule 5)
    and a re-run. Never edit the generated native files by hand (Hard Rule 5).
    Init stays *configured — not yet applied*.
  - **Tracked-file license check:** the `.env` recipe in
    `references/commands.md` → Reading the license code safely (guarded
    against an empty value; file names only; never the value). Any hit:
    name the files and repeat the options above. Also `git status --short --
    ios android` for folders that are neither tracked nor ignored (`git add .`
    would sweep them in).
- **If prebuild fails:** show the error plainly. Do not retry with `--clean`
  and do not loop.

### Apply step C — `pod install` (iOS, macOS only, only when needed)

- **Offer only when** iOS is integrated, the machine is macOS, `ios/` exists
  after apply step B, and the install is needed to confirm iOS (the `Podfile.lock`
  check). It sits in Init's one approval message. If `pod` isn't installed,
  say so and stop — never install tools. If the client struck it, give them
  the command and mark the iOS pod check *pending*.
- **Command:** `cd ios && pod install`, prefixed with
  `WEBENGAGE_DISABLE_SPM=true` when static linkage is on for any reason
  (`useFrameworks: 'static'` in the resolved config — In-Line turns it on, the
  client's own config may too; Rich Push and Inbox do not turn it on by
  themselves). It is needed on **every** later CocoaPods run too — tell the
  client to keep it set for their own `pod install` / `expo run:ios`.
  Prebuild runs with `--no-install`, so on an existing `ios/` this step is
  required for pods; switching static linkage on or off in an existing `ios/`
  also needs it.
- **Say (⚠️, one line):** it needs network and can take minutes; a CDN or
  `hermes-engine` download timeout is common — show the error, don't retry
  blindly. It writes `ios/Pods/` and `ios/Podfile.lock` (tracked if `ios/`
  is tracked).
- **Post-check:** `ios/Podfile.lock` lists `react-native-webengage`, and
  `WebEngage` is present either as a pod there or — only when static
  linkage is **off** (the default; SPM linkage) — as an SPM package
  reference in the Xcode project. **When static linkage is on, SPM is the
  failure case:** require real pods (`WebEngage`, plus `WEPersonalization` /
  `WENotificationInbox` where those packages are installed) in `Podfile.lock`. Part of the iOS Init-complete check; *not yet verified
  on a real run*. If the client struck this step, the pod check is
  *pending* and iOS stays *configured — not yet applied* until they report
  it. On a machine that isn't macOS, prebuild does not generate `ios/`: iOS
  stays pending and Android can still complete (per platform).

### Hand-Written WebEngage Init in Committed Native Folders

For a project whose `ios/`/`android/` are committed **and** contain a
hand-written WebEngage init (`WebEngageActivityLifeCycleCallbacks`,
`WEGWebEngageBridge`, `autoRegister` in `MainApplication`/`AppDelegate`).
**Surface it and explain it — the skill does not regenerate the
folders.** Lead with the concern (Core Rule 24):

> ⚠️ **Your native folders already initialize WebEngage by hand, and the
> plugin adds a second init.** Two inits can double-register push and
> callbacks. The plugin supplies the single init, so the hand-written one
> has to go; the clean way is to regenerate the folders.
> ⚠️ `npx expo prebuild --clean` deletes and regenerates `ios/` and
> `android/` — **every hand edit in them is lost, not only WebEngage's.**
> **Recommended:** regenerate, after moving your own native customisations
> into Expo config.
> **Impact on your code:** this skill changes none of your native files;
> you run the command.

What the skill *can* do, read-only, to help the client decide:
1. **Find what else is customised.** Find the commit that introduced the
   native folders (`git log --diff-filter=A --format='%h %s' --
   android/app/build.gradle` — ideally a "prebuild" commit made before any
   WebEngage work) and diff against it: `git diff <commit> HEAD -- ios
   android`. Everything in that diff that is *not* WebEngage is a
   customisation the client would lose. *(If no pristine commit exists, say
   so and ask the client to review `git diff` of the native folders by
   eye — never guess.)*
2. **Say what has a config equivalent**, so the client can move it before
   cleaning — for example permissions become
   `android.permissions`/`ios.infoPlist`. Anything with no config
   equivalent is listed for the client to decide.

**Mention Continuous Native Generation (optional).** Git-ignoring `ios/`
and `android/` removes this whole class of problem, at the cost that no
hand edit in those folders survives a prebuild. Advice only — the client's
`.gitignore` is theirs (Core Rule 7).

## Build and Run — the Client's Steps

The apply steps above only generate native projects. **Building and running
the app is the client's job — this skill never does it** (Core Rule 22).
Tell the client what to run, based on what Pre-Flight found:

| Native-folder state (Pre-Flight) | What to tell the client |
|---|---|
| **CNG** (`ios/`/`android/` git-ignored, or absent) | `npx expo run:ios` / `npx expo run:android` (they prebuild implicitly), or `eas build` for a cloud build (EAS prebuilds itself; it uses their EAS account and quota). |
| **Prebuilt-and-kept** (committed native folders) | The same commands; after a plain `npx expo prebuild` merge, `npx expo run:*` builds the merged projects. If they hold a hand-written WebEngage init, read "Hand-Written WebEngage Init in Committed Native Folders" first. ⚠️ Never suggest `--clean` without saying what it deletes. |
| **Expo Go only** | Cannot run WebEngage at all. They need a development build — `expo-dev-client` plus `npx expo run:*` or `eas build`. |
| **A physical iPhone** | `npx expo run:ios --device` with their Apple team set for signing (`devTeam`, or Xcode's Signing & Capabilities); push needs a real device. The skill never runs it — hand it over once (`references/commands.md`). The console is Xcode's (Window → Devices and Simulators → Open Console). |

**On iOS (macOS), `cd ios && pod install` must have run before a local build** — if the skill didn't run it (apply step C), tell the client the command, with the env prefix.

**After adding or changing `.env` or `app.config.js`, restart any dev server
(Metro) that is already running** — it reads the environment when it starts,
so a server started earlier keeps the old values. It is the client's process;
this skill doesn't stop it.

**The license code is read when native code is generated, not when the
JavaScript bundle loads.** A build made without `WEBENGAGE_LICENSE_CODE`
still builds and runs, but WebEngage doesn't start; the config prints a
warning (`WEBENGAGE_LICENSE_CODE is not set`) naming the fix. Tell the
client: set it in `.env` (or as an EAS variable) and rebuild. A *production*
build without it fails on purpose, with the same message — shipping without
the key would silently send nothing.

**When a new native build is required** — tell the client plainly:
any change to the WebEngage plugin configuration, native dependencies,
or native configuration. **OTA updates (Expo Updates) deliver
JavaScript only** — a change that requires the native SDK or native
project configuration to change cannot ship that way.

## Verify Integration — The Client's Step, Not the Skill's

This skill does not build, launch, or run the app, and it never reads a
device's logs itself (Core Rule 22). After the client has run a native
build (see "Build and Run — the Client's Steps"), tell them how to confirm Init
worked and what each result means. **Confirm success from native logs,
not JS console output.** JS-side `console.log` only reflects the bridge's
JS layer — it can look fine while the native SDK failed to initialize
(wrong license code, wrong environment). With debug on:

- **Android:** `adb logcat -d -s WebEngage` (the SDK logs under the tag
  `WebEngage`; a plain text search for "webengage" also matches package
  names and floods the output) and look for the line containing
  `Successfully Initialized` — it reads ` WEInspector WebEngage
  Successfully Initialized`.
- **iOS — the Xcode console, with `WEGLogLevel: VERBOSE`.** A healthy
  start printed these three lines on a physical iPhone (Expo SDK 55,
  observed 2026-10-16):
  - `[WEGManager verifySDKIntegration] Verification complete. WebEngage SDK initiated.`
  - `[WebEngage application:didFinishLaunching…] WebEngage SDK Initialized`
  - `[WEGManager init] WebEngage App Group configured`

  Search the console for `WebEngage` or `WEG`. To read the simulator's log
  from a terminal (the client's to run, not the skill's — Core Rule 22), filter by **process**, not by message text, and don't cut
  the output short — a truncated capture looks exactly like a missing line:
  `xcrun simctl spawn booted log show --last 3m --style compact --predicate 'process == "<AppName>"' | grep -i -E "WEG|WebEngage"`.
  The official docs name `WebEngage SDK Initialized`; the other two lines
  are observed, not documented, so a build that
  prints other WebEngage startup lines (for example `WEGLocationManager
  Instance created`) but not these still started the SDK — say so rather
  than calling it a failure. **Live Users on the dashboard stays the
  confirmation that data is arriving** (below).

**Known-benign log lines on a healthy init** — tell the client not to
treat these as failures:
- `E WebEngage: Unable to initialize location module. Please use
  play-services-location version 21.0.1 or higher` — matters only if the
  client wants location/geofence features.
- `Returning no-op implementation of WebEngage` and an empty
  `Current token FCM:` — expected before Push is set up.
- iOS (observed on a device, not documented by WebEngage — none is an init failure):
  `Error committing transaction: cannot commit - no transaction is
  active` (12 times in one device log while events kept syncing with
  status 200); `Skipped writing data because of no suitable options` (the
  value didn't change); `Notification Page Rule Failed` / `Session Rule
  Failed` (an in-app campaign's rule didn't match); `…coretelephony.xpc was
  invalidated` and a UIKit button-bar constraint warning (device noise);
  and `objc: Class RCTSwiftUI… is implemented in both React.framework and
  <App>.debug.dylib` (a React Native / Expo debug-build duplication, not
  WebEngage — don't chase it).

If the client can't read Logcat/Xcode — and always for iOS — the
dashboard is the confirmation: **WebEngage Dashboard → Users → Live
Users** should show an active session, and Data Platform → Integrations
shows the SDK setup status as `success`, within a few minutes. Before
trusting any dashboard-side data, confirm the account's license code
matches the project's — an account for a different license says nothing
about this app.

**The skill records what the client reports, nothing more** — "native
build: pending / client confirmed", "Android init line: seen / not seen",
"Live Users: confirmed / pending". It never marks a platform verified on
its own (see Recording State).

## Init-Complete Message

Short — a few lines, plain words, no lists:

> WebEngage is set up and checked on *{Android / iOS / both}* — the plugin
> is applied, your license is in the generated native files, and the
> analytics wrapper is in place. It starts with the app, but your own
> login/logout, events and channels come next (*{per the chosen depth, e.g.
> "Quick: login and logout with a couple of attributes first — shall I
> start?"}*). Before that, build and run the app once to check it started
> (`npx expo run:android` or `run:ios`).

**Only after the prebuild post-checks pass on every chosen platform** (on
iOS that includes the `Podfile.lock` / SPM check once `pod install` ran; a
struck or impossible `pod install` leaves iOS pending). It is per platform —
name which is complete and which is pending. If
prebuild was declined, or a check failed, say
instead: "WebEngage is configured but not yet applied — *{what's missing and
the command to run}*. I'll mark Init complete once the generated files check
out." Record Init as *configured — not yet applied*, and don't start the next
Goal until the client picks: apply now, or proceed anyway (recorded as a
pending item).

Add only what applies, one short line each, from "Build and Run": on iOS,
the `pod install` command (with the env prefix when static linkage is on) if
it wasn't run; restart any running dev server after `.env` or config
changes; for a local release build, `APP_VARIANT=production`. If debug
logging was left on: "Debug logging is on for development builds — make
sure release builds stay quiet." If the depth
isn't recorded yet (an "init only" request), end with the depth question
instead of the "shall I start?".

## Recording State

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

Update `.webengage/agent.md`'s Locked Facts table with: the Init status per platform (*complete* — prebuild checks passed / *configured — not yet applied* — what is pending), platforms
integrated, license code *source* (the env var name/file, or "literal
in Expo config — client's choice", with its Known Risk entry — never the
code itself), region (both the iOS and Android value written), debug
mode, `react-native-webengage` and `webengage-expo` versions (declared
range and lockfile-resolved), Expo SDK version, Expo config file path
(and whether Init created `app.config.js`), native-folder state
(CNG / prebuilt-and-kept), build path used (EAS / local), language,
New Architecture status, the Analytics wrapper's file path, and what the
client has *reported* about the native build and verification — **per
platform** (native build: pending / client confirmed; Android init line:
seen / not seen; Live Users: confirmed / pending). Reported, never
inferred — this skill does not run or observe either. Also record the
apply steps (Apply the Plugin) — config check and prebuild:
each *run [date] / declined*; `pod install` — *run [date] /
declined (client runs it) / not applicable* (no iOS, no macOS) — and the per-platform native-folder state including how many
tracked native files there were. If Android is integrated: whether Install Referrer was added or struck by the client.
No separate `.webengage/init/` file is needed unless a later session
finds this Goal's state worth tracking in more detail.

## Hard Rules

1. **The `webengage-expo` plugin entry must use the explicit path form
   — `./node_modules/webengage-expo/src/withWebEngage.js` — and carry a
   config object.** `webengage-expo` 0.0.3 ships no `app.plugin.js` (confirm
   with `ls node_modules/webengage-expo/app.plugin.js` and the installed
   version before saying so — a newer release may), so a bare
   `"webengage-expo"` name cannot be resolved (Expo reports a different error
   for that — `references/troubleshooting.md`), and a string with no
   config object throws `"You are trying to use the WebEngage plugin
   without any props."` at prebuild. (`webengage-expo-push` is the
   opposite: it does ship `app.plugin.js`, so it *is* listed by its bare
   package name — see `references/channels/push.md`.)
2. **The `push` and `ios` blocks are mandatory, always — even for an
   Android-only integration — and `push.mode` must be set.** The plugin
   throws `"...without any push props"` / `"...without any ios props"` /
   `Missing required "mode" key...` otherwise. The `android` block is
   not enforced by a throw (only a console warning) but without its key
   and environment the Android SDK silently never initializes — treat it
   as mandatory whenever Android is integrated.
   **Single-platform projects:** the official page lists the android keys as
   required; omitting the `android` block on an iOS-only project is a
   deliberate deviation — the plugin only prints a warning, and
   `references/docs-alignment.md` records it. *Android-only* — keep the mandatory `push`
   and `ios` blocks (with the license and environment) and do not ask for
   `ios.bundleIdentifier`; it matters only when iOS is integrated. *iOS-only*
   — omit the `android` block.
3. **`push.mode` is `development` or `production`, and if
   `webengage-expo-push` is present its `mode` must equal it exactly.**
   Two different values for the same APNs environment produce
   mismatched entitlements between the main app and its extensions.
4. **Native changes take effect only through a new native build —
   never OTA, never Expo Go.** Writing or changing plugin config
   without a subsequent native build leaves the shipped app unchanged.
   State this plainly and offer the apply steps (Apply the Plugin), then
   tell the client what to run (Build and Run — the Client's Steps)
   rather than letting them assume saving `app.json` was the last step.
   Init itself is complete when the config is correct **and** the prebuild
   post-checks pass on every chosen platform (Core Rule 3); the build is the
   client's to run.
5. **No manual native edits and no second WebEngage init alongside the
   plugin's.** The plugin already initializes the native SDK
   unconditionally at Application/AppDelegate launch. A hand-written
   `WebEngageActivityLifeCycleCallbacks`/`autoRegister`/
   `WEGWebEngageBridge` call in a prebuilt-and-kept project's native
   source double-initializes. On a CNG project, edits to the generated
   folders are erased on the next prebuild. Surface it and explain the
   regeneration fix (Hand-Written WebEngage Init in Committed Native
   Folders) — the client runs it; this skill does not.

## Rules

- Recommend reading the license code from environment config (Core
  Rule 10) — a literal in `app.json` is a license code committed to the
  repository and defeats per-profile separation. **A recommendation, not
  a requirement:** if the client has no env mechanism and doesn't want
  one, use the literal and record it as a Known Risk. If Pre-Flight found
  another SDK hardcoding its own key, do not touch or comment on that
  SDK's config (Core Rule 9).
- Do NOT add push, callbacks, or tracking in this Goal — that's
  Engagement Channels' and Tracking Events'/Tracking User's work.
- Recommend the latest `react-native-webengage`/`webengage-expo` (see
  Questions → Version).
- Add the Install Referrer dependency on Android (see "Android Install
  Referrer"). A client who strikes it only loses that reporting; not a Hard
  Rule, no Known Risk entry required, but record the decision.
- Tie debug logging to a build variant (the default — see Questions) rather than
  leaving `VERBOSE`/`debug: true` in production builds.
- An Expo SDK upgrade (see Old Project) is the client's own project
  work — this skill neither performs it nor folds it into Init.
- Create the wrapper **with its safety guard** (Core Rule 26), and keep the
  license guard a warning except for a production build
  (`references/safety.md` §7). An existing wrapper without the guard is
  offered the guard as one small change-list item — never rewritten.

## Audit Checks

Checks 2–6 and 9 are Hard-Rule-derived or plain technical correctness —
any violation found is always a real issue; no Known Risk entry excuses
it (per `references/rules.md` → How Audit Interprets a Found Violation).

1. **License code present on every integrated platform** — `ios.
   WEGLicenseCode` and `android.manifest['com.webengage.sdk.android.
   key']` both non-empty. *Presence* is Hard-Rule-grade — an empty or
   `undefined` value means the SDK never initializes. *Sourcing* is
   Rule-derived and optional (Core Rule 10): a literal in committed
   config is informational if a Known Risk records the client's choice,
   and a minor note (not a real issue) if the client simply never used
   an env mechanism — never a blocker.
2. **Environment matches the data center** — if the dashboard URL is
   not `dashboard.webengage.com`, both the iOS value (`IN`/`KSA`/`EUG`)
   and the Android value (`in`/`ksa`/`eug`) are set and correspond to
   the same region. US needs `DEFAULT`/`us` (or the key's default).
3. **Plugin entry correct** — explicit path form with a config object,
   not a bare name (Hard Rule 1), in the Expo config actually loaded
   (`app.config.js` result, not just `app.json`).
4. **Mandatory blocks present** — `push.mode`, `ios` (key +
   environment), and, if Android is integrated, `android.manifest` (key
   + environment) (Hard Rule 2).
5. **`push.mode` consistent** — equal across `webengage-expo` and
   `webengage-expo-push` if both are present (Hard Rule 3).
6. **Generated native folders, if present, reflect the config** — the
   same read-only post-checks as Apply step B (non-empty license, matching
   environment and debug values, `aps-environment`, Install Referrer). At
   audit time a mismatch is a finding, not a failure: if the folders don't
   contain the config, a prebuild hasn't run since it was written (or a
   kept `android/` folder holds old values — the plugin never overwrites
   them), so say so and repeat what to run. Absent folders on a CNG project
   are normal at audit time. Init counts as *complete* only after the
   approved prebuild and these checks pass (Core Rule 3); until then it is
   *configured — not yet applied*.
7. **The Analytics wrapper's `init()` calling `webengage.initialize()`
   or omitting it** — Rule-derived: confirmed inert on both platforms,
   so its absence has no runtime effect. Informational if a Known Risk
   records the choice to omit it, otherwise a minor note, never a
   blocker.
8. **Analytics wrapper file exists, lives outside Expo Router's `app/`
   directory, and the app's root delegates to its `init()`** rather
   than calling `webengage.initialize()` inline — Rule-derived;
   informational if backed by a Known Risk, a real issue otherwise.
   (A wrapper *inside* `app/` is a real bug regardless — it becomes a
   route.)
9. **No second native init** (Hard Rule 5) — no
   `WebEngageActivityLifeCycleCallbacks`/`autoRegister`/
   `WEGWebEngageBridge` in the project's native source alongside the
   plugin. Hard-Rule-derived.
10. **Installed versions meet the floors and match latest-on-npm, or a
    Known Risk records why not** — `react-native-webengage` ≥ v2.0.0
    (a Hard-Rule-grade floor), and latest for each WebEngage package is
    Rule-derived; keyed off the lockfile-resolved version, not the
    `package.json` range.
11. **Declared range vs. lockfile-resolved version, if they differ** —
    never a violation; surface informationally (the version recorded in
    `.webengage/agent.md` may be stale relative to what's running).
12. **If Android is integrated: the Install Referrer dependency is
    present** (the local plugin is registered and the generated
    `build.gradle` has it), unless the client struck it. Rule-derived:
    informational if declined on record, a real issue if never offered.
13. **If multi-app license support was confirmed:** `WEGAlternateAppSupport:
    true` is present in the plugin's `ios` block.
14. **No tracked file holds the license code when it is env-sourced**
    (Core Rule 10) — `git grep -l -F -- "$WEBENGAGE_LICENSE_CODE"` with the
    value loaded from `.env` into the shell variable: file names only,
    never the value. A hit in a tracked native file (the generated manifest
    or `Info.plist` of a prebuilt-and-kept or "ignored but tracked" folder)
    means the literal is, or is about to be, committed. Rule-derived:
    informational if a Known Risk records the client's choice, otherwise a
    real issue — surface it with the options (stop tracking the folder,
    accept the literal, avoid staging that file). Not applicable when the
    literal-in-config form was chosen (it already has its Known Risk).
15. **The wrapper has its safety guard** (Core Rule 26) — the file defines
    `createGuardedWebEngage()` (try/catch around every SDK call and every
    handler, a silent no-op when `webengageAvailable` is false, development-only
    warnings) and the wrapper's SDK handle comes from it — Rule-derived;
    informational if a Known Risk records the client's choice, otherwise a real
    issue (an unguarded wrapper can throw into app code). Not a check that the
    guard *works* — it has not been run on a device
    (`references/compatibility.md`).
16. **The license guard in `app.config.js` warns, and throws only for a
    production build** — a `throw` on `prebuild`, `run:*`, or every missing
    key would break a teammate's checkout or a running dev server
    (`references/safety.md` §7). Rule-derived; informational if a Known Risk
    records the client's own guard.
