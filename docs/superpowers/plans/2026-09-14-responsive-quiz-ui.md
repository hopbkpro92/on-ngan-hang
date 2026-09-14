# Responsive Quiz UI Implementation Plan

**Goal:** Make the quiz interface clearer to scan and comfortable to use on
desktop and mobile without changing quiz behavior.

**Architecture:** Keep the existing page and quiz components. Update the shared
theme and each existing surface with a consistent content width, spacing,
contrast, and responsive control layout.

**Tech Stack:** Next.js, React, Tailwind CSS, shadcn/ui, Lucide icons.

## Global Constraints

- Preserve existing quiz state, data loading, and answer behavior.
- Keep the existing component boundaries and UI library.
- Use responsive classes so narrow screens do not overflow horizontally.

### Task 1: Establish the visual foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

- [ ] Update colors, page background, typography defaults, and focus states.
- [ ] Constrain the app content and improve header, footer, and setup spacing.
- [ ] Run the project typecheck/build check.

### Task 2: Improve quiz surfaces

**Files:**
- Modify: `src/components/quiz/QuizSetup.tsx`
- Modify: `src/components/quiz/QuestionDisplayCard.tsx`
- Modify: `src/components/quiz/QuizArea.tsx`
- Modify: `src/components/quiz/QuizResults.tsx`

- [ ] Improve readable text sizing and option hit areas.
- [ ] Stack navigation and status controls on narrow screens.
- [ ] Make feedback, score summary, and review rows easier to scan.
- [ ] Run the project typecheck/build check again.