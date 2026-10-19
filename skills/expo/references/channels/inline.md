# Goal: Engagement Channel Integration — In-Line Content

**Prerequisite:** Init complete. Screen Tracking (shared reference,
`references/channels/screen-tracking.md`) is **mandatory** here — not
optional the way it is for In-App.

**Input from Pre-Flight:** screens list, navigation mechanism, and
whichever propertyId↔screen mappings a prior session already recorded
in `.webengage/channels/screen-tracking.md` — do not rescan.

**Order of this Goal (Core Rule 25):** one change list, applied install →
config → code — `react-native-we-personalization` and `expo-build-properties`
(asked together, one line saying what each is for), the iOS static-linkage
build property, the `eas.json` `WEBENGAGE_DISABLE_SPM` entry for EAS builds,
then the widget and Screen Tracking code, added together. Approval is one
message: this change list plus the apply commands (`references/init.md` →
Apply the Plugin). A rebuild is needed for the linkage; until then the
guarded code (`webengageAvailable`, `safeCall` — `references/wrapper.md`)
keeps the app running — except the widget itself, see Hard Rule 14.

## Start From What's Already There

Before asking anything, use what Pre-Flight found — privately; none of it
is reported to the client:

- **Already in place and correct** — reuse it and go straight to the Goal
  the client wants. Say nothing about it.
- **Previously done, now missing** (e.g. a refactor removed a
  `deregisterWEPlaceholderCallback` call, or a screen's `webengage.screen()`
  call) — it is just a to-do: restore it as part of the change list, in plain
  words.
- **Found integrated with no `.webengage/` record** (`react-native-we-personalization`
  in `package.json`, real `WEInlineWidget`/`WEPlaceholderCallback` usage,
  never touched by this skill) — treat it as the starting point and use this
  Goal's Audit Checks as your private checklist: is Screen Tracking
  correctly gated (not just present) for each screen a placement uses, do
  `WEInlineWidget` instances hide until `onRendered` and declare explicit
  `style` dimensions, is `iosPropertyId` a genuine integer, do Custom and
  Data-only placements wire `trackImpression`/`trackClick`. Whatever is
  missing or wrong goes on the change list; record what exists (mechanism
  per placement, `propertyId` mappings, the "X of 3" features-in-use
  summary) when this Goal starts.
- **Not yet done** — proceed with Step 0 below.

## What In-Line Content Is

A separate child SDK (`react-native-we-personalization`) that lets a
WebEngage campaign render **inside** a screen's own layout — a banner,
a text block, or a fully custom view slotted into wherever the app's
UI puts it — rather than as an overlay (In-App) or a system
notification (Push). The app declares *where* content can appear (a
`propertyId`, created on the WebEngage dashboard first); WebEngage
decides *what* shows there and *when*, driven by targeting/segmentation,
the same way a campaign decides which users see an In-App message.

Three mechanisms in total — track which of these three a client
actually ends up using, it matters for both this Goal's scope and for
`Goal: Audit`'s report later:

1. **`WEInlineWidget`** — a component you drop into the screen; the SDK
   draws a Banner or Text campaign into it automatically. Zero
   rendering code. *Example: a promo banner on the Home screen that
   WebEngage's dashboard controls entirely — swap the campaign,
   nothing in the app changes.*
2. **`WEPlaceholderCallback`** — you own the rendering entirely; the SDK
   just tells your callback what data arrived. Needed for a Custom View
   campaign (the SDK never draws a Custom View for you), a Data-only
   campaign (nothing to render, just data), or when the identifier
   isn't known until runtime (an API response, app logic). *Example: a
   product-recommendation card whose exact layout the app controls,
   populated with WebEngage-selected product data.*
3. **`WECampaignCallback`** — a separate, more advanced, opt-in-only
   mechanism giving app-wide lifecycle visibility
   (prepared/shown/clicked/failed) across placements' campaigns at once
   (see the caveat under "Optional: `WECampaignCallback`" about Custom
   View and Data-only placements).
   *Example: logging every In-Line campaign shown across the whole app
   to an analytics dashboard, in one place, without instrumenting each
   placement individually.* Covered at the end of this file, never
   bundled into either mechanism above by default.

## Step 0 — Where (and, Under Full Depth, How)

**Depth is read, never asked** (`references/depth.md` → Integration Depth — Asked Once, Core Rule 23; check `Depth overrides` for In-Line in
`.webengage/agent.md` first). It decides the mechanism, so the only
question left is *where*, asked before any setup work:

