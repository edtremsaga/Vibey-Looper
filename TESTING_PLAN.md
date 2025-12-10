# Testing Plan for Vibey Looper
**Goal:** Add tests gradually, starting with critical helper functions

---

## Phase 1: Setup Testing Infrastructure (30 minutes)

### Step 1: Install Testing Dependencies
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Step 2: Configure Vitest
Create `vitest.config.js`:
```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js'
  }
})
```

### Step 3: Add Test Script to package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

**Time Investment:** 30 minutes  
**Risk:** Very Low - Just setup, no code changes

---

## Phase 2: Extract Helper Functions (1 hour)

### Why Extract?
Helper functions are currently inside `App.jsx`. To test them, we need to export them.

### Step 1: Create `src/utils/helpers.js`
Move these functions:
- `secondsToMMSS`
- `mmssToSeconds`
- `extractVideoId`
- `getYouTubeErrorMessage`

### Step 2: Create `src/utils/storage.js`
Move these functions:
- `saveRecentVideo`
- `loadRecentVideos`
- `saveDefaultVideo`
- `loadDefaultVideo`
- `clearDefaultVideo`

### Step 3: Update `App.jsx`
Import from the new files instead of defining locally.

**Time Investment:** 1 hour  
**Risk:** Low - Just moving code, functionality stays the same  
**Benefit:** Makes code more organized AND testable

---

## Phase 3: Test Critical Helper Functions (2-3 hours)

### Priority 1: Time Conversion Functions (30 minutes)

**Why First:** Simple, pure functions, easy to test, used everywhere

**Functions to Test:**
1. `secondsToMMSS`
2. `mmssToSeconds`

**Test Cases:**
```javascript
// secondsToMMSS tests
- Converts 0 seconds to "0:00"
- Converts 65 seconds to "1:05"
- Converts 3661 seconds to "61:01"
- Handles negative numbers
- Handles decimal numbers (rounds down)

// mmssToSeconds tests
- Converts "0:00" to 0
- Converts "1:05" to 65
- Converts "10:30" to 630
- Handles plain number "65" → 65
- Handles empty string → 0
- Handles invalid format → 0
```

**Expected Coverage:** 100% (these are pure functions)

---

### Priority 2: Video ID Extraction (30 minutes)

**Why Second:** Critical for app functionality, handles many edge cases

**Function to Test:**
1. `extractVideoId`

**Test Cases:**
```javascript
// extractVideoId tests
- Extracts from full YouTube URL: "https://www.youtube.com/watch?v=abc123def45"
- Extracts from short URL: "https://youtu.be/abc123def45"
- Extracts from embed URL: "https://www.youtube.com/embed/abc123def45"
- Handles URL with extra parameters: "https://www.youtube.com/watch?v=abc123def45&list=PLxyz"
- Handles already extracted ID: "abc123def45"
- Handles empty input: "" → ""
- Handles null/undefined → ""
- Handles invalid URL → returns trimmed input
```

**Expected Coverage:** 90%+

---

### Priority 3: Error Messages (15 minutes)

**Why Third:** Simple switch statement, easy to test

**Function to Test:**
1. `getYouTubeErrorMessage`

**Test Cases:**
```javascript
// getYouTubeErrorMessage tests
- Error code 2 → "Invalid video ID..."
- Error code 5 → "The HTML5 player cannot be found..."
- Error code 100 → "Video not found..."
- Error code 101 → "Video is not available for embedding..."
- Error code 150 → "Video is not available for embedding..."
- Unknown error code → Default message
```

**Expected Coverage:** 100%

---

### Priority 4: localStorage Functions (1-2 hours)

**Why Fourth:** More complex, requires mocking localStorage

**Functions to Test:**
1. `saveRecentVideo`
2. `loadRecentVideos`
3. `saveDefaultVideo`
4. `loadDefaultVideo`
5. `clearDefaultVideo`

**Test Cases:**
```javascript
// saveRecentVideo tests
- Saves single video
- Saves multiple videos (up to 30)
- 31st video removes oldest
- Duplicate video moves to top
- Handles localStorage errors gracefully

// loadRecentVideos tests
- Returns empty array if no videos
- Returns saved videos
- Handles corrupted localStorage data

// saveDefaultVideo tests
- Saves default video
- Extracts video ID correctly
- Handles errors gracefully

// loadDefaultVideo tests
- Returns null if no default
- Returns saved default video
- Handles corrupted data

// clearDefaultVideo tests
- Removes default video
- Handles errors gracefully
```

**Expected Coverage:** 85%+

---

## Phase 4: Integration Tests (2-3 hours)

### Priority 1: Recent Videos Flow (1 hour)

**Test the entire flow:**
1. Save video → Load video → Verify it's there
2. Save 30 videos → Verify limit
3. Save duplicate → Verify it moves to top
4. Clear localStorage → Verify it handles gracefully

### Priority 2: Default Video Flow (1 hour)

**Test the entire flow:**
1. Set default video → Load default → Verify
2. Clear default → Verify it's cleared
3. Set default → Change video → Verify default persists

