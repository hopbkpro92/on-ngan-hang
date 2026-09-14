# Quiz Whiz

Interactive multiple-choice quiz application for bank staff. Supports three quiz modes and role-based question banks.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:9002
npm run build
npm run start
npm run lint
npm run typecheck
npm run genkit:dev # Start Genkit dev server (AI flows)
```

## Quiz Modes

| Mode | Description |
|------|-------------|
| **Testing** | Answer questions freely. No feedback until the end. |
| **Learning** | Immediate feedback after each answer (correct/incorrect + explanation). |
| **Exam** | 90-minute timed exam. Auto-submits when time expires. |
| **Quick challenge** | Answer 10 questions in 60 seconds. Auto-submits when time expires. |

## Roles

Four role-based question banks: **Kế toán**, **Kiểm ngân**, **Tín dụng**, **Quản lý**. Questions tagged `"Kiến thức chung"` (common knowledge) appear for all roles.

## Local Progress

XP, level, study streak, daily goal progress, and accuracy statistics are
stored in the browser's `localStorage`. No login, database, or separate server
is required. Progress is specific to the current browser and device.

## Quiz File Format

Add Excel `.xlsx` files to the `public/` folder. Each file must have one sheet with these columns:

| Column | Content | Example |
|--------|---------|---------|
| A | Question ID (positive integer) | `1` |
| B | Question text | `Ngân hàng được thành lập năm nào?` |
| C | Option A | `1990` |
| D | Option B | `1995` |
| E | Option C | `2000` |
| F | Option D | `2005` |
| G | Correct answer (1–4) | `2` |
| H | Reference source (optional) | `Quy định nội bộ, mục 3` |

Register each file in `public/quiz-files.json`:

```json
[
  {
    "path": "8. Kế toán giao dịch khách hàng.xlsx",
    "role": "Kế toán",
    "examQuestions": 30
  },
  {
    "path": "9. Kiểm ngân.xlsx",
    "role": "Kiểm ngân",
    "examQuestions": 30
  },
  {
    "path": "17. Kiến thức chung.xlsx",
    "role": "Kiến thức chung",
    "examQuestions": 40
  }
]
```

- `role` must match one of the four roles or be `"Kiến thức chung"`.
- `examQuestions` is how many questions to pull from this file in exam mode.

## Deployment (Vercel)

1. Push all Excel files and `quiz-files.json` to the `public/` folder.
2. In Vercel dashboard → **Settings → Environment Variables**, add:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://your-app.vercel.app`
   - **Environments**: Production, Preview, Development (all checked)
3. Click **Save**, then **Redeploy** (not just a code push).

For troubleshooting, see `VERCEL_TROUBLESHOOTING.md`.
