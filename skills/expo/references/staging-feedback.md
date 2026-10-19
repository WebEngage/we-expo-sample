# STAGING ONLY — Feedback File for the Maintainer (delete before publishing)

Loaded **only** when the client (here, the maintainer testing locally) says
"staging feedback". It is an exception to the usual client-conversation rules
(no process narration, no audit words): this file is *for the person improving
the skill*, not for a client. Never loaded otherwise.

Write `webengage-staging-feedback.md` at the project root. **Never put the
license code or any secret in it** (Core Rule 29). Fill every section from what
actually happened in this session; where the skill can't know something, leave the
line for the tester, exactly as shown.

```markdown
# WebEngage Expo skill — staging feedback

## Run
- Date · skill version/commit if known · Expo SDK / RN / package versions (from package.json + lockfile)
- Depth · platforms · channel(s) · defaults mode on/off · fixture type (committed / mixed / CNG / EAS)

## Conversation
- Messages sent to the client, in order, each with: its number of questions and what each asked.
- Any message that had more than three questions, or asked something the skill said to decide.
- Approvals asked (how many, what each covered). Anything asked twice.

## Commands
| Command | Approved? | Exit | Notes (what it printed that mattered — never the license) |
|---|---|---|---|

## Post-checks (per platform)
| Check | Android | iOS |
|---|---|---|
(pass / fail / pending — and why; "file unchanged since before prebuild" counts as not applied)

## Files changed
(from `.webengage/agent.md` → Files Changed)

## Where the skill was unclear, contradictory, or missing
- One bullet each: what you were doing, which reference file and section, what you did instead, and why.

## Things you improvised or deviated on
- Anything not covered by a reference file, and anything you did differently from it.

## Unverified items touched
- Features whose status in `references/compatibility.md` is not "verified" that this run used.

## Suggestions
- Concrete changes you would make to the skill, ranked, one line each.

## For the tester to fill in (the skill cannot observe these)
- Android: did `adb logcat -d -s WebEngage` show `Successfully Initialized`? paste the line (no license).
- iOS: which of the three Xcode init lines appeared? paste them.
- Dashboard: Live Users seen? profile attributes shown? events listed in Activity Info (names + property types)?
- Push: delivered foreground / background / killed? Rich Push rendered? (physical iPhone)
- In-App / In-Line / Inbox: what showed, what didn't.
- Device(s), OS versions, Xcode/Node versions, anything that felt slow, confusing or repetitive.
```
