# Goal: Tracking User

**Prerequisite:** Init complete.
**Input from Pre-Flight:** auth flow mapping (all login/logout/
session-restore locations), candidate user attributes, and whether an
Analytics wrapper exists — do not rediscover, reference them directly.

**Note:** Hard Rules and Rules below only apply to the data actually
being implemented this session. If Quick Integration excludes birth
date entirely, the birth-date Hard Rule simply doesn't come up — do
not raise a rule for an attribute type that wasn't selected.

## Step 1 — Integration Depth (Read, Never Ask)

Depth was chosen once for the whole integration (`references/depth.md` →
Integration Depth — Asked Once, Core Rule 23) and is recorded in
`.webengage/agent.md` → Locked Facts → `Integration depth` — check
`Depth overrides` for this Goal first. **Do not ask it again.** State it
in one line, then go straight to Step 2:

> Using **Quick** depth, chosen earlier — login, logout and 1–2 key
> attributes. *(or:* Using **Full** depth, chosen earlier — every
> applicable attribute.*)*

If no depth is recorded yet (this is the first scope-bearing Goal), run
the depth question (`references/depth.md`) first, then continue here.

- **Quick:** Login and logout are always included regardless of scope.
  **The skill chooses** the 1–2 attributes worth prioritizing (e.g. a
  non-PII segment field, or email if the use case is clearly
  communication-led) and shows them in the one approval message — no
  menu of options. The Quick counts are guidelines, not a cap: if the
  client adds more, it is still Quick — record the number chosen.
- **Full:** proceed through the complete candidate list (Step 6),
  reconciled against an existing data model if Step 2 finds one.

## Step 2 — Existing Data Model Check

Ask for the user attributes in this Goal (Tracking Events asks its own,
for events):

> Do you already have a WebEngage user attribute model defined — attribute
> names and types set up in the dashboard, or a spec — that this
> integration should follow?

Record the answer (and where the spec lives, if given) as the Locked Facts
row `Existing data model — attributes`. If yes, treat it as source of truth; reconcile Pre-Flight's candidates
against it and flag mismatches. If no, Pre-Flight's candidates are the
starting draft.

**At Quick, one message, one approval.** Put the data-model question, the
identifier (only if it is ambiguous — Step 3) and the attribute table
(Step 6) into a single message (never more than three questions; `SKILL.md`
→ How to Talk to the Client), then one approval before writing code. If the
client says a spec exists, reconcile the chosen rows against it afterwards
and show only what changed. At Full the complete list also goes in one
approval message (a long list is grouped by data type, not split into
rounds). **If the Locked Facts row `Existing data model — attributes` already
exists (for example after a Quick pass), do not ask the data-model question
again.**

*Shape of the Quick approval message (a shape, not a script):*
> Do you already have WebEngage attribute names set up (dashboard or a
> spec) that I should follow? Meanwhile here's my plan: pass your user id
> to `login()` (from your sign-in code) and call `logout()` on every sign-out
> path; track `plan` and `email` (⚠️ personal data — say "drop email" to
> remove it); guests stay anonymous and a restored session re-identifies at
> launch. *{N more attributes were left out.}* OK?

## Step 3 — Confirm Identifier Type

**Pre-fill it, ask only if ambiguous.** Pre-Flight found login at
{{file:function list}} — take the identifier from what that code already
passes (a user id, an email) and state it in the approval message. Ask
only when the code points to more than one candidate:

> I found login at {{file:function list}}.
> What identifier should be passed to `login()`?
> (email / phone / userId / a custom identifier — CUID or any other
> client-generated unique ID)

**Constraints on the identifier, confirmed from the official docs —
mention these while confirming, not after implementation:** max 100
characters; **cannot be changed once assigned to a user** — choosing
wrong now means a support-mediated fix later, not a simple re-call;
WebEngage's own recommendation is to prefer a system-generated ID
(a database primary key, a UUID) over email/phone/username, since
those can themselves change over a user's lifetime and aren't
guaranteed unique/stable the way a system-generated ID is.

## Step 4 — Login