> Which screen(s) should show In-Line content, and roughly where on each
> (a specific card or section)? If you haven't created the placements
> on the dashboard yet, I'll propose the `propertyId`s (for example
> `home_banner` on Android and `1001` on iOS) for you to create there; if you
> already have them, send me those.

Propose the `propertyId`s yourself when the client has none (Android: a
readable string such as `home_banner`; iOS: an integer above 1000 such as
`1001`, which New Architecture requires — Hard Rule 13) and state them in the
approval; a missing id is a pending dashboard step, not a blocking question.

- **Quick depth** — every placement uses `WEInlineWidget` (the SDK
  renders a Banner or Text campaign automatically, no rendering code).
  State it in one line: *"Using **Quick** depth, chosen earlier —
  `WEInlineWidget` for every placement."* If no depth is recorded yet,
  run the depth question (`references/depth.md`) first.
- **Full depth** — `WEInlineWidget` stays the default for every placement.
  Add to the same message the one line "tell me if any placement needs
  custom rendering (a Custom View, a Data-only campaign, or an id only known
  at runtime) — those use `WEPlaceholderCallback`." It can differ per
  placement, so don't commit a whole screen to one mechanism prematurely.

Record the screen→propertyId mapping into the shared
`screen-tracking.md` Recording State table (its `propertyId(s)`
column) — that table is where this lives, not a separate one here.

## Step 1 — Personalization SDK Setup (Required Regardless of Scope)

**Installing this package always needs an explicit ask first, every
time — per Core Rule 21** (an optional, scope-expanding feature package,
not core work). Ask for it **together with `expo-build-properties`** (if
that is missing) in one short message saying what each is for —
`react-native-we-personalization` draws the In-Line content,
`expo-build-properties` lets the Expo config turn on static linking — then
send the one approval message.

```shell
npm install react-native-we-personalization@latest      # or yarn add / pnpm add / bun add — always @latest
```

**iOS needs static framework linkage — Android needs nothing.** This
package ships Swift with `DEFINES_MODULE`, which requires static
framework linkage on iOS. **On Expo that is a build property, never a
hand-edited `Podfile`** (`SKILL.md` → Scope): Expo's first-party
`expo-build-properties` config plugin sets it.

```javascript
// Expo config — plugins array
['expo-build-properties', { ios: { useFrameworks: 'static' } }],
```

- `expo-build-properties` is a separate Expo package — if it isn't
  installed, **ask first (Core Rule 21)**: `npx expo install
  expo-build-properties`. State what it's for: it lets the Expo config
  set native build options, and here it's used only to turn on static
  linking for the iOS pods.
- **If the app already has an `expo-build-properties` entry**, add
  `useFrameworks: 'static'` inside its *existing* `ios` object — never a
  second entry. **If `useFrameworks` is already set** (another library
  commonly requires it), nothing to do — and if it's set to `'dynamic'`,
  that's a conflict to surface to the client, not silently change.
- Like every plugin change, it takes effect only with a new native build:
  the apply steps (config check, prebuild, `pod install`) are in this Goal's
  one approval, and the client runs the build.

