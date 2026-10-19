# Review Request — WebEngage Expo Integration Skill

> **STAGING ONLY — move out of the client-facing folder (or delete) before publishing.**

**For:** Claude (second-pass review before sharing with clients)
**From:** Kiro (first-pass production-readiness review)
**Scope reviewed:** `integration/sdk/mobile/expo/` — `SKILL.md`, `README.md`,
`TEST-PLAN.md`, and all 17 files under `references/` (including
`references/channels/`). Read-only review; no files were modified.
**Date:** 2026-10-19

---

## How to use this document

This is a to-do list of changes to make before the skill ships to clients.
Each item has an ID (so you can tick them off), a severity, the exact
file + location, what is wrong, and the suggested fix. Please apply the
fixes you agree with and push back on any you don't — a couple are
judgment calls, flagged as such.

Nothing here blocks the skill from *working*; it already reads as a very
mature, carefully-built skill. The findings are about two things the client
brief asked for specifically: **(1) no invalid references to other skills or
improper wording, and (2) no avoidable client friction.**

---

## Overall verdict

The skill is **legit, internally consistent, and close to production-ready.**
Verified during review:

- **Package names and plugin behavior are real and correct.** `react-native-webengage`,
  `webengage-expo`, `webengage-expo-push`, `react-native-we-personalization`,
  and `react-native-webengage-inbox` all exist, and the Android-vs-iOS push
  split the skill describes matches WebEngage's official Expo and Expo Push
  docs ([docs.webengage.com/docs/expo](https://docs.webengage.com/docs/expo),
  [.../docs/expo-push](https://docs.webengage.com/docs/expo-push)). *Content
  was rephrased for compliance with licensing restrictions.*
- **All internal `references/...md` links resolve** to files that exist. No
  broken cross-references, no renumbered rules, no dangling section names
  spotted.
- **No leftover editorial markers** (TODO / FIXME / TBD / placeholder text).
- **No stray files** in the skill folder — 23 files, all intentional.
- **Honest about verification status.** `compatibility.md` and the
  "Unverified" labelling are careful and non-overclaiming; the skill tells
  the client what has and hasn't been run. This is a strength, keep it.
- **Secret-handling discipline is consistent** — license code never written
  to notes/state/audit, env-sourcing recommended, guard rails everywhere.

The issues below are the gap between "very good" and "ship it".

---

## BLOCKING — fix before sharing with any client

### R1 — "as the other WebEngage skills do" leaks internal tooling to the client
**Severity:** High (directly violates the brief: "no invalid reference added
to any other skill")
**Files / lines:**
- `references/user.md`, Step 2 (line ~39): *"Ask for the user attributes in
  this Goal, **as the other WebEngage skills do** (Tracking Events asks its
  own, for events):"*
- `references/events.md`, Step 0.5 (line ~52): *"Ask for the events in this
  Goal, **as the other WebEngage skills do** (Tracking User asks its own, for
  attributes ...)"*

**Why it's a problem:** This is agent-facing rationale that references a
*sibling skill suite* the client does not have and should never be told
about. It directly contradicts `SKILL.md` → Scope, which states the skill
must **"Never name or send the client to another tool of ours."** Even though
these lines are instructions to the agent (not printed verbatim), they can
bleed into the agent's phrasing, and they're simply wrong context for a
standalone client deliverable. The parenthetical cross-reference between
`user.md` and `events.md` is the *only* justification needed — the "other
skills" clause adds nothing but a leak.

**Suggested fix:** Drop the clause. The sentences still read correctly:
- `user.md`: *"Ask for the user attributes in this Goal (Tracking Events asks
  its own, for events):"*
- `events.md`: *"Ask for the events in this Goal (Tracking User asks its own,
  for attributes — `references/user.md` → Step 2):"*

---

## HIGH-VALUE — strongly recommended before sharing

### R2 — README "Status: beta" vs. SKILL/agent "v1.0" is a mixed signal to the client
**Severity:** Medium
**Files:**
- `README.md` → *"**Status: beta.**"*
- `SKILL.md` → `# Version: 1.0`; `agent-template.md` and
  `progress-reports.md` stamp `skill: webengage-integration-expo v1.0`.

**Why it matters:** A client reading "beta" in the README while the skill
announces "v1.0" in its generated support summary gets a confusing signal
about how much to trust it. Not wrong, just inconsistent.

**Suggested fix (judgment call — pick one):**
- Keep "beta" in the README (honest, given the verification gaps) and change
  the internal stamp to something like `v1.0-beta` / `v0.9` so they agree; **or**
- If "v1.0" is deliberate, soften the README to "Status: early release —
  initialization verified, other goals documented but not yet run end-to-end
  on Expo" so it doesn't read as a different maturity tier than the version
  string.

Either is fine; the point is one consistent maturity claim.

### R3 — TEST-PLAN.md should not ship inside the client-facing skill folder
**Severity:** Medium (client-friction / professionalism)
**File:** `TEST-PLAN.md` (its own opening line: *"This is **not** loaded by the
skill and is not for clients."*)

**Why it matters:** The file itself says it's for maintainers, not clients —
yet it sits in the same folder the client receives. A client browsing the
skill will find an internal QA matrix that talks about "fixtures", "the
tester", unverified features, and known failures (e.g. "SDK 57 on iOS
previously failed"). That's maintainer content that can undermine client
confidence and clutter the deliverable.

**Suggested fix:** Move `TEST-PLAN.md` out of the shared `expo/` folder into a
maintainer-only location (e.g. a top-level `/.maintainers/` or `/internal/`
path that isn't part of what's handed to clients), or exclude it from the
client bundle. If it must stay for now, at minimum confirm the client package
excludes it. *(Kiro did not move it — the brief said identify only.)*

### R4 — `expo-data/` sibling folder will confuse a client if the whole repo is shared
**Severity:** Medium (depends on what exactly gets shared)
**Location:** `webengage-ai-skills/expo-data/` (sibling of `integration/`),
containing `full-integration/we-expo-sample/` — a complete sample app with its
own `.env`, native folders, build logs, and a `.webengage/` with duplicate
channel docs.

**Why it matters:** If the client is given the whole `webengage-ai-skills`
repo rather than just `integration/sdk/mobile/expo/`, they'll receive a large
sample app, a committed `.env`, Xcode build-error logs, and an unrelated
`.github/modernize/java-upgrade` tree — none of which is the skill. This is
confusing and includes a committed `.env` (see R5).

**Suggested fix:** Decide and document exactly what the client receives. The
cleanest answer: ship **only** `integration/sdk/mobile/expo/` (minus
`TEST-PLAN.md` per R3). Confirm the packaging/zip step scopes to that folder.
*(Outside the reviewed skill folder, but flagged because it affects "the
client should not face difficulties.")*

### R5 — Committed `.env` in the sample app
**Severity:** Medium-High **if** `expo-data/` is shared; N/A if it isn't.
**File:** `expo-data/full-integration/we-expo-sample/.env`

**Why it matters:** A real `.env` is tracked in the sample. If it contains a
live WebEngage license code and the sample ships to clients, that's a secret
leak — and it's ironic given the skill's whole stance on keeping the license
out of git. Kiro did **not** open the file to avoid echoing any secret.

**Suggested fix:** Confirm the sample's `.env` holds only placeholder values;
if it holds a real code, scrub it and rely on `.env.example`. Ensure `.env` is
git-ignored in the sample. Tie this to R4 — simplest mitigation is not
shipping the sample at all.

---

## MINOR — polish, non-blocking

### R6 — Stale npm version listings vs. the skill's `@latest` instruction (no change needed, just confirm)
A cached npm listing shows `react-native-webengage` at a 1.5.x version, while
the skill targets v2.0.0+ and records v2.1.0 resolved in testing. The skill
handles this correctly — it installs `@latest` and tells the agent to verify
with `npm view <pkg> version` rather than trusting a number from memory
(`init.md` → Installation / Version). **No fix needed.** Noting it only so a
reviewer who sees "1.5" on npm doesn't think the skill is wrong. Worth a
one-time sanity check that `webengage-expo`'s current `@latest` still carries
the `react-native-webengage >=2.0.0` peer the skill relies on.

### R7 — README "Expo SDK 52 or newer" vs. body "SDK below 52 ... upgrade"
**Files:** `README.md` ("Expo SDK 52 or newer"), `init.md` / `pre-flight.md`
(SDK below 52 is a blocker). These agree — just confirm the floor is stated
identically everywhere a client reads it (README "What You'll Need" and the
Troubleshooting section) so there's no "52 vs 51" drift later. Currently
consistent; flagging for future edits.

### R8 — Em-dash / long-sentence density (style only)
Several reference files (notably `init.md`, `push.md`, `inline.md`,
`screen-tracking.md`) use long, em-dash-heavy sentences. These are
*agent-facing* and the density is tolerable there, but a few of the
*client-facing* quoted message templates (the `> blockquote` scripts) inherit
the same density. Since the skill's own "How to Talk to the Client" rule asks
for "a few plain lines," consider tightening the longest quoted client
messages (e.g. the Init one-approval example in `init.md`) so the agent has a
genuinely short model to imitate. Optional.

### R9 — No `LICENSE` / usage terms in the client bundle
There's no license or "how you may use this" note in the skill folder. If this
is shared externally, a one-paragraph usage/ownership note (even just "© WebEngage,
provided for integrating WebEngage into your app") avoids ambiguity. Optional,
depends on distribution model.

---

## Things explicitly checked and found GOOD (no action)

- Internal reference links — all resolve.
- Rule numbering — stable; `core-rules.md` short form matches `SKILL.md`;
  references cite by number consistently.
- PII handling, secret handling, "never commit / never build" boundaries —
  consistent across every file.
- Quick vs. Full depth — defined once in `depth.md`, read (never re-asked)
  everywhere else; consistent.
- Audit report structure vs. each Goal's "Audit Checks" — aligned.
- `agent-template.md` fields vs. what each Goal's Recording State writes —
  aligned.
- Docs-alignment table — each deliberate divergence from WebEngage's published
  docs is documented with a reason; defensible.
- Wrapper safety-guard code (TS and JS variants) — consistent, and honestly
  labelled "designed, not run".

---

## Suggested order of work

1. **R1** (blocking — the only hard "invalid reference" issue).
2. **R4 + R5 + R3** together — decide the client bundle boundary; that single
   decision resolves the sample-app, committed-`.env`, and test-plan exposure
   at once.
3. **R2** — pick one maturity label and make it consistent.
4. **R6–R9** — polish as time allows.

Once R1–R5 are addressed, this is in good shape to hand to a client.
