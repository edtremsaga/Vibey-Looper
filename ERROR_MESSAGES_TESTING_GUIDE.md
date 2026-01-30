# Error Messages Testing Guide

## ✅ Code Verification Complete

I've verified that all the new error messages are correctly implemented in the code:
- ✅ `src/utils/helpers.js` - All 5 YouTube API error messages updated
- ✅ `src/App.jsx` - All 14 error messages updated
- ✅ No linter errors
- ✅ All new messages match the comparison document

---

## Manual Testing Steps

To test the error messages in the browser, follow these steps:

### 1. Start the Dev Server
```bash
npm run dev
```

The server should start on `http://localhost:5173` (or another port if 5173 is taken).

### 2. Test YouTube API Error Messages

#### Test Error Code 2 (Invalid Video ID)
1. Open the app in your browser
2. Enter an invalid video ID (e.g., "invalid123" or "abc")
3. **Expected:** Should see: "Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos."

#### Test Error Code 100 (Video Not Found)
1. Enter a valid-looking but non-existent video ID (e.g., "dQw4w9WgXcQ" - this is a real video, try "12345678901" instead)
2. **Expected:** Should see: "Video not found. The video may have been removed, made private, or the URL is incorrect. Try searching for the video using the search box above, or check the URL."

#### Test Error Code 101/150 (Private Video)
1. Try to load a private video (if you have access to one)
2. **Expected:** Should see: "Video is not available. This video is private or restricted and cannot be played. Try a different video that is publicly available."

#### Test Error Code 5 (Player Error)
- This is harder to trigger, but if it occurs:
- **Expected:** Should see: "Video player error. Please refresh the page (F5 or Cmd+R) to reload the player."

### 3. Test Validation Error Messages

#### Test End Time Validation
1. Load a valid video
2. Set start time to "1:00"
3. Set end time to "0:30" (before start time)
4. **Expected:** Should see: "End time must be after start time. Use the 'Set from Video' buttons to capture times accurately."

#### Test Start Time Duration Validation
1. Load a valid video (note the video duration)
2. Set start time to a value greater than the video duration (e.g., if video is 3:00, set start to "4:00")
3. **Expected:** Should see: "Start time must be before the video ends ([duration]). Use the 'Set from Video' button to capture the exact time."

#### Test End Time Duration Validation
1. Load a valid video
2. Set end time to a value greater than the video duration
3. **Expected:** Should see: "End time cannot be after the video ends ([duration]). Use the 'Set from Video' button to capture the exact time."

#### Test Save Loop Validation
1. Set end time before start time
2. Try to save the loop
3. **Expected:** Should see: "End time must be after start time. Use the 'Set from Video' buttons to set your loop times."

### 4. Test App.jsx Error Messages

#### Test Invalid Video Error
1. Try to save a loop without a valid video loaded
2. **Expected:** Should see: "Invalid video. Please load a valid YouTube video first. You can paste a URL, enter a Video ID, or use the search box above."

#### Test Default Video Error
1. Try to set a default video without a valid video loaded
2. **Expected:** Should see: "Please load a valid video first. Paste a YouTube URL, enter a Video ID, or use the search box above."

#### Test Delete Default Video Error
1. Set a video as default
2. Try to delete it from recent videos
3. **Expected:** Should see: "Cannot delete the default video. Click the star (★) button to remove it as default first, then you can delete it."

#### Test Failed to Start Video
- This may be hard to trigger, but if it occurs:
- **Expected:** Should see: "Failed to start video. Make sure the video is loaded and try again. If the problem persists, refresh the page."

#### Test Failed to Save Loop
- This may be hard to trigger, but if it occurs:
- **Expected:** Should see: "Failed to save loop. Make sure you have a valid video loaded and try again. If the problem continues, refresh the page."

---

## Automated Testing (Future Enhancement)

For automated testing, you could create tests like:

```javascript
// Example test structure
describe('Error Messages', () => {
  test('Invalid video ID shows helpful message', () => {
    // Test error code 2
  })
  
  test('Video not found shows actionable suggestions', () => {
    // Test error code 100
  })
  
  test('Validation errors mention Set from Video buttons', () => {
    // Test validation errors
  })
})
```

---

## What to Look For

When testing, verify:
- ✅ Messages are user-friendly (not technical jargon)
- ✅ Messages include actionable suggestions
- ✅ Messages mention available features (search box, buttons)
- ✅ Messages use clear language ("after" not "greater than")
- ✅ Messages provide multiple recovery options
- ✅ Messages are properly displayed in the UI
- ✅ Messages are accessible (screen reader friendly)

---

## Quick Test Checklist

- [ ] Invalid video ID error (Error Code 2)
- [ ] Video not found error (Error Code 100)
- [ ] Private video error (Error Code 101/150)
- [ ] End time validation error
- [ ] Start time duration validation error
- [ ] End time duration validation error
- [ ] Invalid video error (when saving loop)
- [ ] Default video error
- [ ] Delete default video error

---

## Notes

- Some errors (like player errors, network errors) are harder to trigger manually
- The error messages are now more helpful and actionable
- All changes have been verified in the code
- The app should work exactly as before, just with better error messages