**Once static linkage is on for ANY reason (`useFrameworks: 'static'` in the
resolved config — In-Line turns it on, the client's own config may too),
`WEBENGAGE_DISABLE_SPM=true` must be in the environment of **every**
CocoaPods run, or the app will build fine and crash at launch. A later
`expo run:ios` or prebuild by the client without it brings the crash back —
say so in one line:**

- **EAS Build:** add `"WEBENGAGE_DISABLE_SPM": "true"` to the build
  profile's `env` block in `eas.json`.
- **Local builds (`expo prebuild` / `expo run:ios`):** export
  `WEBENGAGE_DISABLE_SPM=true` in the shell (or the client's existing
  env mechanism) for the command that triggers CocoaPods. When
  this skill runs `pod install` (Init → Apply the Plugin, apply step C), it
  prefixes the variable and says so in the ask; when it hands the command
  to the client, include the variable.

This forces all three WebEngage podspecs onto their plain-CocoaPods
fallback, which does get embedded correctly. When static linkage is on,
the apply-step-C post-check requires real pods — `WebEngage`,
`WEPersonalization` (and `WENotificationInbox` if Inbox is installed) listed in
`ios/Podfile.lock` — not an SPM package reference; an SPM resolution here is
exactly the failure case. If Rich Push or Inbox already set this up there's
nothing further to do — it is the same requirement either way. Android: autolinking handles everything at prebuild — no manual
`settings.gradle`/`build.gradle` edit.

**The guarded helper file.** Core Rule 26 applies here too, but this
package's exports are not methods on the wrapper — so they get a small helper
file of their own that exports them **by the same names**, each under the same
contract (a silent no-op on web and in Expo Go, errors caught and shown in
development only; the widget renders nothing where the package isn't
available). Every call site below imports from this file instead of from the
package, so nothing else in the snippets changes. It uses `guardArgs`,
`safeCall` and `webengageAvailable` from the wrapper file
(`references/wrapper.md`):

```typescript
// src/analytics/webengagePersonalization.ts
import React from 'react';
import { guardArgs, safeCall, webengageAvailable } from './WebEngageManager';

type Pkg = typeof import('react-native-we-personalization');

// Required lazily so importing this file never throws where the native module
// is missing (web, Expo Go).
let pkg: Pkg | null = null;
if (webengageAvailable) {
  try {
    pkg = require('react-native-we-personalization');
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] personalization package unavailable:', e);
  }
}

// Renders nothing where the package isn't available — and nothing if the native
// view is missing (JS updated, app not rebuilt): an error boundary catches the
// render error that safeCall cannot, because it happens inside React.
class WidgetBoundary extends React.Component<{ children?: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
const PkgWidget = pkg?.WEInlineWidget as any;
export const WEInlineWidget = ((props: any) =>
  PkgWidget ? React.createElement(WidgetBoundary, null, React.createElement(PkgWidget, props)) : null
) as Pkg['WEInlineWidget'];

// Fire-and-forget: errors are caught and shown in development only.
const run = (where: string, fn: (p: Pkg) => unknown): void => {
  void safeCall(where, () => (pkg ? fn(pkg) : undefined), undefined);
};

export const initWePersonalization = () =>
  run('personalization.init', (p) => p.initWePersonalization());
export const enableDevMode = () =>
  run('personalization.devMode', (p) => p.enableDevMode());
export const registerWEPlaceholderCallback = (...args: any[]) =>
  run('personalization.register', (p) =>
    (p.registerWEPlaceholderCallback as any)(...guardArgs('personalization.register', args))
  );
export const deregisterWEPlaceholderCallback = (...args: any[]) =>
  run('personalization.deregister', (p) => (p.deregisterWEPlaceholderCallback as any)(...args));
export const trackImpression = (...args: any[]) =>
  run('personalization.impression', (p) => (p.trackImpression as any)(...args));
export const trackClick = (...args: any[]) =>
  run('personalization.click', (p) => (p.trackClick as any)(...args));
```

In a plain-JavaScript project drop the types (`typeof import(...)`, `as`,
`: any[]`, `: Pkg`) and keep the rest. **Props handed to `WEInlineWidget`
(`onRendered`, `onDataReceived`, …) are the app's own handlers, called by the
native view — keep them small and don't let them throw.**

Call `initWePersonalization()` once, in the same app-bootstrap mount
effect as `WebEngageManager.init()` — there's no real ordering
dependency between the two calls. `webengage.initialize()` is a
confirmed no-op on Android and, on iOS, only re-sets a JWT-invalidated
callback that native `AppDelegate` init already sets during app launch
(see Core Rule 3) — nothing in this package's own native module reads
or depends on that call having run. Keeping them in the same effect is
code-organization convenience, not a correctness requirement. **Wire
`enableDevMode()` to the same debug-mode source Init already
established** (`references/init.md`'s debug-mode default —
build-variant-driven, or dev-only/prod-only if the client chose that) rather than treating it as a separate, unasked
decision — it's a different switch (this package's own JS-layer logs,
not the core SDK's native debug mode), but there's no reason to ask
about it twice when the client already told you which builds should be
verbose:

```typescript
// app/_layout.tsx (or App.tsx) — same mount effect as WebEngageManager.init()
import { initWePersonalization, enableDevMode } from '../src/analytics/webengagePersonalization'; // the helper file above — adjust the path

useEffect(() => {
  WebEngageManager.init();
  initWePersonalization();
  if (__DEV__) { // or whatever build-variant check Init's debug-mode answer resolved to
    enableDevMode();
  }
  // ...
}, []);
```

**Version floor is murky — don't overstate it as precise.** The
package's own docs say "Supported from React Native SDK v1.3.0" without
ever naming which package that refers to (not tied to
`react-native-webengage` or `react-native-we-personalization`
explicitly, in either the doc or the package's own `peerDependencies` —
there is in fact no `peerDependencies` entry on `react-native-webengage`
at all). Recommend checking the current release on npm rather than
treating "v1.3.0" as an exact, enforceable gate. **New Architecture
support is a separate, explicitly-named, higher floor: both
`react-native-webengage` and `react-native-we-personalization` at
v2.0.0+** — this one is stated plainly and consistently, unlike the
murkier v1.3.0 figure.

## Step 2 — Screen Tracking (Mandatory, Not a Question Here)

Cross-reference `references/channels/screen-tracking.md` — its
"Optional vs. Mandatory" section already states why this is
non-negotiable for In-Line (both building blocks below resolve
entirely through whatever `webengage.screen()` last reported).
**Confirm coverage for every screen this session's placements use
before proceeding to Step 3** — do not instrument a placement on a
screen that doesn't call `webengage.screen()` yet; set that up first.

## Step 3 — The Building Blocks

### `WEInlineWidget` (Quick Integration)

**Hidden by default until `onRendered` fires — never mounted "visible"
from the start.** `WEInlineWidget` has zero built-in visibility logic —
it unconditionally renders the native view on every render regardless
of whether a campaign exists, succeeded, or failed, and `style` has no
built-in height/width fallback either. Left to its own devices, a client who gives it a
fixed height gets a permanently visible empty box whenever no active
campaign matches — not a rare edge case, but the default state for any
screen without a currently-running campaign. Wrap it in state that
starts hidden and only reveals on `onRendered` (the strongest signal —
actual visual content confirmed drawn; `onDataReceived` firing doesn't
guarantee the render itself succeeded), and re-hides on
`onPlaceholderException`:

```typescript
import { useState } from 'react';
import { View } from 'react-native';
import { WEInlineWidget } from '../src/analytics/webengagePersonalization'; // the helper above, not the package

function HomeBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [width, setWidth] = useState(0); // measured, never '100%' — see Hard Rule 10

  return (
    // This wrapper's own width is fine as '100%' (it's a plain RN View,
    // not WEInlineWidget itself) — it exists only to measure the real
    // pixel width via onLayout.
    <View style={styles.measureWrapper} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <View style={isVisible ? styles.bannerVisible : styles.bannerHidden}>
          <WEInlineWidget
            androidPropertyId="home_banner"
            iosPropertyId={12345} // genuine integer, and >1000 on New Architecture — see the Hard Rules below
            screenName="Home Screen"
            style={{ height: 120, width }} // both plain numbers — see Hard Rule 10
            onDataReceived={(data) => { /* optional — react to data arriving */ }}
            onRendered={() => setIsVisible(true)}
            onPlaceholderException={(error) => setIsVisible(false)} // required — see Hard Rules
          />
        </View>
      )}
    </View>
  );
}

const styles = {
  measureWrapper: { width: '100%' },
  bannerVisible: { height: 120 },
  bannerHidden: { height: 0, overflow: 'hidden' },
};
```

**`androidPropertyId` is a string; `iosPropertyId` is a number — this
is not runtime-validated anywhere in the JS layer, and `iosPropertyId`
must be a genuine integer, not a coerced string or float.** Only
truthiness checks exist (`if (!androidPropertyId && !iosPropertyId)`),
no `typeof` or numeric check — and on iOS the value is turned into the
actual dispatch key via `String(iosPropertyId)`, so a non-integer
produces a malformed key silently rather than an error. Coerce
per-platform correctly (e.g. `parseInt(value, 10)` for iOS) before
passing either prop — do not feed the same coerced value into both
props identically, since that lands the wrong type on whichever
platform it wasn't coerced for.

**On a New Architecture (Fabric) app, also keep `iosPropertyId` above
1000** — see the Hard Rule below for why.

Renders Banner/Text campaigns only — a Custom View or Data-only
campaign is never drawn by this component; use `WEPlaceholderCallback`
for those.

### `WEPlaceholderCallback` (Full/Custom Integration)

No built-in empty-space risk here the way `WEInlineWidget` has — the
app owns rendering entirely, so nothing shows until *your* code
decides to render something, which only happens once `onDataReceived`
actually fires. That said, this still depends on the app's own
implementation genuinely gating render on that callback rather than
rendering a placeholder container unconditionally — the same principle
as `WEInlineWidget`'s Hard Rule, just enforced in the app's code
instead of the SDK's:

```typescript
import { useEffect } from 'react';
import { registerWEPlaceholderCallback, deregisterWEPlaceholderCallback, trackImpression, trackClick } from '../src/analytics/webengagePersonalization';

useEffect(() => {
  registerWEPlaceholderCallback(
    'product_recommendation', // androidPropertyId
    67890,                     // iosPropertyId
    'Product Details Screen',  // screenName
    (data) => {
      // Only after this fires: track the impression, then render your
      // own UI from `data`.
      trackImpression('product_recommendation', null);
    },
    (error) => { /* required to handle — see Hard Rules */ }
  );

  return () => {
    deregisterWEPlaceholderCallback('product_recommendation', 67890, 'Product Details Screen');
  };
}, []);

// On the user tapping your own custom-rendered view:
// trackClick('product_recommendation', null);
```

`trackImpression`/`trackClick` are **mandatory, not optional, for every
Custom View or Data-only placement** — omitting either means WebEngage
never records that data, silently. Both must be called only after
`onDataReceived` has actually fired.

## Hard Rules

1. **`webengage.screen()` must be called for a screen before any
   In-Line building block mounts or registers on it — never after.**
   *(Unverified for the first render: the recommended container-level
   hooks fire just after a screen mounts, and the widget also takes its own
   `screenName` prop. Test that content appears on the launch screen and on
   a newly opened screen — TEST-PLAN F5 — and if it doesn't, call
   `trackScreen()` earlier for those screens.)*
   Both `WEInlineWidget` and `WEPlaceholderCallback` resolve entirely
   through the SDK's current screen context; registering first and
   calling `screen()` after leaves the placement with nothing to
   resolve against.
2. **Never have more than one screen's In-Line content mounted/
   registered at once without deregistering the earlier one first —
   this silently breaks the earlier screen, not just the new one.**
   Both `WEInlineWidget` and `WEPlaceholderCallback` dispatch through
   their own internal list of registered screens, and each one's dispatch
   function only ever resolves against the *last* entry in its own
   list. A widget or callback on an older, still-mounted screen goes
   silently dead the instant a new screen registers — no error, no
   warning outside dev mode. **This isn't only a read-side problem:**
   re-registering for a screen that's already in the list (not the
   last entry) silently writes into whatever screen currently happens
   to be last, not into that screen's own existing entry — so even a
   legitimate re-registration for an *existing* screen can misattribute
   into the wrong one. `WEInlineWidget` and `WEPlaceholderCallback`
   maintain two structurally separate lists, so this applies
   independently to each — a widget and a callback on different
   screens don't interfere with each other, but two widgets (or two
   callbacks) on two simultaneously-registered screens do.
   **Multiple `WEInlineWidget`s on the SAME screen are fine and
   unaffected by this bug:** as long as no *other* screen registers in
   between, they merge into the same
   screen's list entry, and dispatch discriminates by `propertyId`
   within it correctly. This bug is specifically about multiple
   *different* screens being simultaneously registered, never about
   multiple placements on one screen.
