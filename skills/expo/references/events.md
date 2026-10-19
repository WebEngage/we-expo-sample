# Goal: Tracking Events

**Prerequisite:** Init complete.
**Input from Pre-Flight:** candidate events (name, properties, file &
line, reasoning), and whether an Analytics wrapper exists — do not
rediscover, reference them directly.

**Note:** Hard Rules and Rules below only apply to what's actually
being implemented this session — a numeric-type rule doesn't come up
for an event with no numeric properties.

## System Events vs. Custom Events

**WebEngage tracks System Events automatically, the moment Init is
complete — nothing in this Goal implements them, and none of it needs
asking about.** They're pre-defined by WebEngage and cover generic
platform/campaign interactions: e.g. App Installed, App Crashed,
Session Started, Push Notification Click, Email Open. WebEngage's own
docs don't publish a complete, exhaustive list — don't imply one to
the client, and don't try to reconstruct one from behavior.

**Everything this Goal actually does is Custom Events** — business-
specific actions the client defines and this Goal implements via
`track()` (e.g. `Product Page Viewed`, `Checkout Completed`). The rest
of this file is entirely about Custom Events; every "event" from here
on means a Custom Event unless stated otherwise.

## Step 0 — Integration Depth (Read, Never Ask)

Depth was chosen once for the whole integration (`references/depth.md` →
Integration Depth — Asked Once, Core Rule 23) and is recorded in
`.webengage/agent.md` → Locked Facts → `Integration depth` — check
`Depth overrides` for this Goal first. **Do not ask it again.** State it
in one line, then go straight to Step 0.5:

> Using **Quick** depth, chosen earlier — the 1–2 highest-value events.
> *(or:* Using **Full** depth, chosen earlier — every candidate event.*)*

If no depth is recorded yet (this is the first scope-bearing Goal), run
the depth question (`references/depth.md`) first, then continue here.

- **Quick:** **the skill chooses** the 1–2 most valid, highest-value
  events (typically the primary conversion action — e.g. `Order Placed`)
  and shows them in the one approval message — no menu of options. The
  Quick counts are guidelines, not a cap: if the client adds more, it is
  still Quick — record the number chosen.
- **Full:** proceed through the complete candidate list, reconciled
  against an existing data model if Step 0.5 finds one.

## Step 0.5 — Existing Data Model & Naming Convention Check

Ask for the events in this Goal (Tracking User asks its own, for
attributes — `references/user.md` → Step 2). **If the Locked Facts row
`Existing data model — events` already exists (for example after a Quick
pass), don't ask again.**

> Do you already have a WebEngage events data model defined — event names
> and properties set up in the dashboard, or a spec or sheet — that this
> integration should follow?

Record the answer as the Locked Facts row `Existing data model — events`.
If a spec exists, reconcile the skill's chosen events against it and show
only what changed.

- **If yes:** treat it as source of truth. Reconcile Pre-Flight's
  candidates against it; flag naming or property mismatches rather
  than silently picking one.
- **If no:** the skill decides the naming and never asks — follow the
  app's own style if it already names things consistently, otherwise Title
  Case (WebEngage's own convention in its examples); state it in one line
  of the approval message and apply it consistently across every event
  implemented this session.

*Shape of the Quick approval message (a shape, not a script):*
> Do you already have WebEngage event names set up (dashboard or a spec)
> that I should follow? Meanwhile: I'll track `Order Placed` (Order ID, Amount
> and Item Count as numbers; Currency assumed USD) and `Added To Cart`,
> named in Title Case like the rest of the app, at the places where those
> actions already happen. No personal data goes into event properties.
> *{N more candidates were left out.}* OK?

**At Quick, one message, one approval:** the candidate table (Step 1) goes
out in the same message as any question this Goal still needs (never more
than three — `SKILL.md` → How to Talk to the Client), then one approval
before writing code.

## Step 1 — Present the Candidate List

**Check each event's property count per data type against the 25 limit
(Naming & Type Limits below) before presenting the table.**

**Every property's type must be one of exactly six allowed types —
String, Number, Boolean, Date, Array, Object.** Map
each candidate property's actual source type in the client's code to
the correct one of these six before presenting the table below — don't
default everything to String, and don't invent a type outside this
list. Array/Object properties are usable for campaign personalization
only, never for building dashboard segments (Naming & Type Limits
below) — worth flagging to the client if a candidate property is
array/object-shaped and their use case is segment-driven, same as the
recommendation already given for user attributes.

```
📋 CANDIDATE EVENTS
──────────────────────────────────────────────────────────────────────
Event Name         | Properties (type)     | PII? | File & Line | Reasoning
──────────────────────────────────────────────────────────────────────
`Signup Completed` | `referralCode` (Str)  | No   | ...         | ...
                    | `plan` (String)       | No   | ...         | ...
──────────────────────────────────────────────────────────────────────
```
*(For the agent: personal data is left out of event properties and the
approval message says so; very sensitive data is never sent. No question.)*

