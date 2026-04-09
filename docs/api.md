# API Documentation

> Generated from source code analysis — April 2026

## Overview

This application exposes a single REST API route for serving quiz Excel files. Quiz data is primarily loaded via **Server Actions** in `src/lib/quiz-loader.ts`, which are RPC-style functions called directly from React components.

---

## REST API

### `GET /api/quiz-file`

Serves an Excel quiz file from the `public/` directory.

**Request**

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| `file`    | string | Yes      | Filename of the `.xlsx` or `.xls` file   |

**Responses**

| Status | Description                        | Body                                                                              |
|--------|------------------------------------|-----------------------------------------------------------------------------------|
| `200`  | File served successfully           | Binary Excel file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) |
| `400`  | Missing or invalid `file` parameter | `{ "error": "File name is required" \| "Invalid file type" \| "Invalid file name" }` |
| `404`  | File not found on disk             | `{ "error": "File not found" }`                                                    |
| `500`  | Server error                       | `{ "error": "Internal server error", "details": "..." }`                          |

**Security constraints**

- Only `.xlsx` and `.xls` extensions are allowed.
- Path traversal characters (`..`, `/`, `\`) are rejected.

**curl example**

```bash
# Download a quiz file
curl -O "http://localhost:9002/api/quiz-file?file=8.%20K%E1%BA%BF%20to%C3%A1n%20giao%20d%E1%BB%8Bch%20kh%C3%A1ch%20h%C3%A0ng.xlsx"

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:9002/api/quiz-file?file=8.%20K%E1%BA%BF%20to%C3%A1n%20giao%20d%E1%BB%8Bch%20kh%C3%A1ch%20h%C3%A0ng.xlsx" -OutFile "quiz.xlsx"
```

---

## Server Actions

Server Actions are async functions marked with `'use server'` in `src/lib/quiz-loader.ts`. They run on the Next.js server and are called directly from client components.

### `loadQuizData(fileName: string): Promise<Question[]>`

Parses a single quiz Excel file and returns its questions.

```typescript
// Example usage (called from a Server Component or API route)
import { loadQuizData } from '@/lib/quiz-loader';

const questions = await loadQuizData('8. Kế toán giao dịch khách hàng.xlsx');
```

**Parameters**

| Name     | Type   | Description                                      |
|----------|--------|--------------------------------------------------|
| `fileName` | `string` | Filename of the `.xlsx`/`.xls` file in `public/` |

**Data loading strategy (server-side)**

1. Attempt direct filesystem read via `fs.readFile`.
2. If filesystem fails (e.g., Vercel deployment), fall back to fetching `/api/quiz-file`.
3. Normalize filename with NFC Unicode form; scan `public/` directory as a fallback.

**Returns** `Promise<Question[]>`

Throws on parse failure.

**Returns**

```typescript
interface Question {
    id: number;                 // Unique positive integer
    question: string;           // Question text
    options: [string, string, string, string]; // Always 4 options
    correctAnswerIndex: number; // 0-indexed (0–3)
}
```

---

### `listAvailableQuizFiles(userRole?: UserRole): Promise<QuizFileMetadata[]>`

Fetches the file manifest from `/quiz-files.json` and optionally filters by role.

```typescript
import { listAvailableQuizFiles } from '@/lib/quiz-loader';

// All files
const allFiles = await listAvailableQuizFiles();

// Files for a specific role (includes "Kiến thức chung")
const accountingFiles = await listAvailableQuizFiles('Kế toán');
```

**Parameters**

| Name      | Type                          | Description                                 |
|-----------|-------------------------------|---------------------------------------------|
| `userRole` | `UserRole` *(optional)*        | Filter to files matching role + common knowledge |

**UserRole type**

```typescript
type UserRole = "Kế toán" | "Kiểm ngân" | "Tín dụng" | "Quản lý";
```

**QuizFileMetadata type**

```typescript
interface QuizFileMetadata {
    path: string;          // e.g. "8. Kế toán giao dịch khách hàng.xlsx"
    role: string;          // e.g. "Kế toán"
    examQuestions: number; // Questions to pull from this file in exam mode
}
```

**Retry behaviour** — up to 5 retries with 1-second delay on fetch failure.

**Environment-aware URL resolution**

| Environment variable          | URL used                                           |
|-------------------------------|----------------------------------------------------|
| `NEXT_PUBLIC_APP_URL`         | `${NEXT_PUBLIC_APP_URL}/quiz-files.json`           |
| `VERCEL_URL`                 | `https://${VERCEL_URL}/quiz-files.json`            |
| None (local dev)             | `http://localhost:9002/quiz-files.json`            |

---

### `loadExamQuestions(userRole: UserRole, totalQuestions?: number): Promise<Question[]>`

Loads a randomised exam set for a given role, distributing questions across files according to each file's `examQuestions` count.

```typescript
import { loadExamQuestions } from '@/lib/quiz-loader';

const exam = await loadExamQuestions('Kế toán', 100);
```

**Parameters**

| Name            | Type      | Default | Description                            |
|-----------------|-----------|---------|----------------------------------------|
| `userRole`      | `UserRole` | —      | **Required.** Role for role-based filtering |
| `totalQuestions`| `number`  | `100`   | Target total (may be less if files are smaller) |

**Algorithm**

1. Call `listAvailableQuizFiles(userRole)` to get matching files.
2. Load all questions from each file via `loadQuizData`.
3. For each file, randomly sample `Math.min(examQuestions, available)` questions.
4. Shuffle all selected questions together.

Returns an empty array if no files are found for the role.

---

## AI Integration (`src/ai/`)

### `ai` (Genkit instance)

```typescript
// src/ai/genkit.ts
import { ai } from '@/ai/genkit';

export const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.0-flash',
});
```

Configured with the **Google AI (Gemini 2.0 Flash)** model via the Genkit framework. This instance is used to run AI-powered flows defined in `src/ai/`.

### `src/ai/dev.ts`

Flows are imported for their side effects (registration with the Genkit registry). See Genkit dev server logs (`npm run genkit:dev`) for registered flow details.

---

## Utility Functions (`src/lib/utils.ts`)

### `cn(...inputs: ClassValue[]): string`

Combines [clsx](https://github.com/lukeed/clsx) class names with [tailwind-merge](https://github.com/dcastil/tailwind-merge) to deduplicate Tailwind classes.

```typescript
import { cn } from '@/lib/utils';

<div className={cn('px-4 py-2', isActive && 'bg-blue-500', className)} />
```

---

## Toast System (`src/hooks/use-toast.ts`)

A lightweight toast notification hook inspired by `react-hot-toast`.

### `toast(props: Toast): { id: string; dismiss: () => void; update: (toast: ToasterToast) => void }`

Programmatically show a toast.

```typescript
import { toast } from '@/hooks/use-toast';

toast({ title: 'Saved!', description: 'Your quiz has been saved.' });
toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
```

### `useToast(): State & { toast: typeof toast; dismiss: (toastId?: string) => void }`

React hook to read toast state in a component.

```typescript
import { useToast } from '@/hooks/use-toast';

const { toasts, dismiss } = useToast();
```

---

## Error Handling

All REST API errors return a JSON body with an `error` string. Server Actions throw `Error` instances whose messages are safe to display to users.

| Scenario                    | REST API status | Server Action behaviour        |
|-----------------------------|-----------------|--------------------------------|
| Missing required parameter  | `400`           | Throws with descriptive message |
| Invalid file type           | `400`           | —                              |
| Path traversal attempt      | `400`           | —                              |
| File not found              | `404`           | Throws `"Could not load..."`   |
| Parse/validation error      | —               | Throws with skip reason        |
| Network/IO failure          | `500`           | Throws with underlying error   |

---

## Type Summary

```typescript
// Question
interface Question {
    id: number;
    question: string;
    options: [string, string, string, string];
    correctAnswerIndex: number; // 0–3
}

// Quiz file manifest entry
interface QuizFileMetadata {
    path: string;
    role: string;
    examQuestions: number;
}

// Supported user roles
type UserRole = "Kế toán" | "Kiểm ngân" | "Tín dụng" | "Quản lý";

// Quiz state machine (from src/app/page.tsx)
type QuizState = "setup" | "active" | "results";
type QuizMode = "learning" | "testing" | "exam";
```
