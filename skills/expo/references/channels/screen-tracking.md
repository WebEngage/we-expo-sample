# Shared Reference: Screen Tracking

Used by both `Goal: Engagement Channel Integration → In-App` and
`→ In-Line Content`. Not a Goal of its own — set up once, whichever
channel Goal triggers it first; the other channel reuses what's
already instrumented rather than re-presenting or re-instrumenting it.

## What This Covers

Screen Data is contextual, key-value metadata set the moment a user
lands on a screen. It powers two things on the WebEngage dashboard:

- **Targeting** — deciding when/where a campaign shows (e.g. only on
  the Home screen if `planTier = "free"`).
- **Personalization** — injecting values into campaign copy via
  dashboard tokens.

**This is not the same as User Attributes.** User Attributes describe
the person and persist across sessions and devices. Screen Data
describes the current screen only, is held in local SDK context, and
resets on every navigation — nothing here is written once and left in
place.

## Optional vs. Mandatory — Depends on the Calling Channel

- **In-App: optional enhancement.** In-App displays automatically once
  Init is complete, with zero dependency on screen tracking. Screen
  Data only sharpens targeting/personalization precision here.
- **In-Line: mandatory prerequisite.** In-Line content is keyed to a
  `propertyId`/screen pairing, and both `WEInlineWidget` and
  `WEPlaceholderCallback` resolve that pairing through whatever
  `webengage.screen()` last reported — there is no other mechanism
  that tells the SDK which screen's In-Line content to show. This
  file doesn't collect `propertyId` values itself (that's dashboard-
  side and client-supplied) — `references/channels/inline.md` covers
  asking for them and mapping them against the screen table below;
  this file only owns getting `webengage.screen()` called correctly.

Every downstream section below (the Audit Checks) states which branch applies rather than assuming one — read
the specific wording at each section before assuming it's talking
about "screen tracking in general."

## If the Client Asks "Why Bother" (In-App Only — In-Line Has No "Why Bother," It's Mandatory)

Scoped to the optional, In-App case — there's no equivalent question
to entertain from In-Line, since skipping it there isn't an available
choice. Two concrete failure modes make the case for doing it properly
in the In-App/optional case, rather than skipping it or doing it
partially:

**1. Partial coverage reports wrong data, not missing data.** WebEngage
only learns a screen changed when `webengage.screen()` is called — it
has no other way to detect navigation. If the Home screen calls it and
Account/Cart don't, a user who moves Home → Account → Cart is still
reported as being on "Home" throughout, because nothing ever told
WebEngage otherwise. Any campaign targeting or personalization tied to
screen context will silently apply the wrong screen's rules on every
uninstrumented screen. Instrumenting some screens and not others is
worse than instrumenting none — it produces confidently wrong
attribution instead of an honest absence of it.

**2. Screen Data is scoped to its own screen, even when done right.**
`webengage.screen()` clears the previous screen's data the moment it
fires for a new screen. Any event whose targeting or personalization
depends on a screen's data must fire while the user is still on that
screen — if it fires after the user has already navigated onward, the
new screen's context (or lack of one) applies instead.

## Screen Tracking at Full — Stated, Not Asked

At Full depth Screen Tracking is part of In-App (`references/depth.md`), so it
is **not a question**: say it in one line inside the In-App approval ("I'll
also add screen tracking so campaigns can target a screen — say 'skip it' to
leave it out"). A client who skips it: record it, no Known Risk. If In-Line
triggered this file first, instrument it per the mandatory branch above.
One fact worth saying plainly if the client asks "why": partial coverage
reports *wrong* screens (the last tracked screen stays current until the next
call), so cover every screen or none.

## Start From What's Already There

Before instrumenting anything, use Pre-Flight's screen picture (rebuilt
fresh every session) — privately; none of it is reported to the client:

- **Already instrumented, still true** — reuse it; don't redo.
- **Previously done, now missing** (e.g. a refactor removed the call from a
  screen) — it is just a to-do: restore it as part of the change list.