Events found only inside a loop are flagged `⚠️ LOOP — needs redesign`
in this table, not proposed as-is. PII found in an existing tool's
equivalent event is left out the same way, and named in the approval
message.

**Say these up front, in the table message, so they aren't a surprise:**
- **No page-view events.** Events are user actions, not navigation, which is why a "Product Viewed" or "Checkout
  Started" that would fire just because a screen opened isn't on the list.
  Screen visits are Screen Tracking's job
  (`references/channels/screen-tracking.md`); a client who deliberately wants
  a page view as a metric can have one, as their explicit call.
- **Paths that fire an event for two meanings.** When a call site runs
  another flow's function first — a "Buy Now" that calls the add-to-cart
  function and then checkout, so it also fires `Added To Cart` — list it in
  the table ("also fires *Added To Cart*") and state the default in the
  approval (keep both, unless it would double-count a conversion) — a
  statement the client can change, not a question.
- **Money needs a currency.** When an event carries an amount, add a
  `Currency` property with it, or state the assumption in the approval
  ("all amounts are USD") — a statement, not a question.

## Step 2 — Implement Approved Events

Add `trackEvent()` to the existing Analytics wrapper (per `references/wrapper.md` →
Analytics Wrapper — Architecture) if it isn't there yet — extend the
file Init/Tracking User already created, don't duplicate it:

```typescript
// src/analytics/WebEngageManager.ts — add this method
trackEvent(name: string, properties?: Record<string, string | number | boolean | Date | any[] | object>): void {
  if (properties) {
    this.webengage.track(name, properties);
  } else {
    this.webengage.track(name);
  }
}
```

Then call the wrapper from every event's call site — never
`webengage.track(...)` directly:

```typescript
// Without properties
WebEngageManager.trackEvent('Signup Completed');

// With properties — numeric values stay numeric, never stringified;
// date values are a native Date, never a formatted string
WebEngageManager.trackEvent('Order Placed', {
  'Order ID': 'ORD_001',
  'Amount': 2300,
  'Delivery Date': new Date('2017-01-09T00:00:00.000Z'),
  'Products': [{ 'SKU Code': 'UHUH799', 'Price': 300.49 }],
});
```

**Where to place the calls.** When the app has central functions for its
actions (`addToCart`, `placeOrder`, a store action or service), put the
wrapper call there — it covers every UI entry point; use screen-level sites
only when the actions live in screens. A small app-level helper is fine when
the same properties are assembled in several places; it calls
`trackEvent()`, never `webengage.track()`. **Never call the wrapper inside a
React `setState` updater function** — React may run an updater twice, and
the event would fire twice.

**Properties built at runtime.** Fixed property names can be checked against
the limits below when the call is written. Names that exist only at runtime
(for example, a user-defined key/value attached to an action) can't be:
one that is 50+ characters or starts with `we_` is silently ignored. Tell the
client; if they want protection, add a small filter in the wrapper's
`trackEvent()` (skip or truncate such keys) — their choice, not a default.
**When standard and custom properties could share a name, decide which wins**
and say so: spread the standard properties *after* the custom ones (`{
...custom, ...standard }`) so the standard values win a clash.

## Recording State

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

