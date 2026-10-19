# "Use Your Defaults" Mode

Load this when the client says something like **"use your defaults"**, **"do
all recommended"**, **"go with your recommendations"**, **"do what you
recommend"**, **"you decide"**, or **"set it up the recommended way"**. A bare
"ok" or "yes" answering one question is not this mode. If it is genuinely
unclear whether the client means it, ask once: *"Should I go with my
recommendations wherever I can, and only stop for the things that need your
say-so?"*

This mode changes **how much is asked, never what is allowed.** Every Hard
Rule, every ⚠️ real risk, and Core Rules 7, 9, 21 and 22 apply exactly as
before. It is recorded in `.webengage/agent.md` → Locked Facts (`Defaults
mode: on — client said "…" [date]`) and stays on until the client says "ask
me", "let me choose", or "stop using defaults". A later session reads the
record and says one line at the start ("Still going with your defaults —
say *ask me* to switch back").

## The three tiers

### A. Do it, then report — no question

Detectable or recommended, additive, and easy to undo. Done without asking
and listed afterwards (the wrap-up and `webengage-progress.md` under *Done
for you with your defaults*, each with how to change it):

| Item | What defaults mode does |
|---|---|
| Platforms | Every platform the project is configured for |
| License source | The environment (`WEBENGAGE_LICENSE_CODE`), reusing the project's own env convention if it has one |
| Data center | The one already in the project's config or env (if none is found, see tier C) |
| Debug mode | Verbose in development builds, off in production — driven by the build profile |
| Package versions | `@latest` for each WebEngage package (a non-root install is tier C) |
| Data model (attributes, events) | "None" — stated in the one yes; the client says so if a spec exists |
| Depth | **Quick**, unless the client said Full (or "everything") — stated in one line, changeable any time |
| Channel (Quick) | The one the client named; if none, **In-App** (nothing to install or set up). If Pre-Flight found exactly one push library already in use and the client asked for push, that transport |
| Candidates | Quick: the 1–2 highest-value attributes and events Pre-Flight proposed; Full: the complete lists — presented in tier B, never silently implemented |
| Naming | The app's own convention, else Title Case for events |
| The wrapper | Create `WebEngageManager` (with its guard) and the `init()` call — the wrapper is the one file every Goal needs |
| State and notes | `.webengage/`, `webengage-progress.md`, `webengage-support-summary.md` |
| Screen tracking mechanism | The navigation approach Pre-Flight found |

### B. One batched yes

The **change list** and the **attribute and event lists** go out together, in
one message, as one question — "here is everything I'll change and track;
say yes to go ahead, or tell me what to change." File names and what each is
for; the attribute table; the event table. Real ⚠️ risks ride in this
message. One yes covers all of it. (Quick: one such message per Goal that
needs lists, or a single combined one when Init and the first Goals are going
together.)

Items that go in this batch rather than being asked one by one: creating or
extending `app.config.js` (with the sentence that it changes how the config
is read), the `.env.example` and `.gitignore` lines, the plugin entry,
Install Referrer, the Android push hook files, the call sites.

### C. Always asked individually — even in this mode

One question each, never folded into the batch:

| Always ask | Why |
|---|---|
| **Every non-root package install** — each on its own (the two root packages are covered by the one yes, and `webengage-expo-push` is stated when Push begins, Core Rule 21) | Core Rule 21: installs change the client's dependencies and lockfile |
| **Removing or overwriting anything** — replacing an existing plugin entry, overwriting a file, correcting a value the client set, deleting hand-written init code | Core Rule 7 protects the client's code |
| **The license code, if it is not in the project** — and the data center with it, if none is found | It can't be guessed, and a wrong data center silently sends nothing |
| **Two push libraries present** — which one receives push? | Core Rule 16: never guess |

## What never changes

- Opt-in features (SDK Authentication, multi-app, Universal Links, advanced
  push-plugin options — Core Rule 15) are still never proposed.
- Hard Rules are still declined, explained and recorded.
- At most three questions per message (Core Rule 24); the batched yes is one
  question.
- The skill still never builds, runs, launches, or commits (Core Rule 22).

## The shape of a defaults-mode message

> I'll go with the recommended setup: Quick depth, both platforms, license
> from `.env`, In-App as your first channel. Here's everything I'll add —
> `app.config.js` (reads your license from `.env`), `.env.example`, the
> plugin entry, Android Install Referrer, `src/analytics/WebEngageManager.ts` and one `init()` call in
> `app/_layout.tsx`; and I'll track login/logout, `email` and `plan`, and
> `Order Placed`. ⚠️ `email` is personal data — say "drop email" to remove
> it. Then I'll check your Expo config, run `expo prebuild`, and run `pod
> install` on iOS. Say yes to go ahead or tell me what to change.

(Then, as its own short question: any non-root package install — never in
the same breath as the yes above. The commands are already in that yes.)