- **Not yet instrumented** — proceed below.

## Analytics Wrapper — Screen Method

Per `references/wrapper.md` → Analytics Wrapper — Architecture, screen navigation
never calls `webengage.screen(...)` directly from a call site — it
routes through the same wrapper file Init/User/Events already extend:

```typescript
// src/analytics/WebEngageManager.ts — add this method
trackScreen(name: string, data?: Record<string, any>): void {
  if (data) {
    this.webengage.screen(name, data);
  } else {
    this.webengage.screen(name);
  }
}
```

This section covers *when and where* to call it — the guidance below
is unchanged by the wrapper; only the call itself is routed through
`WebEngageManager` rather than the SDK directly.

## Check for an Existing Hook First — Don't Jump to Creating a New One

Per `SKILL.md`'s general detect-and-match principle, adding a *second*
navigation-change listener alongside one that already exists is worse
than it sounds — two separate `onStateChange` handlers (or two
competing route observers) both firing on every navigation isn't just
redundant, it's a real source of subtle bugs (double-firing,
inconsistent ordering, harder-to-debug screen-name mismatches down the
line). Check Pre-Flight's finding on this before writing anything:

- **An existing hook is already there** — for WebEngage's own purpose
  (already instrumented, see "Start From What's Already There" above) or for
  *any other* purpose (another analytics tool's `logScreenView`, an
  existing navigation service/observer class, an existing
  `onStateChange` on the same `NavigationContainer`): **add the
  `WebEngageManager.trackScreen(...)` call inside that existing hook.**
  Don't create a parallel one that duplicates the same navigation
  event.
- **Nothing like this exists yet:** proceed to "Choosing the Right
  Hook" below and create the container-level hook described there.

## Choosing the Right Hook — Match How the Client Handles Navigation

**Don't assume a navigation library. Use the one the app actually uses,
the way the app uses it.** Pre-Flight's finding comes from the client's
code (what it imports and calls — see `references/pre-flight.md`), not
from a package name: a navigation package can be installed and unused,
or a second one can be in play. Before writing anything, re-confirm it
against the file Pre-Flight recorded as the navigation setup, and follow
the first matching case:

1. **The app already has its own screen-change hook or wrapper** (for any
   purpose — another tool's screen-view call, a navigation service) →
   add the `WebEngageManager.trackScreen(...)` call inside it; see
   "Check for an Existing Hook First" above.
2. **A library recipe below matches what the code uses** (Expo Router,
   React Navigation, `react-native-navigation`, manual state) → use that
   recipe, adapted to the client's actual structure (their navigator
   nesting, their route names, their existing helpers).
3. **The app uses a library with no recipe here, or a custom wrapper**
   → read that library's own API (in `node_modules`/its docs) for its
   "the visible screen changed" signal and use *that*; don't force a
   recipe that belongs to a different library, and don't invent an API
   you haven't confirmed exists. If there's no clear signal, or you can't
   tell which signal is reliable, **ask the client** how they'd like
   screen changes detected rather than guessing.

There is no single built-in lifecycle callback across libraries; the
correct hook is a function of the navigation approach in use, and none
of WebEngage's own documentation covers this choice. **Prefer a single,
container-level hook over a per-screen one whenever the library exposes
one** — one call site instead of many, and no dependency on getting each
screen's own lifecycle nuance right.

### Expo Router (only if Pre-Flight found it in actual use)

Applies when the code genuinely routes through Expo Router — route files
under `app/` and navigation via its `Link`/`router` API — not merely
because the package is installed. Expo Router is built on React Navigation but
owns the `NavigationContainer` internally, so the React Navigation
container-level hook below isn't reachable — the equivalent
**container-level, one-call-site** hook is a pathname-change effect in
the **root layout** (`app/_layout.tsx`, or `src/app/_layout.tsx` when the
project keeps routes under `src/`), using Expo Router's own
`usePathname()` and `useSegments()`. **The snippet is a shape, not a file to
paste:** add the hook and effect inside the project's *existing* root layout
component and keep whatever it already returns (providers, a guarded
`Stack`, a splash gate) — never replace its `return`. Match the project's
import style (a path alias such as `@/` instead of the relative import
below).

