# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

See [README.md](README.md) for all dev commands.

## Architecture Overview

See [README.md](README.md) for quiz modes, roles, quiz file format, and deployment instructions.

## Coding Conventions

- **Indentation**: 4 spaces. No tabs.
- **Max line length**: 80 characters.
- **Naming**:
  - Variables and functions: `camelCase`
  - Classes and types: `PascalCase`

## Key TypeScript Types

```typescript
// src/lib/quiz-data.ts
interface Question {
  id: number;
  question: string;
  options: string[];           // Always 4 options
  correctAnswerIndex: number;   // 0-indexed (0–3)
}

interface QuizFileMetadata {
  path: string;                 // e.g. "8. Kế toán giao dịch khách hàng.xlsx"
  role: string;                // e.g. "Kế toán", "Kiến thức chung"
  examQuestions: number;       // How many to pull from this file in exam mode
}

type UserRole = "Kế toán" | "Kiểm ngân" | "Tín dụng" | "Quản lý";
```

```typescript
// src/app/page.tsx
type QuizState = "setup" | "active" | "results";
type QuizMode = "learning" | "testing" | "exam";
```
