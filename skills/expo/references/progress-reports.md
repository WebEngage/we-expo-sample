# The Two Notes Files — Client Progress and WebEngage-Team Summary

Load this when a Goal's state has been recorded, when the client asks for
either file, and when the wrap-up runs. Core Rule 29.

Two files are written into the project **silently after every Goal, and
again on request**, and **never contain a secret**:

| File | For | Voice |
|---|---|---|
| `webengage-progress.md` | The client (and anyone on their team) | Plain language: what's done, what's waiting on you, how to check it, how to undo it, what's next |
| `webengage-support-summary.md` | The WebEngage team, if the client sends it to support | Technical: app identity, versions, data center, Quick/Full per Goal, files changed (`file:line`), items pending at the client, recorded risks and refusals, anything unverified |

They sit at the project root, next to `audit-webengage-report.md`. They are
**snapshots regenerated in full** from `.webengage/agent.md` and a fresh read
of the files they cite — not logs, never appended to. (`.webengage/` stays
the agent's own state; these two are written for people to read.)

## When, and how quietly

- **After every Goal**, once its Recording State has been written. First
  creation happens after Init; the first change list names both files ("and
  two short notes files") so the client knows they are coming.
- **On request** ("update the progress note", "write up where we are for
  WebEngage support"): write, then say in one line where the file is.
- **Silently** otherwise: no announcement, no "I've updated…", no mention in
  the Goal-complete messages. The wrap-up (`references/confirm-and-wrap-up.md`)
  tells the client once where both files are.
- If the Goal changed nothing the files record (a re-run that found
  everything in place — `references/safety.md` §2), write nothing.

## Never contains a secret

Never write: the license code; the contents of `google-services.json`; APNs
keys or FCM credentials; JWT secrets, secure tokens, or device tokens;
anything from `.env`; a client's end-user identifiers, emails, or attribute
values; or anything the client pasted that looks like a credential. Record
**sources and names** instead — "license: read from `WEBENGAGE_LICENSE_CODE`
(`.env` locally, an EAS variable in cloud builds)", "`google-services.json`
referenced by `android.googleServicesFile`". Event and attribute *names* and
their types are fine; values are not. The same rule applies to
`.webengage/agent.md`.

## `file:line` is re-read, never remembered

Every `file:line` in the support summary comes from opening the file at write
time (Core Rule 20) — line numbers drift as the client edits. A citation that
can't be found is written as the file name alone, marked *(line not
re-verified)*. Never invent a line.

## `webengage-progress.md` — the shape

Plain words. Short sentences. No jargon — never "Pre-Flight", "Core Rule",
"Hard Rule", "Locked Facts", "Known Risk", or "Goal". Aim for under about 80
lines; the client should be able to read it in a minute.

```markdown
# WebEngage in {App name} — where things stand
Updated {date} · {Quick | Full} setup

## Done
- {Plain sentence per piece, in the client's terms. e.g. "WebEngage is set
  up in your app: the plugin, your license (read from `.env`), and one file,
  `src/analytics/WebEngageManager.ts`, that all WebEngage calls go through."}
- {e.g. "Login and logout are reported; `email` and `plan` are sent as
  profile details."}
- **Done for you with your defaults** (only if "use your defaults" was on):
  {each item — "Quick setup", "both platforms", … — and how to change it}

## Waiting on you
- {Build and run the app on a test device — `npx expo run:android` / `run:ios`
  or an EAS build — the change only takes effect in a new native build.}
- {Each check you haven't reported back on, by name.}
- {Dashboard steps only you can do: upload the APNs key / FCM credentials,
  create a test campaign, register a test device, request Inbox enablement.}
- {For teammates or CI: set `WEBENGAGE_LICENSE_CODE` (copy `.env.example`;
  EAS builds need it as an EAS variable).}

## How to check each piece
- **Setup:** {one line — Android: the `WebEngage Successfully Initialized`
  line; iOS: the `WebEngage SDK Initialized` line, or Live Users on the
  dashboard.}
- **{Goal}:** {one line — where to look. "Ask me for the step-by-step."}

## How to undo
{The rows from `references/safety.md` §6 for the Goals that were done, with
real file names filled in.}

## What's next
- {The Goals that are left, or "Nothing is left from what you asked for."}
```

## `webengage-support-summary.md` — the shape

Technical, compact, tables where they help. It records what was **written**
and what the client **reported** — it never claims a thing was verified that
only the client could have seen (`Confirmation` column, Core Rule 3).

```markdown
# WebEngage integration — support summary
Generated {timestamp} · skill: webengage-integration-expo v{Version} ·
compatibility record: references/compatibility.md ({date of last row})

## App
Name · slug · iOS `bundleIdentifier` · Android `package` · Expo SDK · React
Native · React · language (TS/JS) · router / navigation library · New
Architecture · native folders per platform (CNG / prebuilt-and-kept — N tracked
files / absent) · build path (EAS / local)

## Packages (declared → lockfile-resolved)
react-native-webengage · webengage-expo · webengage-expo-push ·
react-native-we-personalization · react-native-webengage-inbox ·
expo-notifications · expo-task-manager · expo-build-properties
(only those present)

## Configuration
Data center (iOS value / Android value) · license source (never the value) ·
debug mode · `push.mode` · `WEGAutoRegister` · plugin entry form · Android
extras (Install Referrer: added /
struck by the client) · defaults mode (on/off)

## Goals
| Goal | Depth | Status | Client confirmation | Updated |
|---|---|---|---|---|
(Quick/Full per Goal, including overrides; Confirmation is exactly what the
client reported: pending / confirmed {date} / problem — {summary})

## Files changed
| Goal | File:line | What |
|---|---|---|
(re-read at write time)

## Pending at the client
Dashboard uploads (APNs key, FCM credentials) · native builds not yet run ·
device checks not yet reported · test campaigns not yet sent · support
requests (Inbox enablement) · Apple-portal items (extension bundle IDs, App
Groups) · anything the skill asked for that is still open

## Recorded risks and refusals
Every Known Risks / Flags entry, and every Hard Rule request the skill
declined (Goal, rule, what was asked, date).

## Unverified
Each feature in this integration that `references/compatibility.md` lists as
documented-but-not-run, designed-from-source, or untested for this kind of
project — named, so support knows what has never been observed. Plus anything
the client reported as not working.
```

## Source of each field

Everything comes from `.webengage/agent.md` (Project Identity, Locked Facts,
Goal Status, Goal Log, Known Risks, and the Files Changed table in
`references/agent-template.md`), refreshed by reading the project's own files
at write time. If a field has no recorded value, write *not recorded* — never
infer or invent.

## Relation to the audit report

`audit-webengage-report.md` (`references/audit.md`) is the **checked**
snapshot — generated on request, every ✅ re-read at generation time. The
support summary is the **running record** of what was written and what is
open. A client may send either or both; neither replaces the other.
