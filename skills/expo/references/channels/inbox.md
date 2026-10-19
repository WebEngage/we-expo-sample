# Goal: Engagement Channel Integration — Notification Inbox

**Prerequisite:** Init complete.

**Input from Pre-Flight:** whether `react-native-webengage-inbox` already
exists in `package.json`, and any existing inbox-related screens found
in the codebase — do not rescan.

**Order of this Goal (Core Rule 25):** install `react-native-webengage-inbox`
(asked, one line on what it is for), then the inbox screen and the calls —
each through `safeCall` (`references/wrapper.md`), so an unavailable SDK
returns an empty result instead of throwing. Approval is one message: this
change list plus the apply commands (`references/init.md` → Apply the Plugin).
Stopping after the install leaves an unused package, which is inert.

## Start From What's Already There

Before asking anything, use what Pre-Flight found — privately; none of it
is reported to the client:

- **Already in place and correct** — reuse it and go straight to the Goal
  the client wants. Say nothing about it.
- **Previously done, now missing** (e.g. `resetNotificationCount()` is no
  longer called at the inbox-entry tap, or `trackClick`/`trackView` calls
  were dropped in a refactor) — it is just a to-do: put it back as part of
  the change list ("I'll restore the unread-count reset"), in plain words.
- **Found integrated with no `.webengage/` record** (`react-native-webengage-inbox`
  in `package.json`, real `getNotificationList`/`markRead`/etc. usage, never
  touched by this skill) — treat it as the starting point: use this Goal's
  Audit Checks as your private checklist for what's done and what's
  missing, and record what exists when this Goal starts.
- **Not yet done** — proceed with Step 0 below.

## What Notification Inbox Is

A separate child SDK (`react-native-webengage-inbox`) that gives the
app access to a persistent, in-app notification history — the
messages a user can scroll back through, not just the one that was on
screen when a push/in-app campaign fired. **Unlike In-Line Content and
In-App, there is no prebuilt UI at all, on any platform** (zero
component exports in this package). Every inbox
screen this skill builds is fully custom, built entirely on top of a
set of free functions (list, count, mark read/unread/delete, track) —
there's no `<NotificationInbox />` component to drop in.

## Step 0 — Prerequisites (Confirm Before Any Code)

Three distinct gates, not one blocking chain — confirm the first two
now; the third is a follow-up, not something that blocks writing code:

1. **Core `react-native-webengage` integration complete** (Init) —
   this package builds directly on it.
2. **SDK Authentication — opt-in only, do not propose.** Same Core
   Rule 15 treatment as everywhere else in this skill: never raise it
   as an option. If the client asks for it, tell them plainly to reach
   out to the WebEngage team to enable it — **this specific feature
   has other account-side dependencies beyond a standard SDK
   Authentication request**, so don't treat it as a simple toggle the
   client can request in isolation; route the whole conversation to
   WebEngage support rather than guessing at what else is needed.
3. **Account-level feature enablement.** To enable the Notification
   Inbox feature for your account, raise a request at
   support@webengage.com. This is genuinely separate from
   SDK Authentication (item 2) — a client can need this even with
   plain, unauthenticated login. Note it as a pending client action;
   don't block writing/testing code on it being done first, but do
   record it as outstanding (Recording State below).

## Step 1 — Integration Depth (Read, Never Ask)

**Quick vs. Full is defined on feature completeness here, not on
prebuilt vs. custom — this package has no prebuilt UI to offer as a
shortcut** (see "What Notification Inbox Is" above). Depth was chosen
once for the whole integration (`references/depth.md` → Integration Depth — Asked Once, Core Rule 23) and is recorded in `.webengage/agent.md` → Locked
Facts → `Integration depth` — check `Depth overrides` for Inbox first.
**Do not ask it again.** State it in one line, before any code:

> Using **Quick** depth, chosen earlier — unread count badge, first page
> of the notification list, tap-to-mark-read, click/view tracking; no
> pagination or batch actions. *(or:* Using **Full** depth, chosen
> earlier — also adds pagination through the full list, and all
> single/batch mark-read/mark-unread/delete actions.*)*