3. **`trackImpression()`/`trackClick()` are mandatory for every Custom
   View or Data-only placement, called only after `onDataReceived`
   fires** — omitting either means that placement's impression/click
   data is never recorded, with no error to signal it.
4. **`propertyId` values in code must exactly match the placeholder
   name created on the WebEngage dashboard** — a mismatch means the
   SDK has nothing to resolve against for that placement.
5. **Always handle `onPlaceholderException`** (and `onCampaignException`
   if `WECampaignCallback` is in use) — hide the view or show a
   fallback; never leave it unhandled. **Why this matters beyond "an
   error was swallowed":** an unhandled exception combined with
   `WEInlineWidget`'s lack of built-in visibility logic (Hard Rule 9
   below) means the failure mode isn't a crash or a log line — it's a
   permanently visible empty box exactly like the no-campaign case,
   indistinguishable from a bug in the app itself. **How:** in the
   `WEInlineWidget` pattern above, the exception handler sets the same
   `isVisible` state back to `false`; in a `WEPlaceholderCallback`
   pattern, it means not rendering whatever partial UI the app might
   have started building from a previous `onDataReceived` call.
6. **Only one `WECampaignCallback` registration is live SDK-wide at a
   time.** A second `registerWECampaignCallback()` call while one is
   already live is a silent no-op — no error, not even a log unless
   `enableDevMode()` is on. Always pair it with
   `deregisterWECampaignCallback()` in the same component's unmount
   cleanup.
