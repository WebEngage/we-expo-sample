# Hard Rules, Rules, and How Audit Interprets a Violation

Definitions used by every Goal reference's *Hard Rules*, *Rules*, and *Audit Checks* sections.

## Hard Rules — Definition

A Hard Rule is a non-negotiable technical constraint. Unlike PII
decisions, opt-in-feature defaults, or other client-discretion points,
a Hard Rule has no override — the agent does not implement it the
client's way regardless of insistence, explanation, or urgency.

**If a client insists anyway:**
1. Decline, and explain why (each Hard Rule states its own reasoning).
2. Where relevant, redirect the client to WebEngage's own team
   (`support@webengage.com`) for guidance specific to their case,
   rather than the agent making an exception.
3. Record the insistence as a flagged entry in `.webengage/agent.md`
   — which Goal, which Hard Rule, what the client asked for. This is
   never silently dropped.
4. `Goal: Audit WebEngage Integration` surfaces every flagged entry
   from every Goal in `audit-webengage-report.md`, so it stays visible
   to whoever the client shares that report with — not just to the
   agent.

## Rules — Definition

A Rule is a recommended best practice, not a non-negotiable constraint.
The agent implements the client's preference even when it deviates
from the recommendation — it does not refuse or redirect.

**Every deviation is recorded**, regardless of how minor it seems — as
an entry in `.webengage/agent.md`'s Known Risks / Flags table. There is
no tier of "small enough not to log" — consistent recording is what
makes the Known Risks table and the audit report actually useful for
future sessions and for anyone reviewing the integration later.

The difference from a Hard Rule is compliance, not visibility: a Hard
Rule is never implemented the client's alternate way; a Rule always is,
but never goes unrecorded.

**Opt-in-feature defaults (Core Rule 15–17) are neither of the above.**
They're a standing default the client can change at any point without
it counting as a deviation from anything — don't log a Known Risk
merely because the client asked for JWT login, Rich Push off, or
Universal Links on. Only log a Known Risk if implementing the client's
choice itself required deviating from a Rule.

## How Audit Interprets a Found Violation

This classification belongs to `Goal: Audit` — the only place the client
hears the words "issue" or "violation", and only when they ask for an
audit. Pre-Flight reads the same checks privately to build its to-do list
and never uses these labels with the client: in an integration
conversation, a missing or wrong piece is simply work to do.

**Hard-Rule-derived checks:** any violation found in the code is
always a real issue, regardless of what the Known Risks table says. A
Known Risk entry tied to a Hard Rule only ever records a refused
request — it never reflects the violation actually being implemented.
Finding the violation in code despite a Hard Rule existing means the
refusal didn't hold, which is itself worth surfacing as a regression.

**Rule-derived checks:** a violation found in code is informational if
a matching Known Risk entry exists (a documented client decision) —
and a real issue, not just a note, if no matching entry exists.

**Checks that verify a decision was made at all** (e.g. Core Rule 8's
PII track/drop) aren't deviation checks — there's no default being
deviated from. These just confirm a decision exists on record; the
issue is an undocumented attribute, not a wrong answer.

**Fixing a found violation is never silent, even when the fix is
obviously correct.** Explain what's actually wrong in plain terms
specific to what was found (not just "Hard Rule 3 violated") and why
it matters, then ask the client to confirm before touching the code.
This is not blocked by Core Rule 7 — that Rule protects code
*unrelated* to WebEngage's own integration from collateral edits, not
WebEngage's own previously-written integration code from being
corrected once the client agrees.

**When it's genuinely unclear whether something found in code is
actually a violation, ask — never assume either way.**
