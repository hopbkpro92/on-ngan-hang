# AGENTS.md

## Commands

- Dev server runs on **port 9002** (not 3000): `npm run dev` (`next dev --turbopack -p 9002`).
- Tests: vitest is a devDependency but there is **no `test` script and no vitest config**. Run `npx vitest run scripts/<name>.test.ts`. Tests live in `scripts/quiz-*.test.ts`, not `src/`.
- Typecheck separately: `npm run typecheck`. `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so **`npm run build` passes even with type errors**.
- No ESLint/Prettier config files exist in the repo; `npm run lint` has no local rules to enforce.
- Shell here is Windows PowerShell 5.1: chain dependent commands with `; if ($?) { ... }`, use `workdir` instead of `cd`.

## Quiz data pipeline (the core of this app)

- `public/quiz-files.json` is the registry: `{ path, role, examQuestions }`. Role `"Kiến thức chung"` means visible to all roles; otherwise filtered by `UserRole` (`"Kế toán" | "Kiểm ngân" | "Tín dụng" | "Quản lý"`).
- Loading: `loadQuizData` / `listAvailableQuizFiles` / `loadExamQuestions` in `src/lib/quiz-loader.ts` are **`'use server'` actions**. On Vercel (no fs), loading falls back to `GET /api/quiz-file?file=...` (`src/app/api/quiz-file/route.ts`).
- Parsing reads **only the first visible sheet**. Row rules: skip header row, empty rows, rows with <7 columns, invalid IDs, **duplicate IDs (first wins)**, empty question text, correct-answer index outside 1–4 or pointing at an empty cell, and rows with <2 non-empty options. Excel columns: A=ID, B=question, C–F=options, G=correct (1–4), H=optional source.
- Selection (`src/lib/quiz-selection.ts`): `filterQuestionsByIdRange` then `selectQuestions`, which uses **Fisher–Yates shuffle (sampling without replacement)** — one run can never contain duplicate questions. `page.tsx.bak`'s old `sort(() => 0.5 - Math.random())` approach is superseded; don't copy it.
- App state machine in `src/app/page.tsx`: `setup → active → results`, modes `learning | testing | exam | challenge`. Wrong answers, XP/streak progress, theme, language, sound all persist in **`localStorage` only** — no backend.

## Vietnamese filename gotcha (will bite you)

- The `.xlsx` filenames on disk are **NFD (decomposed) Unicode** — verified: none of the 5 files `===` its NFC form. Both `quiz-loader.ts` and the API route handle this via `normalize('NFC')` + `readdir` fallback matching. Never "fix" this by renaming files, and never compare raw filename strings without normalizing first.
- PowerShell tool output **mangles Vietnamese diacritics** (shows `Ke^' toa'n`-style mojibake). When exact strings matter, verify with node (e.g. `node -e "...normalize('NFC')..."`), not by eyeballing PS output.
- Excel `~$*.xlsx` lock files sometimes appear untracked in `public/` — never commit them. File listing comes from `quiz-files.json`, so stray files are ignored.

## Conventions & dead code

- 4-space indent, ~80-col lines, `camelCase` vars/functions, `PascalCase` types. Path alias `@/*` → `src/*` (tsconfig).
- `src/app/page.tsx.bak` and `src/components/quiz/QuizSetup.tsx.bak` are **stale copies — never edit or import**.
- `docs/` (`api.md`, `blueprint.md`, `EXAM_*.md`) is partly generated and can drift; trust executable code over prose when they conflict. README is authoritative for quiz modes, file format, and Vercel deploy (`NEXT_PUBLIC_APP_URL` env + redeploy).