```typescript
// app/_layout.tsx
import { useEffect, useRef } from 'react';
import { Stack, usePathname, useSegments } from 'expo-router';
import WebEngageManager from '../src/analytics/WebEngageManager';

// App-authored helpers (write them per app; not part of the WebEngage SDK):
// screenNameFor() turns the route pattern into the dashboard's screen name
// (e.g. "(tabs)" -> "Home"); screenDataFor() returns that screen's Screen Data.

export default function RootLayout() {
  const pathname = usePathname();          // "/product/42"
  const segments = useSegments();          // ["product", "[id]"]; [] for a root index
  // React 19 types require an argument to useRef — `useRef<string>()` fails
  // to type-check there (TS2554), so pass `undefined` explicitly.
  const lastTracked = useRef<string | undefined>(undefined);

  // Route *pattern* as the screen name, so /product/1 and /product/2 share
  // "product/[id]". useSegments() is empty for a root `app/index.tsx`, so fall
  // back to the pathname — otherwise the launch screen is never tracked.
  const screenName = segments.length ? segments.join('/') : pathname;

  useEffect(() => {
    // A new pathname is a genuine navigation (product/1 -> product/2 is a new
    // visit with its own Screen Data even though the pattern is the same).
    // The ref also absorbs React StrictMode's dev-only double effect, so
    // the launch screen is tracked once, not twice.
    if (!screenName || lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    WebEngageManager.trackScreen(screenNameFor(screenName), screenDataFor(screenName));
  }, [pathname, screenName]);

  return <Stack />;
}
```

**Redirects and hydration gates.** If the app redirects at launch (a
login gate, a splash that waits for stored state — `/` → `/login` → `/home`),
the effect above fires for the transient routes too, which Hard Rule 2
forbids. Skip tracking until the app's own "ready" signal (the same flag that
ends the splash or auth gate), then track the route the user actually lands
on; keep the app's existing flag — don't invent a second one.

This covers the launch screen (the effect fires on the first render
with the initial route — there is no separate `onReady` to remember),
stack pushes/pops including "back", tab and drawer switches, and deep
links, from one place. Fire synchronously inside the effect body —
never from its cleanup, never behind a `setTimeout` (Hard Rule 1).

The same call lives in this layout's mount effect *after*
`WebEngageManager.init()` (same file, same component — see
`references/init.md`); don't create a second layout-level effect
elsewhere. If the app has a root layout *without* `Slot`/`Stack` at its
top (a custom provider tree), the hook still belongs in the outermost
layout component that renders on every route.

**Fallback — per-screen:** Expo Router re-exports `useFocusEffect`;
use it (not a mount-only `useEffect`) with `useCallback`, exactly as in
the React Navigation fallback below, only when a single root-layout
hook isn't practical.

### React Navigation (used directly — only if Pre-Flight found it in actual use)

**Preferred — container-level, one call site for the whole app:**
Attach a single listener to the `NavigationContainer` itself, rather
than instrumenting every screen individually.

```typescript
import { useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import WebEngageManager from './src/analytics/WebEngageManager';

function App() {
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const initialRoute = navigationRef.getCurrentRoute();
        const initialRouteName = initialRoute?.name;
        routeNameRef.current = `${initialRouteName}:${JSON.stringify(initialRoute?.params ?? {})}`;
        // Track the launch screen itself — the very first screen the
        // user sees (splash, home, whatever the app's initial route
        // is) needs this call too, not just the screens navigated TO
        // afterward. onStateChange (below) only ever fires on a
        // *transition*, so without this line the launch screen is
        // never tracked at all — a real, easy-to-miss gap, not a
        // hypothetical one.
        if (initialRouteName) {
          // screenDataFor(routeName): an app-authored helper returning
          // that screen's Screen Data object — not part of the
          // WebEngage SDK. Write it per-app; shown here as a stand-in.
          WebEngageManager.trackScreen(initialRouteName, screenDataFor(initialRouteName));
        }
      }}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        const currentRouteName = route?.name;
        // Same name with different params is a genuine new visit
        // (product 1 -> product 2); identical name AND params is not.
        const currentKey = `${currentRouteName}:${JSON.stringify(route?.params ?? {})}`;
        if (currentRouteName && routeNameRef.current !== currentKey) {
          WebEngageManager.trackScreen(currentRouteName, screenDataFor(currentRouteName));
          routeNameRef.current = currentKey;
        }
      }}
    >
      {/* ...your navigators */}
    </NavigationContainer>
  );
}
```

