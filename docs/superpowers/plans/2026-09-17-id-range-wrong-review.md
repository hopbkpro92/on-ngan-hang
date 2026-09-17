# ID Range and Wrong Review Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with focused validation after each task.

**Goal:** Let Learning and Practice sessions select questions by Excel ID range, choose sequential or random ordering, retry the same set or a new set, and review wrong questions from the current and earlier sessions.

**Architecture:** Keep question selection pure in `src/lib/quiz-selection.ts`. Keep persisted wrong-question IDs separate from aggregate progress in `src/lib/quiz-wrong-answers.ts`, keyed by quiz file path. Pass explicit selection settings and action callbacks through `QuizSetup` and `QuizResults`; retain the current session question list in `page.tsx` so exact retry remains deterministic.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest.

## Global Constraints

- Use 4-space indentation and existing TypeScript/React patterns.
- Use Excel `Question.id` values for range filtering; missing IDs are valid gaps.
- Preserve existing Exam and Quick Challenge behavior.
- Persist wrong-answer history in browser `localStorage`; do not change the existing aggregate progress schema.
- Keep labels localized through `src/lib/i18n.ts`.

---

### Task 1: Add selection and wrong-answer domain helpers

**Files:**
- Create: `src/lib/quiz-selection.ts`
- Create: `src/lib/quiz-wrong-answers.ts`
- Create: `scripts/quiz-selection.test.ts`
- Create: `scripts/quiz-wrong-answers.test.ts`

**Interfaces:**
- `SelectionOrder = "sequential" | "random"`
- `filterQuestionsByIdRange(questions, fromId, toId): Question[]`
- `selectQuestions(questions, count, order): Question[]`
- `getQuestionIdRange(questions): { minId: number; maxId: number } | null`
- `WrongAnswerHistory = Record<string, number[]>`
- `loadWrongAnswerIds(storage, filePath): number[]`
- `recordWrongAnswers(storage, filePath, questions, answers): void`
- `getStoredWrongQuestions(questions, ids): Question[]`

- [ ] Write failing tests for ID filtering, sequential selection, random selection with a mocked random source, missing IDs, and wrong-answer persistence/removal.
- [ ] Run the focused Vitest tests and confirm they fail because the helpers do not exist.
- [ ] Implement the smallest pure helpers and safe localStorage parsing/writing.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Add localized setup and result actions

**Files:**
- Modify: `src/lib/i18n.ts`
- Modify: `src/components/quiz/QuizSetup.tsx`
- Modify: `src/components/quiz/QuizResults.tsx`

**Interfaces:**
- `QuizSetup` receives the selected file path, available question ID range, and callbacks for stored wrong-question review.
- `QuizResults` receives callbacks for exact retry and persisted wrong-question review.

- [ ] Add translation keys for ID range labels, ordering labels, valid-count feedback, exact retry, current wrong review, and stored wrong review.
- [ ] Add range inputs and sequential/random controls for learning/testing only; retain existing exam/challenge behavior.
- [ ] Add setup action for stored wrong questions and show the valid question count within the selected ID range.
- [ ] Add result actions for exact retry and stored wrong review without removing the existing current-session incorrect action.
- [ ] Run typecheck to expose integration errors before wiring page state.

### Task 3: Wire selection state and wrong-answer history into the quiz page

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- `handleStartQuiz(numQuestions, mode, range, order)` filters by `Question.id`, then selects sequentially or randomly.
- `handleRetakeQuiz` starts a new selection with the prior settings.
- `handleRetakeSameQuiz` restores the prior `Question[]` exactly.
- `handleReviewStoredIncorrect` starts a learning session from stored wrong IDs in the selected file/range.

- [ ] Add state for ID range, selection order, and the last selection settings.
- [ ] Replace inline random selection with `filterQuestionsByIdRange` and `selectQuestions` for learning/testing.
- [ ] Record each completed answer set into wrong-answer storage keyed by `selectedFile.path`.
- [ ] Preserve current-session review and make stored review use the current file and optional ID range.
- [ ] Handle empty ranges and empty stored history with existing toast/error patterns.
- [ ] Run typecheck and focused tests.

### Task 4: Document and verify the user workflow

**Files:**
- Modify: `README.md`
- Modify: `scripts/quiz-progress.test.ts` only if shared behavior requires coverage.

- [ ] Document ID-range semantics, missing IDs, retry behavior, and browser-local wrong-answer history.
- [ ] Run all available tests and `npm run typecheck`.
- [ ] Run `npm run build` to catch Next.js integration issues.
- [ ] Review the final diff for unrelated changes and confirm Exam/Challenge paths remain unchanged.
