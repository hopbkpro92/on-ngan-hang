# Exam Mode Timer Feature

## Overview
Added a 120-minute countdown timer to exam mode that automatically submits the quiz when time expires.

## Implementation Date
October 18, 2025

## Features

### 1. Countdown Timer
- **Duration**: 120 minutes (7,200 seconds)
- **Display Format**: HH:MM:SS (e.g., "02:00:00", "01:30:45")
- **Visual Feedback**: Color changes based on remaining time
  - Green: More than 15 minutes remaining
  - Orange: 15 minutes or less remaining
  - Red: 5 minutes or less remaining

### 2. Auto-Submit Functionality
- Automatically submits the quiz when timer reaches 00:00:00
- Prevents duplicate submissions using a ref flag
- Cleans up timer interval on component unmount
- Timer is cleared when user manually submits the quiz

### 3. Timer Reset
- Timer resets to 120 minutes when starting a new quiz
- Timer state is properly maintained across question navigation

## Technical Changes

### Modified File: `src/components/quiz/QuizArea.tsx`

#### New Imports
```tsx
import { useRef } from "react"; // Added to existing imports
import { Clock } from "lucide-react"; // Added to icon imports
import { Alert, AlertDescription } from "@/components/ui/alert"; // New import
```

#### New State Variables
```tsx
const [timeRemaining, setTimeRemaining] = useState<number>(120 * 60); // 120 minutes in seconds
const timerRef = useRef<NodeJS.Timeout | null>(null);
const autoSubmitRef = useRef<boolean>(false);
```

#### Timer Effect
- Countdown timer that runs only in exam mode
- Updates every second
- Auto-submits when time reaches zero
- Proper cleanup on unmount

#### Helper Functions
- `formatTime(seconds: number)`: Formats seconds to HH:MM:SS display
- `getTimerColor()`: Returns appropriate color class based on remaining time

#### UI Changes
- Added Alert component displaying countdown timer (only visible in exam mode)
- Timer shows above the progress bar
- Clock icon for visual clarity
- Large, bold font for easy readability

## User Experience

### Starting Exam Mode
1. User selects "Exam Mode" in quiz setup
2. Sets number of questions (default 100)
3. Clicks "Start Quiz"
4. Timer begins at 120:00:00

### During Exam
- Timer continuously counts down
- Color changes to orange with 15 minutes left (warning)
- Color changes to red with 5 minutes left (urgent)
- Users can navigate between questions freely
- Timer persists across all questions

### Timer Expiration
- When timer reaches 00:00:00, quiz automatically submits
- User is shown results page
- Unanswered questions are marked as incorrect

### Manual Submission
- User can submit before timer expires
- Timer is immediately stopped upon manual submission

## Code Quality

### Best Practices Implemented
- ✅ Proper cleanup of intervals
- ✅ Prevention of duplicate submissions
- ✅ Reset timer when new quiz starts
- ✅ Responsive design with color indicators
- ✅ No timer in learning/testing modes
- ✅ TypeScript type safety maintained

### Performance Considerations
- Timer only runs in exam mode
- Uses `setInterval` for consistent updates
- Minimal re-renders (timer state isolated)
- Proper dependency arrays in useEffect hooks

## Testing Recommendations

### Manual Testing Checklist
- [ ] Timer starts at 120:00:00 in exam mode
- [ ] Timer counts down correctly (verify at multiple intervals)
- [ ] Timer changes color at 15-minute mark
- [ ] Timer changes color at 5-minute mark
- [ ] Auto-submit occurs when timer reaches 00:00:00
- [ ] Manual submit stops the timer
- [ ] Timer resets when starting a new quiz
- [ ] No timer appears in learning mode
- [ ] No timer appears in testing mode
- [ ] Timer persists when navigating between questions

### Edge Cases to Test
- [ ] Rapidly navigating between questions doesn't affect timer
- [ ] Browser tab switching doesn't break timer
- [ ] Timer cleanup when navigating away from quiz
- [ ] Multiple quick submissions don't cause errors

## Future Enhancements (Optional)

### Possible Improvements
1. **Configurable Timer Duration**: Allow admins to set different time limits
2. **Warning Notifications**: Show toast/alert at 30 min, 15 min, 5 min marks
3. **Pause Functionality**: Allow timer pause for special circumstances (disabled by default)
4. **Time Tracking**: Record how long users took to complete (for analytics)
5. **Extended Time**: Support for accessibility needs
6. **Audio Alert**: Optional sound when time is running out

## Configuration

### Changing Default Time Limit
To modify the default 120-minute limit, update the following in `QuizArea.tsx`:

```tsx
// Change initial state (line ~24)
const [timeRemaining, setTimeRemaining] = useState<number>(YOUR_MINUTES * 60);

// Change reset value (line ~32)
setTimeRemaining(YOUR_MINUTES * 60);
```

### Changing Warning Thresholds
To modify when colors change:

```tsx
const getTimerColor = (): string => {
    if (timeRemaining <= YOUR_URGENT_MINUTES * 60) return "text-red-600 dark:text-red-400";
    if (timeRemaining <= YOUR_WARNING_MINUTES * 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
};
```

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard JavaScript timing functions
- CSS classes compatible with Tailwind CSS
- Dark mode support included

## Accessibility
- Color changes accompanied by clear numeric display
- Large, readable font size (text-2xl)
- Sufficient contrast ratios maintained
- Semantic HTML with proper ARIA labels via Alert component

## Related Features
- Exam Mode (EXAM_MODE_FEATURE.md)
- Quiz Setup component
- Quiz Results component

## Notes
- Timer only appears in exam mode
- Other quiz modes (learning, testing) are unaffected
- Timer precision: 1 second intervals (sufficient for 120-minute duration)
