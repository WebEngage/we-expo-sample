# Goal: Engagement Channel Integration — In-App

**Prerequisite:** Init complete.
**Input from Pre-Flight:** screens list — do not rescan.

## No Setup Required for Display

WebEngage shows in-app messages automatically once Init is complete.
Nothing below is a functional dependency for display to work.

## Step 0 — Integration Depth (Read, Never Ask)

Depth was chosen once for the whole integration (`references/depth.md` →
Integration Depth — Asked Once, Core Rule 23) and is recorded in
`.webengage/agent.md` → Locked Facts → `Integration depth` — check
`Depth overrides` for In-App first. **Do not ask it again.** State it in
one line, then act on it:

> Using **Quick** depth, chosen earlier — nothing more to add: in-app
> messages show on their own once a campaign is live on your dashboard.
> One limit: a campaign aimed at a particular *screen* can't match until
> screen tracking is added, which comes with Full. *(or:* Using **Full**
> depth, chosen earlier — adds Screen Tracking and optional In-App
> Notification Callbacks.*)*

If no depth is recorded yet, run the depth question (`references/depth.md`) first.

**Quick** is a genuinely complete outcome here, not a truncated one — and
the limit above is real: with no `screen()` calls, a campaign whose rule is
a screen name (`page.system.screen_name == "home"`) never matches, and the
SDK logs `Notification Page Rule Failed`. Event-triggered campaigns are
unaffected.

**At Quick the Goal writes nothing.** There is no change list to approve and
no code; record it anyway — `.webengage/agent.md` Goal Status: In-App,
Quick, *complete (no code)*, `Confirmation: pending`; add the Unverified
sentence (`references/confirm-and-wrap-up.md`) before the Goal, since In-App
display has not been observed. If it is the last chosen Goal, the one
wrap-up is the closing message.

**Full** proceeds to Step 1, then Step 2.

## Step 1 — Screen Tracking

Stated, not asked (`references/channels/screen-tracking.md` → "Screen
Tracking at Full — Stated, Not Asked"): one line in this Goal's approval,
then that file's setup instructions. A client who says "skip it" is recorded
as skipped, no Known Risk.

## Step 2 — In-App Callbacks (At Full — Stated in the Approval)

At Full the callbacks are part of the Goal (`references/depth.md`), so they
are one line in the approval, not a question: "I'll add observers for
prepare, shown, click and dismiss and route `deepLink` taps — say 'skip
callbacks' to leave them out."

**No native change is ever needed on Expo.** The `webengage-expo`
plugin's native AppDelegate subscriber (iOS) and lifecycle hook (Android)
already wired the native bridge during Init — register the JS-side
callbacks directly. `react-native-webengage` v2.0.0+ is required for the
whole skill (`references/init.md`), so the older per-React-Native-version
AppDelegate wiring those releases needed does not apply here. **Never
hand-edit native source for In-App callbacks** (`SKILL.md` → Scope).

### JS Callbacks

Add to the wrapper's `registerCallbacks()` (per `references/wrapper.md` → Analytics Wrapper — Architecture) — create the method if this is the first
callback the project has, extend it if Init or another channel already
added one; either way, only add this one block, never touch another
Goal's block inside the same method. Register as early as possible —
`registerCallbacks()` is called once, from the root layout's/root
component's mount effect, alongside `WebEngageManager.init()` (Core Rule 19 —
v2.0.0+ buffers only the *first* 50 events per callback type, then
silently drops the rest — not a sliding window of the most recent 50;
see Core Rule 2 for versions below that):

```typescript
// src/analytics/WebEngageManager.ts — inside registerCallbacks()
this.webengage.notification.onPrepare((notificationData) => {
  // Fires before the in-app message is shown. No return value —
  // this SDK's callbacks are pure observers (Core Rule 18), unlike
  // the native Android/iOS SDKs' onPrepare, which can suppress
  // rendering by returning modified data. There is no documented
  // way to suppress an in-app message from this callback on React
  // Native — treat it as observation-only.
});

this.webengage.notification.onShown((notificationData) => {
  // Fires after the message is displayed.
});

this.webengage.notification.onClick((notificationData, clickId) => {
  // clickId identifies which action button was tapped.
  // In-App click data uses `deepLink` (camelCase) — NOT `deeplink`
  // (lowercase), which is what push click data uses. Don't assume
  // they match (see Hard Rules).
  const deepLink = notificationData?.deepLink;
  if (!deepLink) return;
  routeDeepLink(deepLink); // below — a click that routes nowhere is a silent no-op
});

this.webengage.notification.onDismiss((notificationData) => {
  // Fires when the user closes the message.
});
```