This correctly catches every navigation event — stack pushes/pops, tab
switches, drawer navigation, and deep links — from one place.
**Worked example, matching a typical launch
flow:** app opens to Splash → `onReady` fires, tracks `Splash Screen`;
Splash auto-navigates to Home → `onStateChange` fires, tracks `Home
Screen`; user taps into Cart → tracks `Cart Screen`; taps back → tracks
`Home Screen` again (a genuine re-fire, not a duplicate — the user is
back on Home and its Screen Data may have changed); taps a product →
tracks `Product Details Screen`. Every one of these is a real,
distinct `webengage.screen()` call — the container-level hook doesn't
skip "back" any differently than "forward."

**Fallback — per-screen, when a single container-level listener isn't
practical** (e.g. multiple disconnected `NavigationContainer` trees, or
the client prefers explicit per-screen control): use `useFocusEffect`
from `@react-navigation/native`, not a plain `useEffect`.

```typescript
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import WebEngageManager from '../src/analytics/WebEngageManager';

function CartScreen() {
  useFocusEffect(
    useCallback(() => {
      WebEngageManager.trackScreen('Cart Screen', { cartValue: 1200 });
    }, [])
  );
  // ...
}
```

**Why not plain `useEffect`:** it fires once on mount, not on every
time the screen becomes visible — and "mount" happens far less often
than most developers assume. This is one of the most common real-world
mistakes in React Navigation integrations, with two distinct,
both-common manifestations:

- **Stack navigation, "back."** A Stack screen only mounts once, the
  first time it's pushed — going back to it later doesn't remount it,
  it just brings an already-mounted screen back into focus. A
  mount-only `useEffect` on that screen fired exactly once, when it
  was first pushed, and will **never fire again** on any later "back"
  navigation to it — the exact scenario in the worked example above
  (Home → Cart → back to Home). This under-fires: the screen goes
  untracked on every return visit.
- **Tab/Drawer navigators, at launch or on first swipe-through.** React
  Navigation mounts every tab's screen component up front by default
  (or the first time each tab is touched, depending on `lazy`
  configuration) — regardless of which single tab is actually visible.
  A mount-only `useEffect` inside each tab screen fires as soon as
  *that tab mounts*, not when it becomes the visible one — so several
  tabs can each report themselves as the current screen within
  moments of app launch, racing each other, with whichever fires last
  silently overwriting the others as WebEngage's current screen
  context. This over-fires: multiple wrong screens get reported around
  launch, not just one delayed/missing one.

Both come down to the same underlying mistake: hooking "was created"
(`useEffect`) instead of the actual "became visible" signal
(`useFocusEffect`).

**A third, independent mistake: firing `webengage.screen()` at the
wrong point in the lifecycle entirely** — inside a `useEffect`'s
cleanup/`return` function (which runs on *unmount*, i.e. as the user is
leaving a screen, not arriving at one), or behind a `setTimeout`/delay.
Both decouple the call from the moment the screen actually becomes
visible: a cleanup-fired call reports the *previous* screen just as the
user has already moved on to a new one (exactly backwards), and a
delayed call risks firing after the user has already navigated away
again, reporting a screen that's no longer current. Fire synchronously,
on becoming visible — never on the way out, never after a delay.

