# Exam Mode Feature

## Overview
Added a new "Exam Mode" to the quiz application that creates a comprehensive exam with 100 questions (configurable) pulled proportionally from all available quiz files.

## How It Works

### Proportional Distribution Algorithm
When Exam Mode is selected:

1. **Load All Files**: The system loads questions from all quiz files in the `public` folder
2. **Calculate Total**: Counts the total number of questions across all files (Total_Num)
3. **Proportional Selection**: For each quiz file, the system calculates:
   ```
   questions_from_file = (num_questions_in_file / Total_Num) × 100
   ```
4. **Random Selection**: Randomly selects the calculated number of questions from each file
5. **Final Shuffle**: Mixes all selected questions to create the final exam

### Example
If you have:
- File A: 300 questions (60% of total)
- File B: 150 questions (30% of total)
- File C: 50 questions (10% of total)
- Total: 500 questions

For a 100-question exam:
- File A contributes: 60 questions
- File B contributes: 30 questions
- File C contributes: 10 questions

## Changes Made

### 1. Type Updates (`src/app/page.tsx`)
- Updated `QuizMode` type to include `"exam"` option
- Added import for `loadExamQuestions` function

### 2. New Function (`src/lib/quiz-loader.ts`)
- Added `loadExamQuestions(totalQuestions: number = 100)` function
- Handles loading and proportional distribution of questions
- Includes error handling for missing files or empty questions
- Provides detailed console logging for debugging

### 3. UI Updates (`src/components/quiz/QuizSetup.tsx`)
- Added "Exam Mode" radio button option with Rocket icon
- Updated description to explain all three modes
- Auto-sets question count to 100 when exam mode is selected
- Disables file selector when exam mode is active
- Shows "(Recommended: 100 questions from all files)" helper text

### 4. Quiz Initialization Logic (`src/app/page.tsx`)
- Updated `handleStartQuiz` to detect exam mode
- Calls `loadExamQuestions()` instead of using current file questions
- Shows loading state while exam questions are being prepared
- Hides file selector when in exam mode setup
- Shows informative card explaining exam mode

## User Experience

### Selecting Exam Mode
1. User navigates to the quiz setup page
2. File selector is hidden (exam uses all files)
3. An info card appears: "Exam Mode - Questions will be loaded from all available quiz files with proportional distribution"
4. Question count defaults to 100 (recommended)
5. User can adjust the number if desired
6. Click "Start Quiz" to begin

### During Exam
- Questions appear in random order (mixed from all files)
- Exam mode follows "Testing Mode" rules (answers shown at end)
- User completes all 100 questions
- Results show performance across all question sources

## Configuration

### Default Exam Size
The default exam size is **100 questions**. To change this:
- Modify the default parameter in `loadExamQuestions()` in `quiz-loader.ts`
- Or have users manually adjust the number in the UI

### Minimum Questions Required
The system will work with as few questions as available, but will not exceed the total available questions across all files.

## Error Handling

The system gracefully handles:
- No quiz files available → Shows error message
- Individual file loading failures → Skips that file, continues with others
- Insufficient questions → Uses all available questions
- Rounding issues in proportional distribution → Adjusts to exact count needed

## Testing Recommendations

1. **Single File**: Test with only one quiz file to ensure it still works
2. **Multiple Files**: Test with multiple files of varying sizes
3. **Edge Cases**: 
   - Very few total questions (< 100)
   - Many files with few questions each
   - One large file + several small files
4. **Performance**: Monitor loading time with many files

## Future Enhancements

Potential improvements:
- Allow users to select which files to include in the exam
- Show breakdown of questions per file in results
- Save exam configurations for reuse
- Time limits for exam mode
- Score thresholds for pass/fail
