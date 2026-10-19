# Integration Depth — Quick and Full

Load this when the depth question comes up, or when a client asks to change depth.

## Integration Depth — Asked Once

Two modes:

- **Quick Integration** — SDK init, one or two events, one or two user
  attributes (login and logout always included), and basic setup for
  **one** engagement channel.
- **Full Integration** — all candidate events, all candidate user
  attributes, and every engagement channel the client wants, each with
  its callbacks.

| Goal | Quick | Full |
|---|---|---|
| Init | Same — unscoped | Same — unscoped |
| Tracking User | login, logout, 1–2 key attributes | the complete candidate attribute list |
| Tracking Events | the 1–2 highest-value events | the complete candidate event list |
| Engagement Channels | **one** channel — In-App unless the client names another | every channel the client wants |
| · Push | token wiring, foreground + background delivery, Android 13 permission, iOS plugin setup — no callbacks | + the `push.onClick` deep-link callback |
| · In-App | display only — it works automatically after Init | + Screen Tracking and optional In-App callbacks |
| · In-Line Content | `WEInlineWidget` (the SDK renders a Banner/Text campaign); Screen Tracking is mandatory here, so it is always included | + `WEPlaceholderCallback` for any placement that needs custom rendering |
| · Notification Inbox | unread badge, first page, tap-to-mark-read, click/view tracking | + pagination and every single/batch action |

*(Internal reference — never print this table.)* The "1–2" counts are
guidelines, not a cap: when the client picks more at Quick, it is still
Quick — no deviation, no re-ask; record the number they chose.

**When it is asked.** Once. If the request is open-ended — "integrate /
add / set up WebEngage", with no scope words — ask right after Pre-Flight
and **before Init**, in the same message as the goals question, so Init
is never mistaken for the whole integration. Only explicit Init-only
wording ("just init", "just add the SDK") defers it to the first
scope-bearing Goal (Tracking User, Tracking Events, or any channel).
Init is unscoped and runs first either way. 

**How it is asked.** In plain words, two or three lines inside your first
message — for example: *"How far should I go? Quick is the basics: setup,
login/logout, a couple of key events, one channel (In-App unless you name
another). Full is everything: every attribute and event, and every channel
you want. If Full, which of Push, In-App, In-Line, Inbox? And which
platforms — Android, iOS or both?"* With the data center and the license
code (only if missing), that is **at most three questions per message —
if more are open, ask the rest in a second short message after the
answer.** The table above is for you — **never print
it**. Don't list channel prerequisites here (they come at each channel's
turn), and don't add "I won't ask again" — that's your rule, not the
client's. After the answer, one short line saying what you'll do.

**"Use your defaults" mode.** With no depth stated, the default is **Quick**
(and **Full** only if the client says so), stated in one line and changeable at
any time — see `references/defaults-mode.md`.

**Pre-answered.** If the client's own words already state it ("quick
WebEngage setup", "full integration", "just the basics", "everything"),
that is the answer — record it and say which depth you're applying in
one line. Do not ask.

**Recorded.** `.webengage/agent.md` → Locked Facts → `Integration depth`
(plus `Depth overrides`, empty until the client asks for one).

**Every scoped Goal reads it and never asks.** Each Goal's depth
step ("Step 1 — Integration Depth" in `user.md`, "Step 0" in `events.md`) is a one-line statement of the depth being applied
(*"Using Quick depth, chosen earlier: login, logout and 1–2 key
attributes."*), followed immediately by that Goal's own confirmations.
Those are not depth questions and still happen: the data-model question
for the Goal, the single approval of the Goal's choices (Core Rule 5),
placements and `propertyId`s, non-root package installs (Rule 21). The
identifier is pre-filled (asked only if ambiguous); naming is decided, and
PII is handled by sensitivity (Rule 8) — neither is a question. The Goal-complete line states what was built and nothing
more — no "want to go Full?" offer. (Init's completion message also says
what is *not* done yet and what comes next — `references/init.md` →
Init-Complete Message — which is orientation, not an offer.)

**Channels.**
- **Quick:** **In-App unless the client names another** — state it, don't
  ask. If the client names more later, that is the client widening the scope, not a
  re-ask: add each at Quick depth unless they ask for Full.
- **Full:** ask which channels the client wants (one, several, or all)
  once, then proceed one at a time, each at Full depth.

**Changing depth — only when the client asks** ("make events Full",
"switch everything to Full", "go deeper on push", "actually keep it
minimal"). Update `Integration depth` for a whole-integration change, or
add a line to `Depth overrides` for a single Goal; note it in that
Goal's Log entry; and implement **only the delta** — every reference's
Full-only sections are additive (the `push.onClick` callback, inbox
pagination, and so on), so nothing already built is redone or removed
(Core Rule 7).

**Resume.** A later session never re-asks: Pre-Flight reads the recorded
depth and carries it into every Goal. If none is recorded and the client
starts a scope-bearing Goal, ask once — and if earlier Goals already
show a scope in the Goal Status table, mention it so the client can
answer "same as before".