If no depth is recorded yet, run the depth question (`references/depth.md`) first.

**Quick is a genuinely complete, shippable outcome** — a working inbox
badge and a scrollable first page of messages a user can tap to open
and mark read, fully tracked. **Full** adds everything needed for a
long-lived inbox a user might have dozens or hundreds of messages in.

## Step 2 — Setup

**Where the inbox screen lives.** The package has no UI, so this Goal wires
one: if Pre-Flight found an existing inbox or notifications screen, wire the
calls into it; otherwise create one minimal screen (under Expo Router, a new
route file such as `app/inbox.tsx`) and say so in the approval. Don't ask
where — decide and state it.

**Installing this package always needs an explicit ask first, every
time — per Core Rule 21** (an optional, scope-expanding feature
package, not core work). State plainly what it's for before
installing, even if the client already agreed to pursue this Goal.

```shell
npm install react-native-webengage-inbox@latest      # or yarn add / pnpm add / bun add — always @latest
```

**No native integration is required on either platform.** Android and
iOS both link through Expo's autolinking at prebuild — nothing to edit
by hand, and unlike the sibling In-Line package, no static-linkage build
property is needed *for this package on its own*. **One thing worth
knowing about in advance:** the package's own `.podspec` shows a
commented-out `modular_headers` line for this pod — inactive by default;
if `pod install` (apply step C) ever produces a modular-headers-related
build error for this specific pod, surface it to the client rather than
editing the generated `Podfile` (it would be erased on the next
prebuild) — the fix would have to go through config.