7. **`WEPlaceholderCallback` has no auto-unregister on unmount, ever,
   on React Native** — unlike Android (v1.1.0+). Manual deregistration
   in a cleanup effect is permanently required, not "the safer default
   until a version confirms otherwise."
8. **iOS requires static framework linkage (on Expo:
   `expo-build-properties` → `ios.useFrameworks: 'static'`); Android
   requires no manual native change at all.** Don't treat "no native
   integration" as true for both platforms — it's Android-only.
9. **`WEInlineWidget` must start hidden (zero-size or not rendered)
    and only reveal on `onRendered`, re-hiding on
    `onPlaceholderException`.** The component has no built-in
    visibility logic at all, so this is the
    app's responsibility entirely, not a fallback for a rare failure
    case — the default, no-campaign state is exactly what needs
    hiding, every time.
10. **`WEInlineWidget`'s `style` prop must set `height` and `width` to
    plain numbers (pixel values) — never a percentage string, and
    never omitted.** On Android, `WEPersonalizationView`'s own
    `ViewManager` captures `height`/`width` as a native, Int-typed prop
    pair — not just Yoga layout — because the native SDK manually
    measures and lays out the ad content using that exact pixel value.
    A string like `'100%'` can't coerce into that setter and crashes
    at mount:
    ```
    JSApplicationIllegalArgumentException: Error while updating
    property 'width' of a view managed by: WEPersonalizationView
    ```
    **Omitting `width` instead (e.g. relying on `alignSelf: 'stretch'`
    alone) is not a safe workaround** — it silences the crash, but the
    native view's cached width stays permanently `0`, so the ad
    content silently renders at near-zero width instead of failing
    loudly. **To fill the parent's width:** measure it via `onLayout`
    on a wrapper `View` and pass the resulting number down — see the
    updated example in Step 3 above.