**A fourth mistake, the counterpart to under-firing above:
`webengage.screen()` firing more than once for what is, from the
user's perspective, a single continuous visit to one screen — or
firing for more than one screen at what should be a single moment in
time.** At any given instant, exactly one screen is current; more than
one `webengage.screen()` call landing "at once" is never legitimate,
regardless of which specific navigator or hook produced it. Two
concrete invalid shapes, both real:

1. **Multiple different screens tracked together at app launch** — e.g.
   Home, Cart, *and* Account all firing `webengage.screen()` within
   moments of the app opening. Only the screen actually visible at
   launch should fire — this is the exact Tab/Drawer mount-vs-focus
   bug above, just restated as its observable symptom: if an audit (or
   a client's own analytics review) shows more than one screen
   tracked around a single launch, that's the signature to look for,
   not three independent, unrelated events.
2. **The same screen tracked twice with no real intervening visit
   elsewhere** — e.g. Product Details or Cart firing twice in a row.
   The only legitimate reason to see the same screen name tracked
   again is a genuine re-visit: the user left for a different screen
   and came back. Two consecutive calls for the identical screen with
   no other screen in between means something is double-registered
   (e.g. both a container-level hook *and* a redundant per-screen
   `useFocusEffect` for the same navigation) or a hook's dependency
   array is wrong, causing it to refire without a real focus change —
   not a client's deliberate design.

### `react-native-navigation` (Wix)

Use the library's own global event listener rather than per-screen
hooks, for the same container-level-over-per-screen reasoning:

```typescript
import { Navigation } from 'react-native-navigation';
import WebEngageManager from './src/analytics/WebEngageManager';

Navigation.events().registerComponentDidAppearListener(({ componentName }) => {
  WebEngageManager.trackScreen(componentName, screenDataFor(componentName));
});
```

### No Navigation Library (Manual Conditional Rendering)

If Pre-Flight found the app switches screens via plain component state
(no navigation library at all), there's no container-level hook to
attach to — instrument the state transition itself, at the single
place that decides which screen is showing, rather than scattering
calls through multiple conditional branches.

## Screen Data Discovery — Not Just a Name

For each screen, understand its functional role (product detail, cart,
settings, etc.) and propose Screen Data keys worth setting for
targeting or personalization — don't stop at asking what the screen is
called.

```typescript
WebEngageManager.trackScreen('Cart Screen', {
  isPremium: false,
  cartValue: 1200,
});
```

**PII in Screen Data:** leave it out and say so in the approval. If the
client asks for it as Screen Data, implement it their way and record as a
Known Risk — stating plainly that this data will be carried in the
payload of every event fired from that screen, not just held locally.

**Re-declare on every navigation.** Screen Data does not persist across
screens, app restarts, or devices — each `webengage.screen()` call
replaces whatever was set on the previous screen. Do not assume a value
set once is still active later.

## Recording State

(The refresh of the two notes files belongs to the Goal that triggered Screen Tracking — In-App or In-Line — not to this shared reference; see `references/progress-reports.md`.)


`.webengage/channels/screen-tracking.md` — one shared table, one row
per screen, used by both channels. **Who writes it:** Pre-Flight writes
nothing — the first Goal that needs it (In-App at Full, or In-Line)
creates the file here, from the screen scan it already holds for the
session; later Goals read it instead of re-scanning. Two data columns, kept distinct:
**Screen Data Passed** is what's actually implemented (source of the
audit table in `references/audit.md`); **Candidate Screen-Data Keys**
is what's still just proposed. Don't conflate the two — an
unimplemented candidate is not "data being passed." A `propertyId(s)`
column tracks In-Line's own mandatory linkage per screen — this file
never collects that value itself (dashboard-side, client-supplied;
`references/channels/inline.md` owns asking for it), it only records
what In-Line's own Goal already gathered, so the shared table stays
complete without either Goal re-deriving the other's data:

