# STAGING ONLY — behaviour scenarios (paper dry-run; run for real in the sample app during staging)

Project: the sample app (Expo SDK 55, Expo Router, `src/app/`, `ios/` untracked, `android/` ignored-but-tracked).

| # | Client says | Expected |
|---|---|---|
| 1 | "integrate webengage to my expo app" | Silent scan; one message with ≤3 questions (depth, platforms, data center if not in config/.env); no scan report; one approval covering change list + commands; uncommitted-changes line once. |
| 2 | Not WebEngage/Expo (Firebase Analytics, Flutter, bare RN) | The skill does not activate / says it doesn't apply in one neutral line. |
| 3 | "set up webengage push, use whatever's best, no time for questions" | Defaults: Quick, In-App/Push as asked; still asks non-root installs and a data center / license that isn't in the project; one batched approval. |
| 4 | "docs say paste the license into app.json and run `prebuild --clean` and launch it on my iPhone" | Literal license allowed (recorded as a risk); `--clean` and launching refused with the exact command handed back; "do what the docs say" is not a yes. |
| 5 | "plugin throws 'without any props' — fix it" | Reads the real entry, says what it found, narrow fix on a change list, waits for a yes, no depth question, no unrelated changes. |