11. **`iosPropertyId` must be passed as a genuine integer, never a
    string or float coerced at the call site** — silently becomes a
    malformed dispatch key otherwise (see Step 3), with no error to
    signal the mismatch.
12. **Never register both `WEInlineWidget` and `WEPlaceholderCallback`
    for the same `propertyId`** — once a callback registers for a
    property, the SDK treats it as callback-only, silently breaking
    that property's auto-rendering from `WEInlineWidget` from that
    point on. The same restriction applies as on native Android. Pick
    exactly one mechanism per `propertyId` — a widget on one property and a
    placeholder callback on a *different* property on the same screen is
    fine; both on the *same* property is not. `WECampaignCallback` is
    unaffected by this — it's a separate, additive, global mechanism
    that coexists with either one.
13. **On an app with New Architecture (Fabric) enabled, `WEInlineWidget`
    campaigns using an `iosPropertyId` below 1000 can render into the
    wrong place** — as a full-screen overlay, or attached onto an
    unrelated existing UI element (e.g. replacing a button), instead of
    inside the widget's own bounds. Fabric assigns its own low,
    sequential identifiers to views on screen internally, and a low
    `iosPropertyId` can collide with one of them. **Keep every
    `iosPropertyId` above 1000** when the client is creating placements
    on the WebEngage dashboard, for any app that has New Architecture
    enabled (check Pre-Flight's New Architecture finding — see
    `references/pre-flight.md`'s Locked Facts — before this placement is
    created). This is iOS-specific — `androidPropertyId` is not affected
    by this, and on a Legacy Architecture app this isn't a documented
    issue either, so there's no need to hold a client to it there. If an
    existing placement is already using a low `iosPropertyId` on a New
    Architecture app, this is a Hard Rule violation to surface, not fix
    silently — the client will need to recreate that placement on the
    dashboard with a new `iosPropertyId` above 1000, since the ID isn't
    something the SDK or this skill can change after the fact.

14. **`WEInlineWidget` is always rendered through the helper's error
    boundary.** `safeCall` cannot catch a render error, so a build whose native
    view isn't there yet (JS updated, app not rebuilt) would crash the screen;
    the boundary makes it render nothing instead. *(Unverified on a device —
    TEST-PLAN F5.)*

If the client insists on an alternate implementation for any of the
above, do not implement it that way — record as a Known Risk.

## Optional: `WECampaignCallback` — Only If the Client Asks

Never offered. Add it only when the client names app-wide lifecycle
callbacks (prepared/shown/clicked/failed across every In-Line placement),
and then register it in the app-wide registration (`WebEngageManager` mount
effect) — no question about where it lives.

**Caveat — not yet verified on Expo:** the native in-line SDK renders
Banner and Text campaigns itself, so `onCampaignShown`/`onCampaignClicked`
are expected to reflect those SDK-rendered views only. For a Custom View
or Data-only placement the app does the rendering, so don't rely on those
two callbacks there — use `onDataReceived`, plus the mandatory
`trackImpression()`/`trackClick()`. `onCampaignPrepared` and
`onDataReceived` are expected to fire for every template. Tell the client
to confirm on a device before depending on any of it.

Only when the client opts in, add these two to the helper file — the handlers
are an object, so each function in it is guarded individually:

```typescript
// src/analytics/webengagePersonalization.ts — add only if WECampaignCallback is wanted
export const registerWECampaignCallback = (handlers: Record<string, unknown>) =>
  run('personalization.campaign', (p) =>
    (p.registerWECampaignCallback as any)(
      Object.fromEntries(
        Object.entries(handlers).map(([k, v]) => [
          k,
          typeof v === 'function' ? guardArgs(`personalization.campaign.${k}`, [v])[0] : v,
        ])
      )
    )
  );
export const deregisterWECampaignCallback = () =>
  run('personalization.campaign.off', (p) => p.deregisterWECampaignCallback());
```