| Screen | `webengage.screen()` | Navigation Library / Hook | Screen Data Passed | Candidate Screen-Data Keys (not yet implemented) | propertyId(s) |
|---|---|---|---|---|---|
| Splash Screen | ✅ | Expo Router — root layout `usePathname` effect (or React Navigation — container `onReady`) | *(none)* | — | — |
| Home Screen | ✅ | Expo Router — root layout `usePathname` effect (or React Navigation — container `onStateChange`) | `isPremium`, `planTier` | — | `home_banner` |
| Cart Screen | ✅ | same root-layout hook | `cartValue`, `itemCount` | — | pending — ask at In-Line |
| Product Details Screen | ❌ | same root-layout hook | — | `productId`, `price` | pending — ask at In-Line |

## Hard Rules

1. **No `webengage.screen()` call fires from inside a `useEffect`
   cleanup/`return` function or behind a `setTimeout`/delay** — this
   isn't a style preference: a cleanup-fired call reports the screen
   the user is *leaving*, and a delayed call risks firing after the
   user has already navigated further. Fire synchronously, on becoming
   visible — never on the way out, never after a delay.
2. **No more than one screen tracked together around a single moment
   (most visibly, app launch), and no identical screen — same name *and*
   same params/pathname — tracked twice in a row with no other screen in
   between** (a new param visit such as product 1 → product 2 is a genuine
   new visit and is tracked, with its own Screen Data) — there's no legitimate
   reason for either shape (see the fourth mistake above for the
   reasoning and the two concrete invalid examples). Detectable from
   Recording State/a fresh scan without runtime tracing: multiple
   different screens' hooks all reachable at mount time (the Tab/Drawer
   over-mounting shape) or the same screen's hook registered in more
   than one place (container-level *and* a redundant per-screen
   `useFocusEffect`) are the code-level signatures to look for, not
   just the runtime symptom.
3. **For any screen an In-Line placement uses: `webengage.screen()`
   must be present and correctly gated, including the launch screen
   (via `onReady` on React Navigation; the root-layout effect's first
   run on Expo Router)** — mandatory here, per the "In-Line: mandatory
   prerequisite" branch above, not just recommended the way it is for
   In-App-only screens (see the Rules below).

## Rules

- **For a screen only In-App relies on: `webengage.screen()` is
  present, including the launch screen (via `onReady` on React
  Navigation; the root-layout effect's first run on Expo Router)** — optional
  here (unlike Hard Rule 3 above for In-Line), so a gap only matters
  if screen tracking was presented and silently skipped without
  recording; missing the launch screen specifically is a common
  enough real-world miss (see the worked example above) that it's
  worth checking as its own item, not folding it into "screen
  coverage" generically.
- A screen's tracking call is gated to actual visibility
  (`useFocusEffect`, or the container-level hook), not a mount-only
  `useEffect` — check against both failure modes, not just one: a
  Stack screen reached again via "back" navigation, and a Tab/Drawer
  screen that mounted without becoming the visible one.
- If a container-level hook is available for the app's navigation
  library, it's used instead of scattering per-screen hooks — unless a
  Known Risk records why the app needed the per-screen fallback.
- No PII present in any recorded Screen Data key without a
  corresponding Known Risk entry (Core Rule 13).
- No screen call site calls `webengage.screen(...)` directly instead
  of going through the Analytics Wrapper's `trackScreen()` (per
  `references/wrapper.md` → Analytics Wrapper — Architecture).

## What Audit Checks Here

- Hard Rule 1 (no cleanup/delayed firing) — always an issue if found.
- Hard Rule 2 (no simultaneous/duplicate-in-a-row tracking) — always an
  issue if found, regardless of Known Risk status.
- Hard Rule 3 (In-Line-used screens correctly gated, including launch)
  — always an issue if found.
- The Rules above — Rule-derived; informational if backed by a Known
  Risk entry, a real issue otherwise.

**Reviewing an existing implementation specifically:** all of the
above applies with equal weight whether this skill wrote the code or
the client did — per `references/rules.md` → How Audit Interprets a Found Violation, explain the specific screen/file where a mistiming or
missed-launch-screen issue was found and why it matters, then ask
permission before changing it. Don't silently "fix" a client's
existing navigation-tracking code.
