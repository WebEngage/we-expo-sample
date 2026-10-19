# Troubleshooting — Narrow Fixes for an Existing Integration

For a client who already has WebEngage in their Expo project and reports a
specific failure. **A fix request is not a new integration:** don't ask Quick
or Full, don't start Init's full questions, and don't touch anything unrelated.
Read the client's actual files (private — Core Rule 1), say in a line what you
found, put the fix on a short change list, and wait for a yes (Core Rule 5).
Never remove or overwrite the client's other entries (Core Rule 7); ask for the
license code or data center only if the fix needs a value that isn't in the
project. Commands that may run: `references/commands.md`.

## The plugin entry is wrong

Read the `webengage-expo` entry in `app.json` / `app.config.js` before saying
anything. What the client reports and what the file shows decide the cause:

| What the client sees / what the file shows | Cause | Fix on the change list |
|---|---|---|
| `You are trying to use the WebEngage plugin without any props.` — entry has no config object | The entry is a string, or a list with no object. | Add the config object (`push`, `ios`, `android` — `references/init.md` → Plugin Configuration), keeping any values the client already set. |
| Entry is the bare name `"webengage-expo"` | Package `webengage-expo` 0.0.3 ships **no `app.plugin.js`** (checked in its source), so Expo can't resolve a bare name; Expo reports a *different* error than the one above (it falls back to the package's main file, which isn't a plugin). | Replace it with the explicit-path form `./node_modules/webengage-expo/src/withWebEngage.js` plus the config object. |
| `Missing required "mode" key…`, or `…without any push props` / `…ios props` | A mandatory block is missing. | Add the missing block (`references/init.md` → Hard Rules 1–2). |

**Version check before stating "no `app.plugin.js`":** that fact is true for
0.0.3; a newer `webengage-expo` could ship one. Confirm it right now with a
read-only check (`ls node_modules/webengage-expo/app.plugin.js`) and the
installed version, and say which you found. If one exists, the bare name may
resolve — still prefer the explicit path the official docs use.

If the client is moving from `app.json` to an `app.config.js`, keep the
existing plugins array and replace only the broken `webengage-expo` entry; never
leave a second WebEngage entry behind.

## Stale generated values (a changed license, data center or debug value)

`webengage-expo`'s Android plugin **never overwrites a meta-data entry that
already exists**, so on a kept `android/` folder a later non-clean prebuild leaves
an old or empty license, environment or debug value. iOS values are reassigned and
are safe. If a post-check shows a wrong or empty value:

1. Say which value is wrong (never print the license).
2. Tell the client to regenerate the folder with `npx expo prebuild --clean`,
   which **deletes and recreates `ios/` and `android/`** — safe only if nothing in
   them needs keeping. The client runs it (Core Rule 22).
3. Never hand-edit the generated file.

A value that exists only in generated `ios/`/`android/` files is not evidence the
project is configured: the config (`app.json` / `app.config.js` / `.env`) is the
source of truth.

## "The post-check passed but nothing changed"

A previously generated folder can already carry the chosen values, so a check can
pass even if prebuild did nothing. Apply step B records the time before it runs and
treats a check as passed only when the prebuild exit code was 0 **and** the file was
rewritten after that time **or** already holds exactly the chosen values
(`references/init.md` → apply step B). If neither holds, report it as *configured —
not yet applied*.