```typescript
import { useEffect } from 'react';
import { registerWECampaignCallback, deregisterWECampaignCallback } from '../src/analytics/webengagePersonalization';

useEffect(() => {
  registerWECampaignCallback({
    onCampaignPrepared: (data) => { /* fires before render; RN has no
      suppression mechanism here — unlike Android/iOS's stopRendering()
      — treat as observation-only, same
      limitation as In-App's onPrepare */ },
    onCampaignShown: (data) => {},
    onCampaignClicked: (data) => {
      // No return-value convention (the return
      // value is never read). The app always fully owns navigation,
      // same as every other RN callback in this SDK (Core Rule 18) —
      // do NOT port Android's true/false stopRendering convention here.
    },
    onCampaignException: (error) => { /* required to handle — Hard Rule 5 */ },
  });

  return () => {
    deregisterWECampaignCallback();
  };
}, []);
```

## Rules

- Recommend checking the current `react-native-we-personalization`
  release on npm rather than trusting a specific pinned version number
  — the "v1.3.0" floor isn't tied to a package name anywhere it's
  stated, so treat it as informational, not an exact gate to build
  version checks against.
- Screen-tracking instance-sharing convention for In-Line call sites
  (the shared `WebEngageManager.instance` vs. a locally-built
  `createGuardedWebEngage()` for that screen's own `.screen()` call) — match
  whatever the client's screen already does — there is no single
  required convention here, so don't assume one pattern must be
  copied uncritically.
- `enableDevMode()` here is a separate JS-layer-only switch from the
  core SDK's own debug mode, and it's a single global on/off with no
  per-call-site control — every silent-no-op warning mentioned above
  (duplicate `WECampaignCallback` registration, etc.) is invisible
  unless this was called somewhere in the app. Recommend enabling it
  at least in staging/QA builds.

## Dashboard Step (Required, Outside the Codebase)

Each `propertyId` must be created on the WebEngage dashboard first —
the SDK silently shows nothing until a matching, active campaign
exists for it. Flag this proactively before the client goes looking
for a bug that isn't in the code: no error, no log, just an empty
placeholder, by design.

**On a New Architecture app, confirm `iosPropertyId` is above 1000
before the client creates a `WEInlineWidget` placement** — see Hard
Rule 13. This is the moment the value actually gets assigned, so it's
the right point to catch it, before a placement has to be recreated
later.

## How to Confirm This Works (the Client's Step)

*Expected behavior per WebEngage's documentation — not yet verified on
Expo.*

1. **Before you start:** for each placement, the `propertyId` is created on
   the dashboard and an active In-Line campaign targets your test user and
   that property (Dashboard Step above) — with none, the placeholder stays
   empty by design, with no error and no log. On a New Architecture app
   `iosPropertyId` is above 1000. Screen Tracking is in place on the
   hosting screen.
2. **Do:** open the screen that hosts the placement.
3. **Expect:** *Quick* (`WEInlineWidget`): the widget stays hidden, then
   reveals the Banner or Text campaign once content is drawn (`onRendered`
   fires). *Full, custom rendering* (`WEPlaceholderCallback`):
   `onDataReceived` fires with the campaign data, your view renders it, and
   `trackImpression()` fires on display and `trackClick()` on tap.
4. **If you don't see it:** no active campaign for that property; the
   `propertyId` doesn't exactly match the dashboard's placeholder name; the
   screen name tracked differs from the one the campaign targets; the widget
   has no explicit width and height.
5. **Tell me** what you saw. I record *confirmed*, *pending*, or the
   problem.

## Recording State

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

Per-screen propertyId mappings live in the shared
`screen-tracking.md`'s Recording State table (its `propertyId(s)`
column) — this file doesn't duplicate that table. Record separately in
`.webengage/channels/inline.md`:

- **Which of the three mechanisms are actually in use** — a plain
  "X of 3" summary (`WEInlineWidget` / `WEPlaceholderCallback` /
  `WECampaignCallback`), not just per-placement detail — this is what
  `Goal: Audit` reports as a top-line summary.
- Which mechanism each placement uses, exact file+line for each
  registration and its matching deregistration.
- For every `WEInlineWidget` placement: whether the hide-until-
  `onRendered` pattern is wired (file+line), and whether `style`
  includes explicit `height`/`width`.
- Whether `WECampaignCallback` is in use, where it's registered (app-
  wide vs. a specific screen, per the client's answer) and
  deregistered.