**"No static-linkage requirement" is about this package needing nothing of
its own — it does not mean this package is safe from static linkage's
own SPM exposure once static linkage is on for any reason (In-Line turns
it on, or the client's own `useFrameworks: 'static'`).**
`react-native-webengage-inbox`'s own podspec resolves the native
`webengage-ios-sdk` via CocoaPods' SPM integration by default, same as
the other two WebEngage packages. Once static linkage is on
for ANY reason (`useFrameworks: 'static'` in the resolved config),
this package's own framework becomes exposed to the same
never-gets-embedded failure — the app builds and "launches"
successfully per the CLI, then instantly bounces back to the Home
screen, with a crash report showing:

```
Library not loaded: @rpath/WENotificationInbox.framework/WENotificationInbox
```

The fix is the environment variable, not a Podfile edit: set
`WEBENGAGE_DISABLE_SPM=true` on every CocoaPods run (see
`references/channels/inline.md`'s Step 1 — EAS profile `env`, or the
local shell; this skill's `pod install` step prefixes it) — this forces all
three WebEngage podspecs onto their plain-CocoaPods fallback, which does get
embedded correctly. The apply-step-C post-check requires
`WENotificationInbox` listed as a real pod in `ios/Podfile.lock` (not an SPM
reference) when static linkage is on.

**`react-native-webengage` is not declared as a `peerDependency` of
this package** — npm/yarn won't warn a client who installs this
package without the base SDK already present. Verify it's actually
installed and initialized first; don't rely on tooling to catch a
missing prerequisite here.

**The guarded helper file.** Core Rule 26 applies here too, but this
package's functions are free functions, not methods on the wrapper — so they
get a small helper file of their own that exports them **by the same names**,
each under the same contract (a silent no-op on web and in Expo Go, errors
caught and shown in development only, a safe value instead of a throw). Every
call site below imports from this file instead of from the package, so nothing
else in the snippets changes. It uses `webengageAvailable` and `safeCall` from
the wrapper file (`references/wrapper.md`):

```typescript
// src/analytics/webengageInbox.ts
import { safeCall, webengageAvailable } from './WebEngageManager';

type InboxPackage = typeof import('react-native-webengage-inbox');

// Required lazily so importing this file never throws where the native module
// is missing (web, Expo Go).
let inbox: InboxPackage | null = null;
if (webengageAvailable) {
  try {
    inbox = require('react-native-webengage-inbox');
  } catch (e) {
    if (__DEV__) console.warn('[WebEngage] inbox package unavailable:', e);
  }
}

const run = <T>(
  where: string,
  fn: (pkg: InboxPackage) => T | Promise<T>,
  fallback: T
): Promise<T> => safeCall(where, () => (inbox ? fn(inbox) : fallback), fallback);

export const initWENotificationInbox = () =>
  run<void>('inbox.init', (p) => p.initWENotificationInbox(), undefined);
export const enableDevMode = () =>
  run<void>('inbox.devMode', (p) => p.enableDevMode(), undefined);
export const getNotificationCount = () =>
  run<string>('inbox.count', (p) => p.getNotificationCount(), '0');
export const getNotificationList = (offset?: any) =>
  run<any>('inbox.list', (p) => p.getNotificationList(offset), { messageList: [], hasNext: false });
export const resetNotificationCount = () =>
  run<void>('inbox.reset', (p) => p.resetNotificationCount(), undefined);
export const trackView = (item: any) =>
  run<void>('inbox.trackView', (p) => p.trackView(item), undefined);
export const trackClick = (item: any) =>
  run<void>('inbox.trackClick', (p) => p.trackClick(item), undefined);
export const markRead = (item: any) =>
  run<void>('inbox.markRead', (p) => p.markRead(item), undefined);
// Full scope: add all of them, each the same shape as markRead:
// markUnread, markDelete, readAll, unReadAll, deleteAll.
```

In a plain-JavaScript project drop the types (`typeof import(...)`, `: any`,
`<T>`, `<void>`) and keep the rest.

Call `initWENotificationInbox()` once, in the same app-bootstrap mount
effect as `WebEngageManager.init()` — there's no real ordering
dependency between the two calls. `webengage.initialize()` is a
confirmed no-op on Android and, on iOS, only re-sets a JWT-invalidated
callback that native `AppDelegate` init already sets during app launch
(see Core Rule 3) — nothing in this package's own native module reads
or depends on that call having run. Keeping them in the same effect is
code-organization convenience, not a correctness requirement. Wire
`enableDevMode()` to the same debug-mode source Init already
established, same treatment as In-Line Content:

```typescript
// app/_layout.tsx (or App.tsx) — same mount effect as WebEngageManager.init()
import { initWENotificationInbox, enableDevMode } from '../src/analytics/webengageInbox'; // the helper file above — adjust the path

useEffect(() => {
  WebEngageManager.init();
  initWENotificationInbox();
  if (__DEV__) { // or whatever build-variant check Init's debug-mode answer resolved to
    enableDevMode();
  }
  // ...
}, []);
```

**Version floor is murky — don't overstate it as precise.** The
package's own docs say "Supported from React Native SDK v1.5.0"
without naming which package. The stated "Supported from React Native
SDK v1.5.0" floor does not reliably apply to this specific package —
treat it as unconfirmed rather than an exact gate, and recommend
checking the current release on npm instead.

## Step 3 — Notification Count

```typescript
import { getNotificationCount } from '../src/analytics/webengageInbox';

getNotificationCount().then((count) => {
  // count is a string, e.g. "5" or "9+" — the UNREAD count, not
  // total messages ever received. Never parse it as a number — see
  // Hard Rules. (The helper returns "0" where the SDK isn't available, so
  // a web or Expo Go build simply shows no badge.)
  setBadgeCount(count);
});
```

## Step 4 — Notification List (Full Integration Adds Pagination)

**Quick:** first page only, no pagination UI.
**Full:** adds pagination through the complete list.

```typescript
import { getNotificationList } from '../src/analytics/webengageInbox';

// First page — omit offset entirely, or pass null
getNotificationList().then(({ messageList, hasNext }) => {
  setNotifications(messageList);
  setHasMore(hasNext); // field is `hasNext` — not `hasNotification`
});

// Full Integration only — next page: pass the LAST item from the
// current list as the offset, not a numeric page index
function fetchNextPage(currentList) {
  const offset = currentList[currentList.length - 1];
  getNotificationList(offset).then(({ messageList, hasNext }) => {
    setNotifications([...currentList, ...messageList]);
    setHasMore(hasNext);
  });
}
```

**`offset` is a cursor (the previous page's last item object), not a
page number** — this is easy to get wrong if you assume a REST-style
numeric offset. Default page size is commonly 10, but this isn't
something client code controls — no size parameter exists anywhere in
this package's own code, so it's enforced server-side or inside the
native SDK; don't try to request a different page size from the
client.

## Step 5 — Actions

**Quick:** tap-to-mark-read only, on the item the user opens.
**Full:** adds every single/batch action below.

```typescript
import { markRead, markUnread, markDelete, readAll, unReadAll, deleteAll } from '../src/analytics/webengageInbox';

// Single item — fire-and-forget, no Promise, no return value
markRead(notificationItem);   // no-ops silently if already read
markUnread(notificationItem); // no-ops silently if already unread
markDelete(notificationItem); // no such guard — always proceeds, even if already deleted

// Full Integration only — batch, affects only the items passed in
readAll(selectedItems);
unReadAll(selectedItems);
deleteAll(selectedItems);
```

**None of these ever change the unread count from `getNotificationCount()`.**
Marking one message read does not decrement the badge;
only `resetNotificationCount()` (Step 6) changes it, and only ever to
a hard `0`. If the client expects the badge to tick down as messages
are read individually, tell them plainly that's not how this package
behaves — don't build a client-side decrement to fake it without
flagging the mismatch first.

## Step 6 — Reset Count and Tracking (Mandatory Regardless of Scope)

```typescript
import { resetNotificationCount, trackClick, trackView } from '../src/analytics/webengageInbox';

// Fire on the inbox-entry tap itself, BEFORE navigating to the inbox
// screen — not inside that screen's own mount effect.
function onInboxIconPress() {
  resetNotificationCount();
  navigation.navigate('NotificationInbox');
}
// Entry through a tab bar or a push deep link has no onPress of your own:
// use the tab's `tabPress` listener (Expo Router / React Navigation tabs),
// and for a deep link straight to the inbox call resetNotificationCount()
// from the route that opens it; if neither is possible, say so plainly.

// Mandatory for every notification actually shown/tapped — omitting
// either means WebEngage never records that impression/click data.
// trackView: once per item when it first becomes visible (FlatList's
// onViewableItemsChanged), de-duplicated with a Set of seen ids — never inside a
// list `map` or a render, which would count every re-render.
const seen = new Set<string>();
// keyOf(item): a stable unique field on the message objects the list returns —
// confirm which one in the data you actually get back; don't assume `id`.
// onViewableItemsChanged={({ viewableItems }) =>
//   viewableItems.forEach(({ item }) => {
//     const key = keyOf(item);
//     if (!seen.has(key)) { seen.add(key); trackView(item); }
//   })}
trackClick(notificationItem); // on the tap that opens the item
```

## How to Confirm This Works (the Client's Step)

*Expected behavior per WebEngage's documentation — not yet verified on
Expo.*

1. **Before you start:** the Notification Inbox is enabled on your WebEngage
   account (the support request from Step 0 — while it is pending, nothing
   will appear), and a campaign that delivers to the Notification Inbox has
   been sent to your test user, who is signed in.
2. **Do:** open the app and look at the badge, open the inbox screen, open
   a message, and (Full) scroll to load more, mark a message read or
   unread, or delete one.
3. **Expect:** the badge shows the unread count — a string, possibly
   `"10+"`; opening the inbox resets it (`resetNotificationCount()` at the
   entry tap, before navigating); the first page lists the message (Full:
   more pages load on scroll); opening a message marks it read and is
   tracked.
4. **If you don't see it:** the account-level enablement is still pending;
   no campaign was delivered to that user; you are signed in as a different
   user; `initWENotificationInbox()` is not called at app start.
5. **Tell me** what you saw. I record *confirmed*, *pending*, or the
   problem.

## Hard Rules

1. **`resetNotificationCount()` must fire on the inbox-entry tap
   itself, before navigating to the inbox screen** — not inside that
   screen's own mount effect, and never assumed to happen
   automatically when messages are marked read (it doesn't).
2. **The unread count from `getNotificationCount()` must always be
   treated as an opaque string, never parsed as a number** — values
   like `"9+"` are real, valid, and not numeric.
3. **`trackView()`/`trackClick()` are mandatory for every notification
   shown/tapped** — omitting either silently loses that
   impression/click data, with no error to signal it.
4. **Never build client-side logic that decrements the count on
   `markRead()`** — that's not how this package behaves; the count
   only ever changes via `resetNotificationCount()` (a hard reset) or
   the native SDK's own internal accounting, never a per-message
   decrement in this package's own code.

If the client insists on an alternate implementation for any of the
above, do not implement it that way — record as a Known Risk.

## Rules

- **Errors are swallowed silently by default.** Every action function
  in this package wraps its native call in a try/catch and logs only
  via a debug-mode-gated path — never thrown, never rejected, never
  surfaced to the caller (with the notable exception of
  `getNotificationCount`/`getNotificationList`, which do return real
  Promises whose rejections reach the caller — the helper file catches
  those too and returns `"0"` / an empty first page, with a development
  warning). Recommend `enableDevMode()` in at least staging/QA builds, or
  a broken native link produces zero visible signal in production.
- Recommend checking the current `react-native-webengage-inbox`
  release on npm rather than trusting a specific pinned version — the
  "v1.5.0" floor is unconfirmed for this package (see Step 2), not
  a real gate to build a version check against.
- Screen-tracking/instance-sharing conventions don't apply here the
  way they do for In-Line or Screen Tracking — this package's
  functions are independent of the core `WebEngage()` instance
  entirely, so there's nothing to reuse or share.
- Inbox calls don't route through the `WebEngageManager` class (a
  free-function package has no shared instance to reuse — see
  `references/wrapper.md` → Analytics Wrapper — Architecture), but they do
  follow its safety contract through `webengageInbox.ts`, the same shape In-Line
  Content uses. A call site that imports straight from the package
  (bypassing the helper) is a Rule-level deviation — informational if a Known
  Risk records it, otherwise a real issue.

## Recording State

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

`.webengage/channels/inbox.md` — record:

- Scope chosen (Quick/Full).
- Whether SDK Authentication was requested, and whether the account-
  level enablement request (Step 0, item 3) has been confirmed raised
  and/or completed by the client — a one-time conversational fact, not
  re-derivable from source.
- Exact file+line for: `getNotificationCount`/badge display,
  `resetNotificationCount` (and confirm it's at the tap handler, not
  the destination screen), `getNotificationList` (first page and, if
  Full, the pagination call site), each action used
  (markRead/markUnread/markDelete/readAll/unReadAll/deleteAll),
  `trackView`/`trackClick`.

## Audit Checks

All checks below are Hard-Rule-derived or plain technical correctness
— any violation found is always a real issue; no Known Risk entry
excuses it (per `references/rules.md` → How Audit Interprets a Found Violation),
except where noted otherwise.

1. `resetNotificationCount()` is called at the inbox-entry tap handler,
   before navigation — not inside the destination screen's mount
   effect, and not simply absent — Hard-Rule-derived.
2. The unread count value is never passed through `parseInt`/`Number()`
   or otherwise treated as numeric anywhere it's used — Hard-Rule-
   derived.
3. `trackView()`/`trackClick()` present for every notification actually
   shown/tapped, not just some — Hard-Rule-derived.
4. No client-side logic decrements the displayed count in response to
   `markRead()`/`markUnread()`/`markDelete()` — Hard-Rule-derived; a
   count that ticks down per-action is a sign of exactly the
   misunderstanding this file warns against.
5. If Full Integration: pagination correctly passes the previous
   page's last item as `offset` (not a numeric index), and checks
   `hasNext` before requesting another page — Rule-derived;
   informational if backed by a Known Risk, a real issue otherwise.
6. SDK Authentication and account-level enablement status — client-
   confirmable only, reported as confirmed/pending, never treated as a
   code-level issue on its own.
7. Every call site imports these functions from the guarded helper file
   (`webengageInbox`), not straight from `react-native-webengage-inbox`, and
   none are routed through `WebEngageManager` inconsistently with the rest of
   the app's Inbox call sites (Core Rule 26) — Rule-derived; informational if
   backed by a Known Risk, a real issue otherwise.
