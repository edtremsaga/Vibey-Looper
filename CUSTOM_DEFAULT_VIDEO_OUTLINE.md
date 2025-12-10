# Custom Default Video Feature - Implementation Outline

## Overview
Allow users to set their own default video that loads when the app opens, instead of the hardcoded default.

---

## Implementation Approach

### **Option 1: Simple localStorage Approach (Recommended)**
Store user's default video in localStorage and load it on app initialization.

### **Option 2: Settings/Preferences UI**
Add a dedicated settings section where users can manage their default video.

---

## Detailed Implementation Plan

### **Phase 1: Core Functionality**

#### **1. Helper Functions for Default Video Storage**

```javascript
// Save user's default video to localStorage
const saveDefaultVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    const defaultVideo = {
      videoId: extractVideoId(videoId),
      url: videoId, // Store full URL for easy loading
      title,
      author,
      thumbnail,
      timestamp: Date.now()
    }
    localStorage.setItem('defaultVideo', JSON.stringify(defaultVideo))
    return defaultVideo
  } catch (error) {
    console.warn('Failed to save default video:', error)
    return null
  }
}

// Load user's default video from localStorage
const loadDefaultVideo = () => {
  try {
    const stored = localStorage.getItem('defaultVideo')
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  } catch (error) {
    console.warn('Failed to load default video:', error)
    return null
  }
}

// Clear user's default video (reset to app default)
const clearDefaultVideo = () => {
  try {
    localStorage.removeItem('defaultVideo')
  } catch (error) {
    console.warn('Failed to clear default video:', error)
  }
}
```

#### **2. Initialize App with User's Default or Fallback**

```javascript
// App default (fallback)
const APP_DEFAULT_VIDEO = 'https://www.youtube.com/watch?v=u7p8bkf5hBY&list=RDu7p8bkf5hBY&start_radio=1'

function App() {
  // Load user's default video on mount, or use app default
  const [videoId, setVideoId] = useState(() => {
    const userDefault = loadDefaultVideo()
    return userDefault ? userDefault.url : APP_DEFAULT_VIDEO
  })
  
  // ... rest of component
}
```

#### **3. Function to Set Current Video as Default**

```javascript
const handleSetAsDefault = useCallback(async () => {
  const extractedId = extractVideoId(videoId)
  if (!extractedId || extractedId.length !== 11) {
    setValidationError('Please load a valid video first')
    return
  }
  
  // Fetch video info if we don't have it
  let videoInfo = { title: videoTitle, author: videoAuthor, thumbnail: videoThumbnail }
  
  if (!videoInfo.title || videoInfo.title.startsWith('Video ')) {
    const fetched = await fetchVideoTitle(extractedId)
    if (fetched) {
      videoInfo = fetched
    }
  }
  
  // Save as default
  saveDefaultVideo(
    videoId,
    videoInfo.title || `Video ${extractedId}`,
    videoInfo.author || '',
    videoInfo.thumbnail || ''
  )
  
  // Show confirmation (optional)
  // Could use a toast notification or temporary message
}, [videoId, videoTitle, videoAuthor, videoThumbnail])
```

---

### **Phase 2: User Interface**

#### **Option A: Simple Button Approach**

Add a button near the video input:

```jsx
<div className="input-group">
  <label htmlFor="video-id">URL or Video ID of song from YouTube</label>
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <input
      id="video-id"
      type="text"
      value={videoId}
      onChange={(e) => handleVideoIdChange(e.target.value)}
      // ... rest of input props
    />
    <button
      type="button"
      className="btn btn-set-default"
      onClick={handleSetAsDefault}
      title="Set as default video"
    >
      ⭐ Set as Default
    </button>
  </div>
</div>
```

#### **Option B: Context Menu / Dropdown**

Add a menu button with options:

```jsx
<div className="video-actions-menu">
  <button className="video-menu-toggle">⋮</button>
  <div className="video-menu-dropdown">
    <button onClick={handleSetAsDefault}>
      ⭐ Set as Default Video
    </button>
    <button onClick={handleClearDefault}>
      Reset to App Default
    </button>
  </div>
</div>
```

#### **Option C: Settings Section**

Add a dedicated settings area (could be in help modal or separate):

```jsx
<div className="settings-section">
  <h3>Default Video</h3>
  {userDefaultVideo ? (
    <div>
      <p>Current default: {userDefaultVideo.title}</p>
      <button onClick={handleClearDefault}>Reset to App Default</button>
    </div>
  ) : (
    <p>Using app default video</p>
  )}
  <button onClick={handleSetAsDefault}>
    Set Current Video as Default
  </button>
</div>
```

---

### **Phase 3: Visual Indicators**

#### **1. Show Current Default Status**

```jsx
{isDefaultVideo && (
  <div className="default-video-indicator">
    ⭐ This is your default video
  </div>
)}
```

#### **2. Highlight Default in Recent Videos**

```jsx
{recentVideos.map((video, index) => {
  const isDefault = userDefaultVideo?.videoId === video.videoId
  return (
    <button
      key={index}
      className={`recent-video-item ${isDefault ? 'is-default' : ''}`}
      onClick={() => handleRecentVideoSelect(video)}
    >
      {isDefault && <span className="default-badge">⭐ Default</span>}
      {/* ... rest of video item */}
    </button>
  )
})}
```

---

### **Phase 4: Enhanced Features (Optional)**

#### **1. Set Default from Recent Videos**

Add a "Set as Default" option in recent videos dropdown:

```jsx
<button
  className="recent-video-item"
  onClick={() => handleRecentVideoSelect(video)}
>
  {/* ... video content */}
  <button
    className="set-default-btn"
    onClick={(e) => {
      e.stopPropagation()
      handleSetDefaultFromRecent(video)
    }}
  >
    ⭐ Set as Default
  </button>
</button>
```

#### **2. Confirmation Dialog**

Ask user to confirm before setting/changing default:

```jsx
const [showDefaultConfirm, setShowDefaultConfirm] = useState(false)

const handleSetAsDefault = () => {
  setShowDefaultConfirm(true)
}

const confirmSetDefault = () => {
  // Actually set the default
  saveDefaultVideo(...)
  setShowDefaultConfirm(false)
}
```

#### **3. Default Video Presets**

Allow users to save multiple "favorite" videos and choose one as default:

```javascript
const saveFavoriteVideo = (video) => {
  // Save to favorites array
}

const setFavoriteAsDefault = (favorite) => {
  // Set a favorite as the default
}
```

---

## Implementation Steps

### **Step 1: Add Helper Functions**
- Add `saveDefaultVideo()`, `loadDefaultVideo()`, `clearDefaultVideo()`
- Place in same area as other localStorage helpers

### **Step 2: Update Initial State**
- Change `useState` for `videoId` to use lazy initialization
- Load user's default on mount, fallback to app default

### **Step 3: Add Set Default Function**
- Create `handleSetAsDefault()` function
- Fetch video info if needed
- Save to localStorage

### **Step 4: Add UI Button**
- Add "Set as Default" button near video input
- Style to match your design aesthetic

### **Step 5: Add Visual Indicators**
- Show indicator when current video is the default
- Highlight default in recent videos list

### **Step 6: Add Clear/Reset Option**
- Add button to reset to app default
- Could be in settings or as a small "X" button

---

## Data Structure

### **localStorage Key: `defaultVideo`**

```json
{
  "videoId": "u7p8bkf5hBY",
  "url": "https://www.youtube.com/watch?v=u7p8bkf5hBY",
  "title": "Song Title",
  "author": "Artist Name",
  "thumbnail": "https://i.ytimg.com/vi/u7p8bkf5hBY/maxresdefault.jpg",
  "timestamp": 1234567890
}
```

---

## User Experience Flow

1. **User loads a video** they like
2. **User clicks "Set as Default"** button
3. **Video info is saved** to localStorage
4. **User closes browser/app**
5. **User reopens app**
6. **App loads user's default video** automatically
7. **User sees their default video** in the input field and player

---

## Edge Cases to Handle

### **1. Invalid/Removed Video**
- If user's default video becomes unavailable, fallback to app default
- Show error message and offer to set new default

### **2. First-Time Users**
- No default set → use app default
- Show hint: "Set this as your default video?"

### **3. Clearing Default**
- Provide "Reset to App Default" option
- Clear localStorage entry

### **4. Multiple Devices**
- localStorage is device/browser specific
- Each device has its own default (this is expected behavior)

---

## UI/UX Considerations

### **Visual Design**
- Use star icon (⭐) to indicate default
- Match your punk rock aesthetic (red accents, bold borders)
- Keep it simple and unobtrusive

### **Placement Options**
1. **Next to video input** - Most accessible
2. **In recent videos dropdown** - Contextual
3. **In settings/help modal** - Less prominent
4. **Floating action button** - Mobile-friendly

### **Feedback**
- Show brief confirmation when default is set
- Visual indicator when viewing default video
- Clear way to change/remove default

---

## Code Structure

```
src/App.jsx
├── Helper Functions
│   ├── saveDefaultVideo()
│   ├── loadDefaultVideo()
│   └── clearDefaultVideo()
├── State
│   └── const [videoId, setVideoId] = useState(() => loadDefaultVideo() || APP_DEFAULT)
├── Handlers
│   ├── handleSetAsDefault()
│   └── handleClearDefault()
└── UI Components
    ├── Set Default Button
    ├── Default Indicator
    └── Clear Default Option
```

---

## Testing Checklist

- [ ] User can set current video as default
- [ ] Default video loads on app restart
- [ ] Default persists across browser sessions
- [ ] Fallback to app default if user default is invalid
- [ ] Can clear/reset default
- [ ] Visual indicators work correctly
- [ ] Works with recent videos feature
- [ ] Mobile responsive

---

## Recommended Implementation Order

1. **Start Simple**: Just the core functionality (save/load default)
2. **Add Basic UI**: Simple "Set as Default" button
3. **Add Indicators**: Show when video is default
4. **Enhance UX**: Add clear/reset option, confirmations
5. **Polish**: Visual refinements, better feedback

---

## Estimated Implementation Time

- **Core functionality**: 1-2 hours
- **Basic UI**: 1 hour
- **Visual indicators**: 1 hour
- **Polish & testing**: 1 hour
- **Total**: ~4-5 hours

---

## Alternative: URL Parameters

Instead of localStorage, could use URL parameters:
- `?default=VIDEO_ID` - Set default via URL
- Less persistent but shareable
- Could combine both approaches

---

## Conclusion

The localStorage approach is the best solution because:
- ✅ Persistent across sessions
- ✅ No backend required
- ✅ Simple implementation
- ✅ Works offline
- ✅ Fast (no API calls needed)

The feature enhances user experience by:
- Personalizing the app
- Saving time (no need to paste URL every time)
- Making the app feel more "theirs"

---

*Ready to implement when you are!*