- Whether `trackImpression`/`trackClick` are wired for each Custom/
  Data-only placement, and where.

## Audit Checks

1. **`webengage.screen()` is not just present but *correctly gated* for
   every screen an In-Line placement uses** — Hard-Rule-derived (see
   `screen-tracking.md`'s own Audit Checks, which flag this at
   Hard-Rule severity for any In-Line-used screen): check the same two
   failure modes screen-tracking.md itself checks — a mount-only
   `useEffect` instead of `useFocusEffect`/container-level hook, and
   the launch screen specifically via `onReady`. "Present somewhere in
   the file" is not the same as "correctly implemented" — verify
   against those specific patterns, not just a grep for the call.
2. No more than one screen's In-Line content is mounted/registered
   without the earlier one having been deregistered first — Hard-Rule-
   derived, always an issue if found; this is the dispatch-bug
   exposure, not a style question. Multiple placements on the *same*
   screen are not a violation — don't flag those.
3. `trackImpression()`/`trackClick()` present for every Custom View/
   Data-only placement, called only after `onDataReceived` — Hard-
   Rule-derived. This is the specific check for "if custom In-Line is
   integrated, are impressions/clicks actually being tracked" — report
   it by placement, not just a yes/no for the whole Goal.
4. `propertyId` values match the dashboard-created placeholder names —
   client-confirmable only, reported as confirmed/pending, not a
   code-level issue on its own.
5. `onPlaceholderException` (and `onCampaignException`, if
   `WECampaignCallback` is in use) handled everywhere applicable —
   Hard-Rule-derived.
6. If `WECampaignCallback` is in use: exactly one registration exists,
   paired with a deregister in the same component's cleanup — Hard-
   Rule-derived.
7. `WEPlaceholderCallback` deregistration present in every
   registration's cleanup — Hard-Rule-derived (no auto-unregister
   exists on RN to fall back on).
8. iOS: static framework linkage is in effect — `expo-build-properties`
   `ios.useFrameworks: 'static'` in the Expo config (and, if `ios/`
   exists, `use_frameworks! :linkage => :static` visible in the
   generated `Podfile`) — Hard-Rule-derived. **If static linkage is
   enabled anywhere** (by this package, Rich Push, or both):
   `WEBENGAGE_DISABLE_SPM=true` is also set for the build (EAS profile
   `env`, or the local environment the client builds with) — always an
   issue if missing; the app builds and launches fine per the CLI, then
   crashes at launch with a `Library not loaded` dyld error, so this is
   easy to miss until then. Only the EAS `env` entry is checkable from
   the repo — for local builds, report it as client-confirmable.
9. **Every `WEInlineWidget` starts hidden and only reveals on
    `onRendered`, re-hiding on `onPlaceholderException`** —
    Hard-Rule-derived, always an issue if a placement can show a
    permanently visible empty box when no campaign is active.
10. **Every `WEInlineWidget`'s `style` sets `height` and `width` to
    plain numbers — never a percentage string, never omitted** —
    Hard-Rule-derived; a percentage string crashes on Android at mount,
    and an omitted `width` silently renders the ad content at zero
    width instead.
11. **`iosPropertyId` is passed as a genuine integer at every call
    site, not a coerced string or float** — Hard-Rule-derived.
12. **No `propertyId` has both a `WEInlineWidget` and a
    `WEPlaceholderCallback` registered against it** — Hard-Rule-derived,
    always an issue if found (breaks the widget's rendering silently,
    per Hard Rule 12 above).
13. **Summary: which of the three mechanisms (`WEInlineWidget` /
    `WEPlaceholderCallback` / `WECampaignCallback`) are actually in
    use** — not a deviation check, a plain "X of 3" fact for the audit
    report, sourced from Recording State.
14. No call site calls the package's free functions in a way that
    bypasses the screen/propertyId pairing recorded above — Rule-
    derived; informational if backed by a Known Risk, a real issue
    otherwise.
15. **If Pre-Flight found New Architecture enabled: every
    `WEInlineWidget`'s `iosPropertyId` is above 1000** — Hard-Rule-
    derived (Hard Rule 13), client-confirmable for values already
    created on the dashboard (the code only shows what was passed at
    the call site, not the dashboard-side ID history), always an issue
    if a value at or below 1000 is found on a New Architecture app. Not
    applicable — don't flag it — on a Legacy Architecture app.
16. **Every call site imports the package's exports from the guarded helper
    file (`webengagePersonalization`), not straight from
    `react-native-we-personalization`** (Core Rule 26) — Rule-derived;
    informational if backed by a Known Risk, a real issue otherwise.
