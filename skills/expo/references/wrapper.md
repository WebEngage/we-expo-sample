# Analytics Wrapper — Architecture and Safety Contract

Load this at Init, and whenever a Goal adds a wrapper method or a call site.

## Analytics Wrapper — Architecture

`Goal: Integration (Init)`, `Tracking User`, `Tracking Events`, and
Screen Tracking (the shared reference used by In-App) never call
`react-native-webengage` directly from scattered call sites. All of
their code routes through one dedicated wrapper file — created during
Init if it doesn't exist yet, extended by later Goals rather than
duplicated. It follows the `WebEngageManager` pattern used in WebEngage's
own sample integrations — a single SDK instance, exported once, extended
with app-specific logic around it — plus the safety contract below.

```typescript
// src/analytics/WebEngageManager.ts  (the guard helpers at the top are in references/init.md → Analytics Wrapper)
class WebEngageManagerClass {
  private webengage = createGuardedWebEngage(); // never throws; a silent no-op on web and in Expo Go
  private callbacksRegistered = false;

  get instance() { return this.webengage; } // the same guarded handle, for one-shot SDK calls kept outside this wrapper (see below)

  init(): void { /* Init */ }
  login(userId: string, jwtToken?: string): void { /* Tracking User */ }
  logout(): void { /* Tracking User */ }
  setEmail(email: string): void { /* Tracking User */ }
  // ...other attribute setters
  trackEvent(name: string, properties?: Record<string, any>): void { /* Tracking Events */ }
  trackScreen(name: string, data?: Record<string, any>): void { /* Screen Tracking */ }

  // Every WebEngage *listener* registration (push/in-app/universal-link
  // clicks, anonymous-ID-changed, tokenInvalidatedCallback) lives here,
  // one block per Goal that adds it. A Goal adds only its own block,
  // never touches another Goal's (Core Rule 7).
  registerCallbacks(): void {
    // Guards against a mount effect firing more than once (Fast
    // Refresh, StrictMode, a remounted root) double-registering every
    // listener — each one would then fire its handler twice per event.
    if (this.callbacksRegistered) return;
    this.callbacksRegistered = true;

    // this.webengage.push.onClick((data) => { /* Push */ });
    // this.webengage.notification.onPrepare/onShown/onClick/onDismiss(...) /* In-App */
    // this.webengage.universalLink.onClick((location) => { /* Push — opt-in */ });
    // this.webengage.user.onAnonymousIdChanged((id) => { /* Tracking User — opt-in */ });
    // this.webengage.user.tokenInvalidatedCallback(() => { /* Tracking User — SDK Auth only */ });
  }
}

const WebEngageManager = new WebEngageManagerClass();
export default WebEngageManager;
```

Call `registerCallbacks()` once, from the same root-component mount
effect as `init()` (Rule 19) — see `references/init.md`'s wrapper
section for the exact call site.

**TypeScript is shown throughout; for a plain-JavaScript project** write
the `.js` variant in `references/init.md` → Analytics Wrapper and drop
type annotations, `private`, and `as` casts from every later snippet.

**Expo Router placement warning.** If the app uses Expo Router (an
`app/` directory), **never place the wrapper — or any non-route file —
inside `app/`**: every file there becomes a route. Default location is
`src/analytics/` (or a top-level `analytics/`) — outside `app/`.

**The dividing line for what routes through the wrapper's own methods is
listener registration vs. one-shot action calls, not "which Goal owns it."**
Every `.on*`/`*Callback` listener (above) goes through
`registerCallbacks()` — the one exception is the In-Line package's own
`registerWECampaignCallback`/`registerWEPlaceholderCallback`, which belong to
a component's mount/unmount (`references/channels/inline.md`) and are exempt
from this rule. **One-shot calls that stay outside the wrapper's
methods call the SDK through `WebEngageManager.instance` — the same guarded
handle, so they are just as safe:** Android push token/message plumbing
(`push.sendFcmToken`, `push.onMessageReceived` — tied to the push library's
own event lifecycle, not a WebEngage listener) and
`user.setDevicePushOptIn()`/`setOptIn()`/`setSecureToken()` (made at a
specific result/event site — a permission result, a token refresh). Keeping
these out avoids an ordering dependency: Push can run before Tracking User,
so a wrapper method for them would make Push's completeness depend on
whether Tracking User happened to run first. The one other sanctioned place
for a second instance is the background push task (Rule 19, Expo-specific
exception): it calls `createGuardedWebEngage()` — exported by the wrapper
file — inside the task body.

