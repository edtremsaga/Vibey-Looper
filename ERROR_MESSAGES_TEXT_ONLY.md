# Simple Error Message Text Updates

## The Simplest Approach: Just Update the Text

No components, no state changes, no refactoring - just replace the error message text with better, more helpful versions.

---

## Step 1: Update Error Messages in helpers.js (2 minutes)

In `src/utils/helpers.js`, replace the `getYouTubeErrorMessage` function:

**Current:**
```javascript
export const getYouTubeErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 2:
      return 'Invalid video ID. Please check the URL or Video ID.'
    case 5:
      return 'The HTML5 player cannot be found. Please refresh the page.'
    case 100:
      return 'Video not found. It may have been removed or made private.'
    case 101:
    case 150:
      return 'Video is not available for embedding. It may be private or restricted.'
    default:
      return 'Failed to load video. Please check the URL or Video ID and try again.'
  }
}
```

**Replace with:**
```javascript
export const getYouTubeErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 2:
      return 'Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos.'
    case 5:
      return 'Video player error. Please refresh the page (F5 or Cmd+R) to reload the player.'
    case 100:
      return 'Video not found. The video may have been removed, made private, or the URL is incorrect. Try searching for the video using the search box above, or check the URL.'
    case 101:
    case 150:
      return 'Video is not available. This video is private or restricted and cannot be played. Try a different video that is publicly available.'
    default:
      return 'Failed to load video. Please check the URL or Video ID and try again. You can also use the search box above to find videos.'
  }
}
```

---

## Step 2: Update Error Messages in App.jsx (5 minutes)

Find and replace these error messages in `App.jsx`:

### 2.1 Player Initialization Error
**Find:**
```javascript
setValidationError('Error initializing video player. Please refresh the page and try again.')
```

**Replace with:**
```javascript
setValidationError('Video player failed to load. Please refresh the page (F5 or Cmd+R) to reload the player.')
```

### 2.2 Video Load Error
**Find:**
```javascript
setValidationError('Error loading video. Please check the URL or Video ID and try again.')
```

**Replace with:**
```javascript
setValidationError('Failed to load video. Please check the URL or Video ID and try again. You can also use the search box above to find videos.')
```

### 2.3 Start Video Error
**Find:**
```javascript
setValidationError('Failed to start video. Please try again.')
```

**Replace with:**
```javascript
setValidationError('Failed to start video. Make sure the video is loaded and try again. If the problem persists, refresh the page.')
```

### 2.4 Resume Video Error
**Find:**
```javascript
setValidationError('Failed to resume video. Please try again.')
```

**Replace with:**
```javascript
setValidationError('Failed to resume video. Try clicking "Start Loop" again, or refresh the page if the problem continues.')
```

### 2.5 Reset Error
**Find:**
```javascript
setValidationError('Failed to reset video position. Please try again.')
```

**Replace with:**
```javascript
setValidationError('Failed to reset video position. Try clicking "Reset Loop" again, or manually seek to the start time.')
```

### 2.6 General Error
**Find:**
```javascript
setValidationError('An error occurred. Please try again.')
```

**Replace with:**
```javascript
setValidationError('An error occurred. Please try again. If the problem persists, refresh the page.')
```

### 2.7 Save Loop Error
**Find:**
```javascript
setValidationError('Failed to save loop. Please try again.')
```

**Replace with:**
```javascript
setValidationError('Failed to save loop. Make sure you have a valid video loaded and try again. If the problem continues, refresh the page.')
```

---

## Step 3: Update Validation Error Messages (5 minutes)

### 3.1 End Time Validation
**Find:**
```javascript
setValidationError('End time must be greater than start time')
```

**Replace with:**
```javascript
setValidationError('End time must be after start time. Use the "Set from Video" buttons to capture times accurately.')
```

### 3.2 Start Time Duration Validation
**Find:**
```javascript
setValidationError(`Start time must be less than video duration (${secondsToMMSS(videoDuration)})`)
```

**Replace with:**
```javascript
setValidationError(`Start time must be before the video ends (${secondsToMMSS(videoDuration)}). Use the "Set from Video" button to capture the exact time.`)
```

### 3.3 End Time Duration Validation
**Find:**
```javascript
setValidationError(`End time cannot exceed video duration (${secondsToMMSS(videoDuration)})`)
```

**Replace with:**
```javascript
setValidationError(`End time cannot be after the video ends (${secondsToMMSS(videoDuration)}). Use the "Set from Video" button to capture the exact time.`)
```

### 3.4 Save Loop Validation
**Find:**
```javascript
setValidationError('End time must be greater than start time.')
```

**Replace with:**
```javascript
setValidationError('End time must be after start time. Use the "Set from Video" buttons to set your loop times.')
```

### 3.5 Invalid Video Validation
**Find:**
```javascript
setValidationError('Invalid video. Please load a valid YouTube video first.')
```

**Replace with:**
```javascript
setValidationError('Invalid video. Please load a valid YouTube video first. You can paste a URL, enter a Video ID, or use the search box above.')
```

### 3.6 Default Video Error
**Find:**
```javascript
setValidationError('Please load a valid video first')
```

**Replace with:**
```javascript
setValidationError('Please load a valid video first. Paste a YouTube URL, enter a Video ID, or use the search box above.')
```

### 3.7 Delete Default Video Error
**Find:**
```javascript
setValidationError('Cannot delete the default video. Remove it as default first.')
```

**Replace with:**
```javascript
setValidationError('Cannot delete the default video. Click the star (★) button to remove it as default first, then you can delete it.')
```

---

## That's It!

**Total time: ~12 minutes**  
**Files changed: 2 files** (helpers.js and App.jsx)  
**No new components, no state changes, no refactoring**

---

## Before & After Examples

### Example 1: Video Not Found
**Before:**
> "Video not found. It may have been removed or made private."

**After:**
> "Video not found. The video may have been removed, made private, or the URL is incorrect. Try searching for the video using the search box above, or check the URL."

### Example 2: Invalid Video ID
**Before:**
> "Invalid video ID. Please check the URL or Video ID."

**After:**
> "Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos."

### Example 3: End Time Validation
**Before:**
> "End time must be greater than start time"

**After:**
> "End time must be after start time. Use the 'Set from Video' buttons to capture times accurately."

---

## Benefits

✅ **User-friendly**: Clear, helpful language  
✅ **Actionable**: Tells users what to do  
✅ **No code changes**: Just text updates  
✅ **No risk**: Can't break anything  
✅ **Quick**: Done in 12 minutes  

---

## Optional: Add Keyboard Shortcut Hints

You could also mention keyboard shortcuts in relevant errors:

```javascript
// In player initialization error
setValidationError('Video player failed to load. Press F5 (or Cmd+R on Mac) to refresh the page.')
```

But the text-only approach above is the absolute simplest way to improve error messages!