Add `login()` to the Analytics wrapper (per `references/wrapper.md` → Analytics Wrapper — Architecture) — extend the file Init created, don't
duplicate it:

```typescript
// src/analytics/WebEngageManager.ts — add this method
login(userId: string): void {
  this.webengage.user.login(userId);
}
```

**This is the whole signature by default — no `jwtToken` parameter at
all, even as an unused optional one.** SDK Authentication is opt-in
(see below); if the client asks for it, that's what *amends* this
method to accept a token, not something already latent in the default
signature waiting to be used.

Then inject a call to the wrapper into every discovered login success
path — never call `webengage.user.login(...)` directly from these
sites:

```typescript
WebEngageManager.login('IDENTIFIER_VALUE');
```

**Prefer the app's central function.** When the app already funnels
sign-in, sign-up and sign-out through one function (an auth context, a store
action, a service), put the wrapper call there: it covers every entry
point, including ones Pre-Flight's screen-by-screen map can miss (a guest
screen's "Log in or sign up" button that calls `logout`). Use screen-level
call sites only when authentication is spread across screens. If the same
attribute set is re-sent from several places (login, signup, profile edit),
a small app-level helper that builds and sends it is fine — it calls the
wrapper, never `webengage.user.*`. **Never call the wrapper inside a React
`setState` updater function** — React may run an updater twice.

## Step 5 — Logout

```typescript
// src/analytics/WebEngageManager.ts — add this method
logout(): void {
  this.webengage.user.logout();
}
```

```typescript
WebEngageManager.logout();
```

**Guests and restored sessions — state the recommended policy in the
approval message (a statement the client can change, not a question), don't
leave it implicit.**
- **`logout()` only acts when an identity is set.** With nobody logged in
  the SDK ignores it and logs `[WEGUser logout] ERROR: WARNING: logout
  called when no user is currently logged in. Ignoring the call.` — harmless,
  but it also does **not** reset the anonymous profile, so don't use it as a
  "reset the guest" call.
- **Guest mode:** don't call `login()` for a guest — they stay anonymous
  until they sign in. Call `logout()` only on a path where someone was
  signed in; a guest "exit" has nothing to log out.
- **A restored session** (the app signs the user in at launch from stored
  credentials, bypassing the login screen): WebEngage's documentation doesn't
  say whether the SDK keeps the identity across launches by itself, so
  don't promise either way. Recommend calling `login(userId)` at the
  restore site too, so the profile is identified from the first session; the
  client can decline. Record the decision (`.webengage/agent.md`) and, when
  Pre-Flight mapped a session-restore path, say which way it went.

## Step 6 — Profile / User Attributes

**Always present the list with data types before creating
any of them (complete at Full; at Quick, the chosen rows plus the count of the others) — never implement attributes piecemeal as they come up in
conversation.** WebEngage caps custom attributes at 25 per data type
(see Naming & Type Limits below); the client needs to see the whole
picture, typed, to prioritize correctly if candidates are anywhere
close to that cap — not discover it after several are already live.
This applies at both Quick and Full scope, just at different list
sizes: **at Quick, show only the 1–2 proposed rows plus a one-line count of
the other candidates** ("6 more candidates were left out"); at
Full, the complete list.

Present the confirmation table:

```
📋 USER ATTRIBUTE CONFIRMATION
────────────────────────────────────────────────────────────────────────────
Attribute       | Data Type | Source Field             | PII? | Wrapper Call
────────────────────────────────────────────────────────────────────────────
email           | String    | user.email               | ⚠️   | WebEngageManager.setEmail(email)
birthDate       | String    | user.dob                 | ⚠️   | WebEngageManager.setBirthDate(date)
isPremiumUser   | Boolean   | user.plan.isPaid         | No   | WebEngageManager.setAttribute("isPremiumUser", value)
────────────────────────────────────────────────────────────────────────────
String 3/25 · Number 1/25 · Boolean 1/25 — counts per data type for this
list; dashboard attributes already in use also count toward the 25 and
can't be seen from code, so say so once at Full.
```
*(For the agent: very sensitive data is skipped with one line, no question;
ordinary contact data stays in the table with ⚠️ and the client strikes any
they don't want.)*

**Standard setter or custom attribute?** The standard setters are exactly
the ones in the wrapper block below (email, phone, first/last name, gender,
company, birth date, location). A common field with no setter there — for
example `city` — silently becomes a **custom** attribute and counts toward
the 25-per-type cap; label such rows "custom" in the table's wrapper-call
column so the client sees what counts.

## Step 7 — Record State, Mark Completion, Hand Off

**After the state below is recorded, refresh the two notes files — silently** (`references/progress-reports.md`, Core Rule 29): add each file this Goal wrote to `agent.md`'s *Files Changed* table and anything still waiting on the client to *Open at the Client*, then regenerate `webengage-progress.md` and `webengage-support-summary.md`.

Record in `.webengage/agent.md`: scope applied (Quick/Full — the recorded Integration depth, or this Goal's override), whether SDK
Authentication was enabled, any deferred items, whether WebEngage
support has *confirmed enablement* if `setHashedEmail`/`setHashedPhone` are
in use (they are never added before that — a one-time conversational fact,
not re-derivable from source on a later scan; give it its own Locked Facts
row, not a buried mention), and —
this is the part worth being deliberate about — **every implemented
attribute's full breakdown, not just a count**: attribute name, its
confirmed data type, and its wrapper method. A bare "8/8 attributes"
tells a future session or `Goal: Audit` nothing about *what* was
actually built; the full per-attribute table is what lets
`references/audit.md`'s Tracking User table render without a fresh
re-scan, same reasoning as `references/events.md`'s equivalent. Also
record the guest/restored-session decision when one was made.

Then hand off:

> Tracking User is done — [Quick: 2/8 attributes | Full: 8/8
> attributes]. To check it works, see *How to Confirm This Works* below —
> that part is yours; I don't run the app.

Say nothing more — the Goals were chosen at the start. If the client hasn't
chosen any further Goal, name the next one in a single line (Tracking Events
if not done yet); don't ask what to work on next.

## How to Confirm This Works (the Client's Step)

*Expected behavior per WebEngage's documentation — not yet verified on
Expo.* Fill the names below from `.webengage/agent.md`.

1. **Before you start:** a test build running with debug mode on (Init's
   debug-mode default), and a test account you can sign in to.
2. **Do:** sign in with the identifier chosen in Step 3 (*{identifier
   type}*), set or change the attributes recorded for this Goal (*{names}*),
   then sign out.
3. **Expect:** on the WebEngage dashboard, **Users** → search that
   identifier → open the profile. You should see a profile for that ID and
   each recorded attribute with the right value and type. After signing out
   and in as someone else, the second profile must not show the first
   person's data. Allow a few minutes if nothing appears.
4. **If you don't see it:** you searched a different identifier than the
   one passed to `login()`; `login()` ran before sign-in finished
   (it belongs in the success path only); the license code or data
   center is wrong; on Android, `adb logcat -d -s WebEngage` shows what the
   SDK is doing.
5. **Optional — read it in the iOS log** (Xcode console, verbose logging
   on; observed on iOS with Expo SDK 55, not yet on Android). Search for
   `Reporting events to network with payload:` — a JSON array follows, and
   each element has `event_name`, `category` (`system` = built-in,
   `application` = your own), `cuid` (the `login()` identifier; `null` means
   still anonymous), `event_data` and `system_data`. Look for a
   `user_logged_in` system event with the identifier you expect, and
   `user_update` system events — standard fields in `system_data`
   (`first_name`, `email`…), custom attributes in `event_data`. A line
   `EVENT_SYNC : status code : 200` after the batch means it was delivered.
6. **Tell me** what you saw. I record *confirmed*, *pending*, or the
   problem.

## SDK Authentication (JWT) — Opt-In Only, Do Not Propose

Per Core Rule 15, the default is plain `login(userId)` — no token
parameter, not even an unused one reserved for later. Do not raise SDK Authentication as an
option; implement it only if the client explicitly asks for it — and
even then, confirm SDK Authentication is actually enabled on the
account first (a WebEngage support-team-mediated setting, not
something the client can just turn on from app code) before writing
any of this. If they do, *amend* Step 4's `login()` method itself to
add the token parameter — don't leave the plain version in place
alongside a separate call:

```typescript
// src/analytics/WebEngageManager.ts — Step 4's login() amended,
// only once SDK Authentication is confirmed enabled on the account
login(userId: string, jwtToken?: string): void {
  this.webengage.user.login(userId, jwtToken);
}
```

```typescript
WebEngageManager.login(userId, jwtToken);
```

**Guard against a falsy `jwtToken` reaching the SDK.** The method
signature accepts `jwtToken` as optional, but at the call site this
means "SDK Authentication is off" — the SDK has no separate way to
distinguish "caller passed no token on purpose" from "caller passed an
empty string/`undefined`/`null` by a bug upstream (e.g. a token fetch
that failed silently)." Either way the SDK falls back to a plain,
non-secure login with no error or warning. Once SDK Authentication is
confirmed enabled on the account, treat a missing token at this call
site as a bug to fix at the source, not a value to pass through — e.g.
warn loudly in development (the wrapper never throws — Core Rule 26)
rather than letting `this.webengage.user.login(userId, jwtToken)` silently
downgrade:

```typescript
login(userId: string, jwtToken?: string): void {
  if (!jwtToken) {
    console.warn('[WebEngage] login() called without a jwtToken while ' +
      'SDK Authentication is enabled — this call will silently fall ' +
      'back to non-secure login.');
  }
  this.webengage.user.login(userId, jwtToken);
}
```

Also add a token-invalidation handler and the ability to refresh a
token for a user. Add it to the wrapper's `registerCallbacks()` (per
`references/wrapper.md` → Analytics Wrapper — Architecture; create the method if
this is the first callback the project has, extend it if Init or a
channel already added one) — register this one earliest of all: per
Core Rule 19, it has zero buffer (not even the single-value cache
`onAnonymousIdChanged` gets), so a `tokenInvalidated` fired before
it's registered is lost permanently:

```typescript
// src/analytics/WebEngageManager.ts — inside registerCallbacks(),
// first in the method body (zero buffer — see Core Rule 19)
this.webengage.user.tokenInvalidatedCallback(() => {
  // fetch/derive a fresh JWT, then:
  this.webengage.user.setSecureToken(userId, newSecureToken);
});
```

Record the decision to enable SDK Authentication in
`.webengage/agent.md`'s Locked Facts — once a client asks for it, it's
a standing fact for the project, not something to re-ask each session.

## Analytics Wrapper — Attribute Methods

Add these to the existing wrapper file (extend, don't recreate):

```typescript
// src/analytics/WebEngageManager.ts — add whichever methods this
// session's approved attributes actually need

// Standard attributes — always use dedicated methods, never
// setAttribute for these
setEmail(email: string): void { this.webengage.user.setEmail(email); }
setPhone(phone: string): void { this.webengage.user.setPhone(phone); } // E.164, e.g. '+14155552671'
setFirstName(name: string): void { this.webengage.user.setFirstName(name); }
setLastName(name: string): void { this.webengage.user.setLastName(name); }
setGender(gender: string): void { this.webengage.user.setGender(gender); } // 'male' | 'female' | 'other'
setCompany(name: string): void { this.webengage.user.setCompany(name); }
setLocation(lat: number, lng: number): void { this.webengage.user.setLocation(lat, lng); }

// Birth date — 'yyyy-mm-dd', date-only (see Hard Rules — matches Android/iOS)
setBirthDate(date: string): void { this.webengage.user.setBirthDateString(date); }

// Custom attributes — String, Number, Boolean, Date, Array, and Object are
// all accepted (Array/Object recursively, per the official docs). Unlike
// track()'s properties, setAttribute's JS wrapper does not run the value
// through a JSON round-trip, so a raw Date does not survive the bridge
// (see Hard Rules) — this method converts Dates to ISO strings itself, so no
// call site has to remember.
setAttribute(
  key: string,
  value: string | number | boolean | Date | any[] | Record<string, any>
): void {
  const wire = (v: any): any =>
    v instanceof Date
      ? v.toISOString()
      : Array.isArray(v)
        ? v.map(wire)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, wire(x)]))
          : v;
  this.webengage.user.setAttribute(key, wire(value));
}
deleteAttribute(key: string): void { this.webengage.user.deleteAttribute(key); }
deleteAttributes(keys: string[]): void { this.webengage.user.deleteAttributes(keys); }
```

**`setHashedEmail()`/`setHashedPhone()` are deliberately not in the
block above — opt-in and support-gated, same shape as SDK
Authentication, not standard fields to add just because a client asks.**
Not publicly documented: the method call itself works client-side the
same as any other attribute setter, but making WebEngage's backend
actually maintain/match on hashed data requires WebEngage's team to
configure that on the account side too. **If a client asks for either,
route them to WebEngage support first — don't write the method yet.**
Confirm the account-side enablement is actually done (a fact to
record, not something verifiable from code) before adding either
method to the wrapper. **If the client isn't sure**, don't add either method:
record the question under *Unresolved Questions* in `.webengage/agent.md` and
carry on with the standard setters.

```typescript
// src/analytics/WebEngageManager.ts — add only once the client has
// confirmed WebEngage support has enabled hashed-attribute matching
// on the account
setHashedEmail(hashedEmail: string): void { this.webengage.user.setHashedEmail(hashedEmail); }
setHashedPhone(hashedPhone: string): void { this.webengage.user.setHashedPhone(hashedPhone); }
```

**Never compute the value in app code.** Whatever is passed to
`setHashedEmail()`/`setHashedPhone()` must already come from the client's
own hashing/encryption system, in the format their WebEngage account setup
expects — never generated at the call site (for example `sha256(email)`
written into the app). WebEngage cannot match a self-made hash, and this
skill never writes one.

**Deliberately not wrapped: `setDevicePushOptIn()` and `setOptIn()`.**
These are called directly on the shared `WebEngage`
instance from `references/channels/push.md`, at the Android 13
permission-result call site, not through this wrapper. Wrapping them
here would make Push's completeness depend on whether Tracking User
has already run and added the method; calling the shared instance
directly avoids that ordering dependency, since Goals can be done in
any order after Init.

Call sites elsewhere use `WebEngageManager.setEmail(...)`, etc. — never
`webengage.user.*` directly.

**Clearing a value.** Skipping an empty value leaves the old one in
WebEngage — blanking a profile field in the app does not clear it there.
`deleteAttribute` removes a *custom* attribute only (the SDK describes it
as deleting "the custom attributes set previously"), not a standard field.
At Quick, don't add clearing logic; say the limit once in the attribute
table. At Full, call `WebEngageManager.deleteAttribute(key)` at the site
where the app lets a user clear a custom field it had sent before.

**Re-sending a standard attribute.** On iOS the SDK logs `[WEGUser
setEmail:] User Email already set! Will not update with value: <value>`
(the same text exists for phone, first/last name, gender, birth date and the
hashed fields) when the same value is sent again — the SDK declining a
repeat; harmless. What iOS does with a *different* value for a standard
attribute already set is **not confirmed** — WebEngage's docs don't say, and
the SDK's binary can't be read to settle it. (Android's SDK has no such
check of its own: every call dispatches a profile update.) So where the app
lets a user edit their email or phone, don't promise the new value takes
effect on iOS: tell the client, and ask them to test an edit on an iOS build
and report back.

## Anonymous ID Changed Callback (Optional, RN SDK v1.6.0+) — Only If the Client Asks

Fires on logout/reinstall (Anonymous ID change — WebEngage's internal
term for this is LUID, Local Unique ID) and once on SDK
init even if unchanged. This callback is specific to the React Native
SDK — the native Android and iOS SDKs do not expose an equivalent. It has
no purpose unless something consumes it (for example syncing the id to
another system), so it is **never offered**, at Quick or Full; add it only
when the client names it.

When asked, register it once, early — add it to the wrapper's
`registerCallbacks()` (per `references/wrapper.md` → Analytics Wrapper — Architecture; create the method if this is the first callback the
project has, extend it if Init or a channel already added one). Its
buffering behavior is its own case, not the 50-event queue push/in-app
callbacks get — see Core Rule 19 for the full breakdown across all
callback types; don't assume this one matches the others.

```typescript
// src/analytics/WebEngageManager.ts — inside registerCallbacks()
this.webengage.user.onAnonymousIdChanged((anonymousId: string) => {
  // e.g. forward to another analytics/attribution tool
});
```

This callback, like all others in this SDK, takes no return value
(Core Rule 18) — it's an observer, not a hook the SDK waits on.

## Naming & Type Limits

Same limits `references/events.md` documents for event attributes,
per the official `react-native-tracking-users` doc — apply identically
here:

- Attribute names: case-sensitive, under 50 characters.
- String attribute values: under 1000 characters (truncated beyond
  that).
- No attribute name may start with `we_` — reserved for WebEngage's
  internal use.
- **Max 25 custom attributes per data type** — String, Number,
  Boolean, Date, Array, and Object each counted separately, across the
  user's whole profile (not per-event the way Tracking Events' limit
  is — there's no event scoping for a user attribute). This is the
  cap Step 6's list-before-creating requirement exists to avoid
  running into unprepared.
- **First datapoint locks the type** for a given attribute name —
  changing an attribute's type on a later call silently stops that
  attribute's data from updating on the dashboard. Confirm types
  before implementing, especially when reconciling against an existing
  data model (Step 2).

## Hard Rules

1. **Birth date must use `setBirthDateString('yyyy-mm-dd')` — date-only,
   matching the native Android/iOS SDKs exactly, not diverging from
   them.** Confirmed from the official `react-native-tracking-users`
   doc — `setBirthDateString()` maps directly to the native
   `WebEngage.get().user().setBirthDate(...)` method, which is
   date-only. (The SDK's type definitions show a full ISO datetime in
   their JSDoc example for this field — that example is incorrect. Use
   the date-only format regardless of what the type definitions
   suggest.)
2. **Other date-type custom attributes, passed via `setAttribute`, must
   be pre-converted to an ISO string with `.toISOString()` before the
   call — a raw `Date` object does not survive intact.** This is the
   opposite convention from event properties (see
   `references/events.md`): `track()`'s wrapper runs properties through
   a `JSON.stringify`/`JSON.parse` round-trip that happens to convert
   `Date` automatically; `setAttribute`'s wrapper does no such thing.
   Do not assume the two behave the same way.
3. **The complete attribute list, with data types, must be presented
   and confirmed before any attribute code is written** — not
   discovered piecemeal, per Step 6. This is a correctness requirement,
   not just a courtesy: exceeding the 25-per-data-type cap (Naming &
   Type Limits below) mid-implementation means some already-written
   calls silently stop taking effect once the cap is hit, with nothing
   in the client's own code changed to explain why.

If the client insists on an alternate implementation for any of the
above, do not implement it that way — record as a Known Risk.

## Rules

- Recommend `login()` fire only after authentication is confirmed —
  premature calls risk orphaned profiles. If the client prefers
  otherwise, implement it their way; record it as a Known Risk (per
  `references/rules.md` → Rules — Definition) — not overridden, but not left
  invisible either.
- Recommend `logout()` on every discovered logout path — omitting it
  risks merging the next user's events with the previous user's
  profile on shared devices. Same handling as above if the client
  prefers to skip it.
- Standard profile fields use dedicated APIs, never `setAttribute`.
  Client insisting on `setAttribute` for a standard field: record as a
  Known Risk.
- Multiple login paths (email, social, OTP): add to all by default.
  Client excluding one: record as a Known Risk.
- **Validate latitude/longitude client-side before calling
  `setLocation()` — invalid values fail completely silently.**
  `setLocation()` does a `parseFloat`/`isNaN` check internally and
  simply skips the native call if either fails, only logging when
  debug mode is on (`webengage.setDebugMode(true)` — the core
  package's own debug switch, not the `enableDevMode()` free function
  used by the In-Line/Inbox packages) — no error, no thrown exception,
  nothing visible in a production build. Recommend a basic range check
  (latitude -90 to 90, longitude -180 to 180, both actually numeric)
  before the call. Client declining: record as a Known Risk — the
  actual consequence is a location attribute that looks implemented in
  the app's code but never reaches the dashboard for affected users.
- Recommend `setPhone()` values be normalized to E.164 format
  (`+<countrycode><number>`, e.g. `+14155552671`) before the call —
  matches both the official docs and the SDK's own type-definition
  example. Whether a non-conforming value fails silently the same way
  `setLocation()` does isn't documented — treat it as a real risk to
  SMS/WhatsApp-channel targeting regardless if the client's source
  data isn't already in this format. Client declining: record as a
  Known Risk.

## Audit Checks

1. Birth date values are `'yyyy-mm-dd'` strings passed to
   `setBirthDateString()` — never a full datetime, never a raw `Date`
   object — Hard-Rule-derived, always an issue if violated.
2. Other date-type custom attributes passed to `setAttribute` are
   pre-converted ISO strings (via `.toISOString()`), not raw `Date`
   instances — the reverse of what Tracking Events checks for its own
   `track()` properties — Hard-Rule-derived, always an issue if
   violated.
3. `login()`/`logout()` present at every discovered path — Rule-
   derived; informational if backed by a Known Risk entry, a real
   issue otherwise.
4. `login()` fires after confirmation, standard fields use dedicated
   APIs — same Rule-derived treatment.
5. No PII attribute exists that the approval message didn't flag (very sensitive data: none at all)
   (Core Rule 8) — not a deviation check; flags an undocumented
   attribute, not a wrong choice.
6. No `login()`/`logout()`/attribute call sites call `webengage.user.*`
   directly instead of going through the Analytics wrapper — Rule-
   derived (per `references/wrapper.md` → Analytics Wrapper — Architecture);
   informational if backed by a Known Risk entry, a real issue
   otherwise.
7. If SDK Authentication is in use: `login()` is called with a
   `jwtToken`, and `tokenInvalidatedCallback` is registered — if only
   one of the two is present, that's a real issue (an incomplete JWT
   flow silently breaks re-authentication when the token expires).
8. If SDK Authentication is in use: `tokenInvalidatedCallback` is
   registered as early as possible (Core Rule 19) — not deep inside a
   conditionally-rendered screen. Given it has zero buffer (unlike
   every other callback in this SDK), a late registration doesn't risk
   losing overflow past 50 events, it risks losing the *first*
   `tokenInvalidated` event outright — Hard-Rule-derived, always an
   issue if registration is placed somewhere that could plausibly run
   after the event already fired.
9. `tokenInvalidatedCallback`/`onAnonymousIdChanged`, if in use, live
   inside the wrapper's `registerCallbacks()`, not a scattered call
   site — Rule-derived (per `references/wrapper.md` → Analytics Wrapper — Architecture); informational if backed by a Known Risk, a real
   issue otherwise.
10. **Custom attributes actually implemented, counted per data type,
    stay at or under 25** — countable directly from the wrapper's
    `setAttribute` call sites and their value types. Over the cap is
    always a real issue regardless of Known Risk status (per Hard Rule
    3 above) — this is a hard SDK ceiling, not a recommendation a
    client can opt out of.
11. If `setLocation()` is in use: a client-side latitude/longitude
    range check exists before the call — Rule-derived; informational
    if backed by a Known Risk, a real issue otherwise.
12. If `setHashedEmail()`/`setHashedPhone()` are in use: the
    WebEngage-support-team account-enablement confirmation is on
    record in `.webengage/agent.md` (per Step 7) — not itself a code
    check, but flag as an undocumented decision if the methods are present in code
    with nothing on record. Finding either method with **no** record
    at all is a stronger signal than usual here — per the Rules above,
    these should never be added without the client having gone through
    support first, so an undocumented instance is more likely a
    skipped gate than a minor logging gap. **Also: neither method is fed
    a value computed inline in the same file** (a local hash/encrypt call
    feeding directly into it) — a real issue regardless of intent. Whether
    the value's source matches the client's format is not code-verifiable;
    it is only ever confirmed by the client.