**Routing is part of the callback, not a comment.** Write one small
`routeDeepLink(url)` helper in the app (not in the SDK) and use it from this
callback and from `push.onClick`: for a full URL (the app's scheme or a web
link) call `Linking.openURL(url)`, which Expo Router and React Navigation's
linking config already resolve; for a bare in-app path under Expo Router use
`router.push(path)`. A tap that arrives before the navigator has mounted
throws inside the callback and the wrapper's guard swallows it, so the link
silently goes nowhere — keep the link in a variable and route it once the
root layout has mounted. Match the app's own navigation (Pre-Flight's
finding) rather than introducing a second mechanism.

## Sample In-App Payload Shape (For Reference)

```json
{
  "id": "173050749",
  "title": null,
  "description": null,
  "actions": [
    {
      "actionEId": "~3284c402",
      "actionText": "Hello",
      "actionLink": "http://www.google.com",
      "actionCategory": "CTA",
      "type": "EXTERNAL_URL",
      "isPrime": true
    }
  ],
  "layoutId": "~483819e",
  "notificationEncId": "13cjj4m"
}
```

Treat every field as nullable and confirm presence before use — not
every campaign type populates every field.

## How to Confirm This Works (the Client's Step)

*Expected behavior per WebEngage's documentation — not yet verified on
Expo.*

1. **Before you start:** an In-App campaign created on the dashboard,
   live, and targeting your test user — triggered by an event the app fires
   (*{event from Tracking Events}*) or, if Screen Tracking was added, by
   opening a screen (*{screen names}*). Use the dashboard's test option on
   your registered test device before relying on real targeting.
2. **Do:** trigger it — fire the event, or open the targeted screen.
3. **Expect:** the message appears on its own; no app code is needed to
   display it. If In-App callbacks were added (Full): `notification.onPrepare`
   then `onShown` fire, tapping the call-to-action fires
   `notification.onClick` with the click ID and `deepLink` (camelCase), and
   closing it fires `onDismiss`. A screen-targeted campaign appears only on
   its screen.
4. **If you don't see it:** the campaign isn't live or targets a different
   user; the event or screen name differs from what the campaign expects;
   this build was made before the Init config — rebuild after config
   changes.
5. **Tell me** what you saw. I record *confirmed*, *pending*, or the
   problem.

## Hard Rules

1. **No callback in this SDK takes or expects a return value** (Core
   Rule 18). Never write `return false`/`return true` conventions into
   these callbacks the way the native Android/iOS SDKs require —
   there's nothing on the RN side listening for it.
2. **Push click data uses `deeplink` (lowercase); in-app click data
   uses `deepLink` (camelCase).** Do not assume the two payloads share
   a casing convention — read from the correct key for each callback.
3. **`react-native-webengage` must be v2.0.0+** — below it, callback
   delivery needs native AppDelegate wiring this skill never writes, so
   In-App callbacks silently don't arrive on iOS (and the 50-event queue
   in Core Rule 19 doesn't exist). The `webengage-expo` plugin requires
   v2.0.0+ as a peer dependency regardless.

If the client insists on an alternate implementation, do not implement
it that way — record as a Known Risk.

## Rules

- If Pre-Flight found `react-native-webengage` below v2.0.0, upgrading
  is part of Init (`references/init.md`), not a callback-specific
  recommendation here.

## Recording State

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

`.webengage/channels/inapp.md` — Quick/Full chosen, screen tracking
decision (proceeded / declined / not presented — Quick depth,
cross-referencing `screen-tracking.md`). **If callbacks are in use, confirm
they live inside the wrapper's `registerCallbacks()`** (per `references/wrapper.md`
→ Analytics Wrapper — Architecture) and record that file+line — same
reasoning as `push.md`'s Recording State: this is what `Goal: Audit`
needs on hand to answer "where are WebEngage's callbacks implemented"
without re-deriving it from a fresh scan.

## Audit Checks

1. If callbacks are in use: none of them rely on a return value —
   Hard-Rule-derived, always an issue if violated.
2. `deepLink` (in-app) vs `deeplink` (push) read from the correct key
   in each callback — Hard-Rule-derived.
3. If callbacks are in use: the installed `react-native-webengage` is
   v2.0.0+ — Hard-Rule-derived.
4. At Full depth, Screen Tracking was presented (per the shared
   reference) and a decision — proceed or decline — is on record. Missing
   entirely (never presented) is a process gap; declined-and-recorded is
   informational. **At Quick depth it is never presented** (Step 1 is Full
   only): "not presented — Quick depth" is the recorded outcome, a depth
   choice and not a gap.
5. Callback registration happens early (app-mount, not deep inside a
   conditionally-rendered screen) — Rule-derived; informational if
   backed by a Known Risk, a real issue otherwise (events fired before
   a late registration beyond the SDK's 50-event queue are silently
   lost, per Core Rule 19).
6. `notification.onPrepare/onShown/onClick/onDismiss` found registered
   outside the wrapper's `registerCallbacks()` — Rule-derived (per
   `references/wrapper.md` → Analytics Wrapper — Architecture); informational if
   backed by a Known Risk, a real issue otherwise.
