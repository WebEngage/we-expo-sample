# Confirming a Goal, and Wrapping Up

Load this when a Goal finishes and when the last chosen Goal is done.

## Confirming a Goal Works — the Client's Step

Every Goal reference has a **How to Confirm This Works** block. It is
guidance for the client — this skill never runs the app, opens the
dashboard, or polls anything to check (Core Rule 22).

- **Five parts, always in this order:** *Before you start* (dashboard or
  device prerequisites) · *Do* (the action to perform) · *Expect* (built
  from what `.webengage/agent.md` recorded for this Goal — the real event
  names, attributes, and callbacks, not generic text) · *If you don't see
  it* (likeliest causes, cheapest check first) · *Tell me* (the client
  reports back; the skill records confirmed / pending / problem).
- **Say "expected", never "verified".** Each block carries the line
  *"Expected behavior per WebEngage's documentation — not yet verified on
  Expo."* until a real run is recorded in `references/compatibility.md`.
- **The Goal-complete message gives one sentence on how to check it** (where
  to look) **and offers the step-by-step** — print the full block only if
  the client asks for it.
- **Record** one line per Goal in `.webengage/agent.md`:
  `Confirmation: pending / client confirmed [date] / problem reported —
  [summary]`.

## The Unverified Label — Say It Before the Goal, in One Sentence

Before starting a Goal whose features `references/compatibility.md` lists as
anything other than **verified** (its *Verification status of skill
features* table), say so once, plainly, where the client will see it — at
the start of that Goal, not buried in the close:

> This part follows WebEngage's documentation, but it hasn't been run end to
> end on Expo yet — I'd like you to check it on a test device and tell me what
> you see.

Use the wording that fits the status: *documented, not run on Expo* (the
sentence above); *designed from the SDK's source, not run* (the wrapper's
safety guard); *observed once, on one device* (the iOS init lines and log
markers). Never say "tested", "verified", or "works" for anything not marked
verified there. The same status goes into the support summary's *Unverified*
section. A feature the client's project hits for the first time (a navigation
library, a native-folder state, an EAS-only build) gets the same sentence even
if the Goal is otherwise verified.

## Wrapping Up — Once, After the Last Chosen Goal

When every Goal the client chose is done (Quick: after its one channel;
Full: after the last channel they wanted), or the client says they're
finished, send **one** short wrap-up in place of that Goal's usual "what
next?". A few lines of plain prose — no table, no replay of the
conversation:

- **What now exists**, in the client's terms — "login and logout, two
  attributes, three events, and in-app messages", not file lists.
- **What is still on them:** build and run the app, and the checks they
  haven't reported back on (read `Confirmation` in `.webengage/agent.md`).
  Say "written, not yet run" for anything unconfirmed — never "verified"
  or "working". If debug logging is on, add one line: make sure release
  builds keep it off. In "use your defaults" mode, add one line naming what
  you decided for them (`references/defaults-mode.md`).
- **Where the notes are**, once: `webengage-progress.md` says what's done,
  what's waiting on them, how to check each piece and how to undo it;
  `webengage-support-summary.md` is the technical version they can send to
  WebEngage (`references/progress-reports.md`). Neither contains a secret.
- **What was left out**, in one line — channels or extras they didn't
  pick. Orientation only: no "want to go Full?" offer (see Integration
  Depth).
- **An offer, never an action:** "Want me to write a checked audit report as
  well?" Generate it only if they say yes (`Goal: Audit`).

Say it once. A Goal the client adds later gets a new wrap-up only after
that Goal completes.
