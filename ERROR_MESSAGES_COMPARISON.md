# Error Messages: Old vs New Comparison

## YouTube API Error Messages (helpers.js)

| Error Code | Old Text | New Text |
|------------|----------|----------|
| **2** (Invalid Video ID) | `Invalid video ID. Please check the URL or Video ID.` | `Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos.` |
| **5** (Player Error) | `The HTML5 player cannot be found. Please refresh the page.` | `Video player error. Please refresh the page (F5 or Cmd+R) to reload the player.` |
| **100** (Video Not Found) | `Video not found. It may have been removed or made private.` | `Video not found. The video may have been removed, made private, or the URL is incorrect. Try searching for the video using the search box above, or check the URL.` |
| **101, 150** (Private/Restricted) | `Video is not available for embedding. It may be private or restricted.` | `Video is not available. This video is private or restricted and cannot be played. Try a different video that is publicly available.` |
| **Default** | `Failed to load video. Please check the URL or Video ID and try again.` | `Failed to load video. Please check the URL or Video ID and try again. You can also use the search box above to find videos.` |

---

## App.jsx Error Messages

| Location | Old Text | New Text |
|----------|----------|----------|
| **Player Initialization** | `Error initializing video player. Please refresh the page and try again.` | `Video player failed to load. Please refresh the page (F5 or Cmd+R) to reload the player.` |
| **Video Load** | `Error loading video. Please check the URL or Video ID and try again.` | `Failed to load video. Please check the URL or Video ID and try again. You can also use the search box above to find videos.` |
| **Start Video** | `Failed to start video. Please try again.` | `Failed to start video. Make sure the video is loaded and try again. If the problem persists, refresh the page.` |
| **Resume Video** | `Failed to resume video. Please try again.` | `Failed to resume video. Try clicking "Start Loop" again, or refresh the page if the problem continues.` |
| **Reset Error** | `Failed to reset video position. Please try again.` | `Failed to reset video position. Try clicking "Reset Loop" again, or manually seek to the start time.` |
| **General Error** | `An error occurred. Please try again.` | `An error occurred. Please try again. If the problem persists, refresh the page.` |
| **Save Loop Error** | `Failed to save loop. Please try again.` | `Failed to save loop. Make sure you have a valid video loaded and try again. If the problem continues, refresh the page.` |

---

## Validation Error Messages

| Location | Old Text | New Text |
|----------|----------|----------|
| **End Time Validation** | `End time must be greater than start time` | `End time must be after start time. Use the "Set from Video" buttons to capture times accurately.` |
| **Start Time Duration** | `Start time must be less than video duration ([duration])` | `Start time must be before the video ends ([duration]). Use the "Set from Video" button to capture the exact time.` |
| **End Time Duration** | `End time cannot exceed video duration ([duration])` | `End time cannot be after the video ends ([duration]). Use the "Set from Video" button to capture the exact time.` |
| **Save Loop Validation** | `End time must be greater than start time.` | `End time must be after start time. Use the "Set from Video" buttons to set your loop times.` |
| **Invalid Video** | `Invalid video. Please load a valid YouTube video first.` | `Invalid video. Please load a valid YouTube video first. You can paste a URL, enter a Video ID, or use the search box above.` |
| **Default Video Error** | `Please load a valid video first` | `Please load a valid video first. Paste a YouTube URL, enter a Video ID, or use the search box above.` |
| **Delete Default Video** | `Cannot delete the default video. Remove it as default first.` | `Cannot delete the default video. Click the star (★) button to remove it as default first, then you can delete it.` |

---

## Detailed Side-by-Side Examples

### Example 1: Video Not Found
**OLD:**
```
Video not found. It may have been removed or made private.
```

**NEW:**
```
Video not found. The video may have been removed, made private, or the URL is incorrect. Try searching for the video using the search box above, or check the URL.
```

---

### Example 2: Invalid Video ID
**OLD:**
```
Invalid video ID. Please check the URL or Video ID.
```

**NEW:**
```
Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos.
```

---

### Example 3: End Time Validation
**OLD:**
```
End time must be greater than start time
```

**NEW:**
```
End time must be after start time. Use the "Set from Video" buttons to capture times accurately.
```

---

### Example 4: Player Error
**OLD:**
```
The HTML5 player cannot be found. Please refresh the page.
```

**NEW:**
```
Video player error. Please refresh the page (F5 or Cmd+R) to reload the player.
```

---

### Example 5: Failed to Start Video
**OLD:**
```
Failed to start video. Please try again.
```

**NEW:**
```
Failed to start video. Make sure the video is loaded and try again. If the problem persists, refresh the page.
```

---

### Example 6: Private Video
**OLD:**
```
Video is not available for embedding. It may be private or restricted.
```

**NEW:**
```
Video is not available. This video is private or restricted and cannot be played. Try a different video that is publicly available.
```

---

## Key Improvements

✅ **More specific** - Explains what might have gone wrong  
✅ **Actionable** - Tells users exactly what to do  
✅ **Mentions features** - References search box, buttons, keyboard shortcuts  
✅ **Friendlier tone** - Less technical, more helpful  
✅ **Recovery steps** - Suggests multiple solutions  
✅ **Clearer language** - "after" instead of "greater than", "before" instead of "less than"