**In-Line Content (`references/channels/inline.md`) and Notification
Inbox (`references/channels/inbox.md`) are architecturally different
from every Goal above.** Their functions are free functions exported by
separate packages — never methods on the SDK instance — so there's no
`WebEngageManager.instance` to reuse and no duplicate-instance risk. They
follow the same safety contract through the three helpers the wrapper file
exports — `webengageAvailable`, `safeCall` and `guardArgs` (below) — in one
small helper file per package (`webengageInbox`, `webengagePersonalization`)
that exports the package's functions by the same names, so call sites change
only their import path.

**`push.onCallbackReceived`/`notification.onCallbackReceived`/
`universalLink.onCallbackReceived` are dead code, not part of the live
event flow — never call or reference them.** Every real event reaches
the app exclusively through the `.on*` listener methods.

**Naming and placement:** default to `WebEngageManager.ts` (or `.js` if
Pre-Flight found the project is plain JavaScript) in `src/analytics/`,
unless Pre-Flight finds the app already has a clear convention (e.g.
every cross-cutting service ends in `Manager` under `src/services/`) —
match that instead.

**If another analytics wrapper already exists** (a generic, multi-tool
one): do not add WebEngage methods into it. Create a separate,
WebEngage-only file. The existing wrapper is reference input for
naming/placement only (Rule 9).

**Recording:** `.webengage/agent.md`'s Locked Facts records the
wrapper's file path once Init creates it; every later Goal checks this
before assuming it needs to create the file itself.

**Audit:** any Init/User/Events/Screen-Tracking call to
`new WebEngage()` or a `webengage.*` method found outside this wrapper
file is a Rule-level deviation — informational if backed by a Known
Risk entry, a real issue otherwise. Same for any listener registration
found outside `registerCallbacks()`. The background-task instance (Rule
19) is exempt, provided it is built with `createGuardedWebEngage()` and
only calls `push.onMessageReceived`.

## Safety Contract — the Wrapper Never Throws Into App Code (Core Rule 26)

A problem inside WebEngage must never become a problem in the client's
app. The wrapper file guarantees:

1. **No SDK call or callback handler can throw into app code.** Every call
   made through the guarded handle, and every function passed to it (the
   listeners in `registerCallbacks()`), runs inside a `try`/`catch`. A
   rejected promise from an SDK call is caught too. This is done once, in
   the guard at the top of the wrapper file, so no per-method boilerplate is
   needed and later Goals' snippets stay as short as they are shown.
2. **A silent no-op where the native module doesn't exist.** On web and in
   Expo Go (`Platform.OS === 'web'`, `isRunningInExpoGo()` from `expo`), and
   whenever constructing the SDK fails, every call does nothing. The app
   runs normally; it just sends no data. Reason: `react-native-webengage`
   looks its native module up when it is imported, and a call made without
   it fails only later, at call time, inside the SDK.
3. **JavaScript running against an older native build is safe too.** If the
   client updates JS before rebuilding the native app (so the native side
   doesn't have the new plugin yet), the same guard keeps the missing
   native pieces from crashing the app.
4. **Logging is development-only.** Failures print one line,
   `[WebEngage] <call> failed: …`, when `__DEV__` is true, and nothing in a
   release build. The guard never logs user identifiers, attribute values,
   event properties, or tokens.
5. **The guard changes what is sent in no way** — it forwards each call and
   argument untouched.

**What the guard does not cover, and how to treat it:**
- **`webengageAvailable`** (exported `boolean`) — the same support check as
  item 2. A call site that renders a native view (`WEInlineWidget`) or calls
  a free function from the optional feature packages (In-Line, Inbox) uses
  it, or `safeCall`, to follow the same contract.
- **`safeCall(where, fn, fallback)`** (exported) — runs `fn()` and returns
  its result, or `fallback` when the SDK isn't available or `fn` throws or
  rejects. Use it for the optional feature packages' free functions, so an
  Inbox call returns an empty list rather than throwing.
- **`guardArgs(where, args)`** (exported) — wraps any function in an argument
  list so an error inside a handler can't escape through the SDK; the guard
  itself and the In-Line helper file use it.
- An error thrown by the **client's own code inside a handler** is swallowed
  and shown as a development warning, not rethrown — by design (a push-click
  handler that crashes must not take the app down). Say so once when adding
  the first handler, so a "my handler does nothing" report points to the
  development console.

**Verification status:** designed from reading `react-native-webengage`
2.1.0's JavaScript source and Expo's documented `isRunningInExpoGo()`; it
has **not been run** in Expo Go, on web, or against a mismatched native
build (`references/compatibility.md` → Verification status of skill
features). Say "designed so that…", never "tested".
