# Quick Test Guide for New Error Messages

## Step 1: Start the Server

Open a terminal in your project directory and run:

```bash
npm run dev
```

The server should start and show you a URL like:
- `http://localhost:5173`
- Or another port if 5173 is busy

**Note:** If you get permission errors, try:
- Using a different port: `npx vite --port 3000`
- Or check if another process is using the port

---

## Step 2: Open the App

Open the URL shown in your terminal in your web browser.

---

## Step 3: Test Error Messages

### Test 1: Invalid Video ID Error
1. In the video input field, type: `invalid123`
2. Press Enter or wait for it to try to load
3. **Expected Result:** You should see:
   > "Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos."

### Test 2: End Time Validation Error
1. Load a valid video first (use a real YouTube URL)
2. Set Start Time to: `1:00`
3. Set End Time to: `0:30` (before start time)
4. **Expected Result:** You should see:
   > "End time must be after start time. Use the 'Set from Video' buttons to capture times accurately."

### Test 3: Start Time Duration Error
1. With a valid video loaded, note the video duration (shown in the UI)
2. Set Start Time to a value greater than the video duration
   - For example, if video is 3:00, set start to `4:00`
3. **Expected Result:** You should see:
   > "Start time must be before the video ends ([duration]). Use the 'Set from Video' button to capture the exact time."

### Test 4: End Time Duration Error
1. With a valid video loaded, set End Time to greater than video duration
2. **Expected Result:** You should see:
   > "End time cannot be after the video ends ([duration]). Use the 'Set from Video' button to capture the exact time."

### Test 5: Invalid Video When Saving Loop
1. Clear the video input (or leave it empty/invalid)
2. Try to click "Save Loop"
3. **Expected Result:** You should see:
   > "Invalid video. Please load a valid YouTube video first. You can paste a URL, enter a Video ID, or use the search box above."

### Test 6: Default Video Error
1. Without a valid video loaded, try to set it as default (click the star button)
2. **Expected Result:** You should see:
   > "Please load a valid video first. Paste a YouTube URL, enter a Video ID, or use the search box above."

### Test 7: Delete Default Video Error
1. Set a video as your default (click the star ★ button)
2. Try to delete that video from Recent Videos (click the X)
3. **Expected Result:** You should see:
   > "Cannot delete the default video. Click the star (★) button to remove it as default first, then you can delete it."

---

## What to Look For

✅ **New messages should:**
- Be more helpful and specific
- Include actionable suggestions
- Mention available features (search box, buttons)
- Use clearer language ("after" not "greater than")
- Provide multiple ways to fix the issue

❌ **Old messages would have been:**
- More technical
- Less helpful
- No suggestions
- Brief and unclear

---

## Quick Checklist

- [ ] Invalid video ID shows new message with search box mention
- [ ] End time validation mentions "Set from Video" buttons
- [ ] Duration errors mention "Set from Video" button
- [ ] Invalid video errors mention multiple input methods
- [ ] Default video error mentions star button
- [ ] All messages are user-friendly and actionable

---

## If You See the Old Messages

If you see the old error messages, it means:
1. The server might be serving cached files - try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. The changes might not have saved - check that the files were saved
3. You might need to restart the dev server

---

## Troubleshooting

**Server won't start?**
- Check if port 5173 is already in use: `lsof -ti:5173`
- Try a different port: `npx vite --port 3000`
- Check for permission issues

**Not seeing new messages?**
- Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Restart the dev server
- Check browser console for errors

---

## Success!

If you see the new, more helpful error messages, the implementation is working correctly! 🎉