Record in `.webengage/agent.md`: scope applied (Quick/Full — the recorded Integration depth, or this Goal's override), naming
convention used (decided by the skill), any deferred items — at Quick, the names of the
candidate events not implemented (and their count), and
**every implemented event's full
breakdown, not just a count**: event name, each property with its
confirmed type, PII status, and call-site file:line. A bare "6/6
events" tells a future session or `Goal: Audit` nothing about *what*
was actually built; the full per-event table is what lets
`references/audit.md`'s Tracking Events table render without a fresh
re-scan, the same reasoning `push.md`'s Recording State already
applies to callback locations.

`agent.md`'s table is sufficient for most integrations — no separate
`.webengage/events/` file is needed unless a specific event's own
decisions genuinely outgrow a table row (e.g. a complex,
multi-variant event with per-platform property differences worth
documenting in full). If that happens, create
`.webengage/events/<event-name>.md` for that one event's full detail
and leave a one-line pointer to it in `agent.md`'s table row — don't
create one preemptively for every event.

## Step 3 — Mark Completion, Hand Off

After recording state above:

> Tracking Events is done — [Quick: 2/6 events | Full: 6/6 events].
> To check it works, see *How to Confirm This Works* below — that part is
> yours; I don't run the app.

Say nothing more — the Goals and channels were chosen at the start. If the
client hasn't chosen any, name Engagement Channels in a single line; don't
ask what to work on next.

## How to Confirm This Works (the Client's Step)

*Expected behavior per WebEngage's documentation — not yet verified on
Expo.* Fill the names below from `.webengage/agent.md`'s event table.

1. **Before you start:** a test build running with debug mode on (Init's
   debug-mode default), signed in as a test user (Tracking User) — events
   attach to that profile.
2. **Do:** perform each action that fires one of the events recorded for
   this Goal (*{event name → what the user does}*).
3. **Expect:** on the WebEngage dashboard, **Users** → search your test
   identifier → open the profile → **Activity Info**. Each event appears
   by its exact name, with its properties and values (numbers as numbers,
   dates as dates). Allow a few minutes if nothing appears.
4. **If you don't see it:** the name differs in case or spacing; you
   triggered a different path than the call site recorded (*{file:line}*);
   you are signed in as a different user than the one you are searching;
   the license code or data center is wrong; on Android,
   `adb logcat -d -s WebEngage` shows what the SDK is doing.
5. **Optional — read it in the iOS log** (Xcode console, verbose logging
   on; observed on iOS with Expo SDK 55, not yet on Android). Search for
   `Reporting events to network with payload:` — a JSON array follows. Your
   events have `category: application` (`system` = WebEngage's built-ins),
   the exact `event_name`, the `cuid` you logged in with (`null` = still
   anonymous), and `event_data` with each property name and JSON type —
   numbers should be numbers, not quoted strings. `EVENT_SYNC : status code :
   200` after the batch means it was delivered. If only some of your events
   appear, only those were fired in that run — say which, and I record the
   Goal as partly confirmed.
6. **Tell me** what you saw. I record *confirmed*, *pending*, or the
   problem.

## Hard Rules

1. **No events inside loops** (Core Rule 11) — propose a single event
   with a count or array property instead (e.g. `itemCount`, or an
   `items` array). If the client insists on per-item firing, do not
   implement it — record as a Known Risk.
2. **Numeric values must use numeric types, never strings** (e.g.
   `Amount: 2300`, not `Amount: "2300"`) — a string-typed number
   breaks dashboard-side filtering and aggregation on that property.
   If the client insists on a string, don't implement it that way —
   record as a Known Risk.
3. **Date-type event properties must be passed as a native JS `Date`
   object, never a manually-formatted string** (e.g.
   `new Date('2017-01-09T00:00:00.000Z')`). The mechanism: `track()`'s
   own JS wrapper runs the whole properties object through
   `JSON.stringify`/`JSON.parse` before it ever reaches the bridge —
   `JSON.stringify` calls a `Date`'s built-in `.toJSON()` automatically,
   which is *why* a raw `Date` survives intact. This is incidental JS
   behavior in this one wrapper method, not the native SDK doing
   anything special — and `setAttribute` (user custom attributes, see
   `references/user.md`) has no equivalent round-trip, so the same
   raw-`Date`-just-works assumption does **not** carry over there.

If the client insists on an alternate implementation for any of the
above, do not implement it that way — record as a Known Risk.

## Rules

- **PII in event properties:** left out (the user attribute is where it
  belongs). If the client asks for ordinary contact data in an event,
  implement it their way and record as a Known Risk.
- Naming convention decided by the skill and applied consistently. Client
  preferring otherwise: record as a Known Risk.
- Don't replicate an existing tool's event taxonomy verbatim — use it
  as reference (Core Rule 9), improve naming/structure where it's
  weak. A client wanting exact 1:1 parity with an existing tool's
  event names for cross-tool reporting continuity: record as a Known
  Risk — it does carry over that tool's naming debt, even though it's
  not a technical defect.
- No duplicate WebEngage events for the same action even where an
  existing tool has an equivalent.

## Naming & Type Limits

- Event names and attribute names: under 50 characters.
- Attribute names are case-sensitive.
- String attribute values: under 1000 characters (truncated beyond
  that).
- No event or attribute name may start with `we_` — reserved for
  WebEngage's internal use, silently ignored otherwise.
- Max 25 event attributes per data type, per event.
- **First datapoint locks the type** for a given attribute name —
  changing an attribute's type on a later event silently stops that
  attribute's data from flowing to the dashboard. Confirm types before
  implementing, especially when reconciling against an existing data
  model (Step 0.5).
- Array/Object attribute values are usable for campaign personalization
  only — they cannot be used to build dashboard segments the way
  String/Number/Boolean/Date values can. Worth mentioning if a
  candidate property is array/object-shaped and the client's use case
  is segment-driven.

## Audit Checks

1. No event fires from inside a loop construct — Hard-Rule-derived,
   always an issue if violated.
2. All numeric properties use numeric types, not strings — Hard-Rule-
   derived, always an issue if violated.
3. All date-type properties are `Date` instances, not strings — Hard-
   Rule-derived, always an issue if violated.
4. PII present in an event property — Rule-derived; informational if
   backed by a Known Risk entry, a real issue if not.
5. Naming convention consistency, duplicate events — Rule-derived,
   same informational-vs-issue treatment based on whether a Known Risk
   entry backs the deviation.
6. No name (event or attribute) starts with `we_`, none exceed the
   50-character limit — plain technical correctness, always an issue
   if violated.
7. Every implemented event traces to an approved candidate or a
   reconciled data-model entry — not a deviation check, confirms
   traceability exists.
8. No event call site calls `webengage.track(...)` directly instead of
   going through the Analytics wrapper — Rule-derived (per `references/wrapper.md`
   → Analytics Wrapper — Architecture); informational if backed by a
   Known Risk entry, a real issue otherwise.
