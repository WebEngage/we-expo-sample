# Commands — What May Run, and the Safe Recipes

One place for every command this skill may run, so the rule is never
reconstructed from scattered text. Core Rule 22 governs: **integrate, don't
operate.**

## Run only after the client's yes (in the Goal's one approval message)

| Command | When | Notes |
|---|---|---|
| Package install (`npm install` / `yarn add` / `pnpm add` / `bun add`, `@latest`) | The two root packages in Init; others only after their own ask (Core Rule 21) | Use the package manager the lockfile names. |
| `npx expo config --type prebuild > /dev/null` | Init, apply step A | Output discarded (it contains the license). Read the exit code and error output only. |
| `npx expo prebuild --no-install --platform <android\|ios\|all>` | Init, apply step B | Never `--clean`. A project with a dirty git tree may make Expo show its own prompt; if it prompts, ask the client — never answer for them. |
| `cd ios && pod install` | Init, apply step C; iOS on macOS only, only when needed to confirm iOS | Prefix `WEBENGAGE_DISABLE_SPM=true` when static linkage is on (`references/init.md` → apply step C). |

## Read-only reads — no approval needed

`git status --porcelain`, `git ls-files`, `git check-ignore`, `git log`,
`git diff`, `git grep`, `npm view <pkg> version`, `ls`, `stat`, and the file
reads Pre-Flight and the post-checks do. They change nothing and never print
the license code.

## Never run (hand the client the command instead)

`npx expo prebuild --clean`, `npx expo run:*`, `eas build`, anything that
starts Metro, an emulator or a simulator, `adb`, `xcrun simctl`, reading a
device's logs, a project upgrade, or any git write (`add`, `commit`,
`rm --cached`, `stash`, `checkout`). When the client insists on one of these,
say once, in a line, that this skill doesn't run it, give the exact command
(for a physical iPhone: `npx expo run:ios --device`, with their Apple team
set — `devTeam` for the push extensions or Xcode's Signing & Capabilities —
and the logs in Xcode's console), and record the decision in `.webengage/agent.md`
under Known Risks / Flags as "client asked for X; handed back". Don't repeat
it.

## Reading the license code safely

The license code is a secret. Reading it into a shell variable is fine; **printing
it is not** — never echo it, never paste it into a command shown to the client,
never write it to a notes file, the audit report or `.webengage/`.

- **Is it in `.env`? (presence only):**
  `grep -qE '^WEBENGAGE_LICENSE_CODE=.+' .env` — exit code 0 means present;
  nothing is printed. Use the project's own variable name if Pre-Flight found a
  different one. A missing `.env` or a non-zero exit means "not in the
  project": ask for it (Core Rule 24).
- **Is it already in a tracked file? (file names only):**
  ```sh
  LC="$(sed -n 's/^WEBENGAGE_LICENSE_CODE=//p' .env | head -1 | tr -d "\"'")"
  [ -n "$LC" ] && git grep -l -F -- "$LC"
  ```
  The `[ -n ... ]` guard matters: an empty pattern matches every file. Only the
  file names are reported, never the value.
- **Never** `cat .env`, `grep` it with output, or read it through a tool call
  whose result would show the value.
- The data center is not secret; ask for it if neither the Expo config nor
  `.env` names one. **A value found only inside generated `ios/` or `android/`
  files does not count as "already in the project"** — those may be stale
  (`references/troubleshooting.md` → Stale generated values).