### Priority 3: Time Input Flow (30 minutes)

**Test user input scenarios:**
1. User enters "1:30" → Converts to 90 seconds
2. User enters "90" → Converts to 90 seconds
3. User enters invalid format → Handles gracefully

---

## Phase 5: Component Tests (Future - Optional)

### When to Add:
- After helper function tests are solid
- When refactoring components
- When adding new features

### What to Test:
- Button clicks trigger correct actions
- State updates correctly
- Error messages display properly
- Keyboard shortcuts work

---

## Implementation Timeline

### Week 1: Setup + Phase 2 (Extract Functions)
- **Day 1:** Setup testing infrastructure (30 min)
- **Day 2-3:** Extract helper functions to separate files (1 hour)
- **Result:** Code is organized and ready for testing

### Week 2: Phase 3 (Helper Function Tests)
- **Day 1:** Test time conversion functions (30 min)
- **Day 2:** Test video ID extraction (30 min)
- **Day 3:** Test error messages (15 min)
- **Day 4-5:** Test localStorage functions (1-2 hours)
- **Result:** All critical helper functions have tests

### Week 3: Phase 4 (Integration Tests)
- **Day 1-2:** Test recent videos flow (1 hour)
- **Day 3-4:** Test default video flow (1 hour)
- **Day 5:** Test time input flow (30 min)
- **Result:** Core features are integration tested

### Total Time Investment:
- **Setup:** 30 minutes
- **Extraction:** 1 hour
- **Unit Tests:** 2-3 hours
- **Integration Tests:** 2-3 hours
- **Total:** ~6-7 hours over 3 weeks

---

## Example Test File Structure

```
src/
  utils/
    helpers.js          # Time conversion, video ID extraction
    storage.js          # localStorage functions
  test/
    setup.js            # Test configuration
    helpers.test.js      # Tests for helpers.js
    storage.test.js     # Tests for storage.js
    integration.test.js # Integration tests
```

---

## Example Test File

### `src/test/helpers.test.js`
```javascript
import { describe, it, expect } from 'vitest'
import { secondsToMMSS, mmssToSeconds, extractVideoId } from '../utils/helpers'

describe('secondsToMMSS', () => {
  it('converts 0 seconds to "0:00"', () => {
    expect(secondsToMMSS(0)).toBe('0:00')
  })

  it('converts 65 seconds to "1:05"', () => {
    expect(secondsToMMSS(65)).toBe('1:05')
  })

  it('converts 3661 seconds to "61:01"', () => {
    expect(secondsToMMSS(3661)).toBe('61:01')
  })

  it('handles negative numbers', () => {
    expect(secondsToMMSS(-10)).toBe('-1:50')
  })
})

describe('mmssToSeconds', () => {
  it('converts "0:00" to 0', () => {
    expect(mmssToSeconds('0:00')).toBe(0)
  })

  it('converts "1:05" to 65', () => {
    expect(mmssToSeconds('1:05')).toBe(65)
  })

  it('converts plain number "65" to 65', () => {
    expect(mmssToSeconds('65')).toBe(65)
  })

  it('handles empty string', () => {
    expect(mmssToSeconds('')).toBe(0)
  })
})

describe('extractVideoId', () => {
  it('extracts ID from full YouTube URL', () => {
    const url = 'https://www.youtube.com/watch?v=abc123def45'
    expect(extractVideoId(url)).toBe('abc123def45')
  })

  it('extracts ID from short URL', () => {
    const url = 'https://youtu.be/abc123def45'
    expect(extractVideoId(url)).toBe('abc123def45')
  })

  it('handles already extracted ID', () => {
    expect(extractVideoId('abc123def45')).toBe('abc123def45')
  })

  it('handles empty input', () => {
    expect(extractVideoId('')).toBe('')
  })
})
```

---

## Success Metrics

### Phase 1-2 Complete When:
- ✅ Testing infrastructure set up
- ✅ Helper functions extracted to separate files
- ✅ All imports updated

### Phase 3 Complete When:
- ✅ Time conversion functions: 100% coverage
- ✅ Video ID extraction: 90%+ coverage
- ✅ Error messages: 100% coverage
- ✅ localStorage functions: 85%+ coverage

### Phase 4 Complete When:
- ✅ Recent videos flow tested
- ✅ Default video flow tested
- ✅ Time input flow tested

---

## Benefits After Implementation

1. **Confidence:** Know helper functions work correctly
2. **Safety:** Can refactor with confidence
3. **Documentation:** Tests show how functions work
4. **Bug Prevention:** Catch issues before users do
5. **Faster Development:** Automated testing vs manual

---

## Next Steps

1. **Start with Phase 1:** Setup testing infrastructure
2. **Then Phase 2:** Extract helper functions
3. **Then Phase 3:** Write tests for extracted functions
4. **Gradually add more:** Integration tests, component tests

---

## Notes

- **No rush:** This is a gradual process
- **Start small:** One function at a time
- **Build momentum:** Each test makes the next easier
- **Focus on value:** Test what matters most first

