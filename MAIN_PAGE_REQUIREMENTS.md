# Main Page - Product Requirements Document

## Overview
The main page of the Music Looper application allows users to loop sections of YouTube videos for practice. Users can set custom start and end times, control playback speed, save loop configurations, and manage their video library.

---

## Core Loop Functionality

### Video Input
- **Input Field:** Text input for YouTube URL or Video ID
- **Auto-focus:** Input field is auto-focused on page load
- **Validation:** Validates video ID format (11 alphanumeric characters)
- **Loading State:** Shows loading indicator while video loads
- **Error Handling:** Displays user-friendly error messages for invalid videos or YouTube API errors
- **Clear Button:** Mobile-only clear button (×) appears when input has value
- **Placeholder:** "Enter URL or Video ID of song from YouTube"
- **Disabled State:** Input is disabled until YouTube IFrame API is ready

### YouTube Player
- **Integration:** Uses YouTube IFrame Player API
- **Initialization:** Player initializes once when API is ready
- **Loading Method:** Uses `cueVideoById` for all video loads (shows thumbnail without auto-play)
- **Player State:** Tracks playing, paused, buffering states
- **Default Video:** Loads user's default video on mount, or app default if none set
- **Video Duration:** Automatically fetches and stores video duration when available
- **Auto-Set End Time:** When new video loads, automatically sets end time to video duration (unless loading from saved loop)

### Loop Points (Start Time & End Time)
- **Start Time Input:**
  - Text input accepting MM:SS format (e.g., "0:46", "1:02")
  - Accepts plain numbers (treated as seconds)
  - Normalizes on blur (e.g., "0:75" → "1:15")
  - Disabled during playback
  - Default: 0:00 (0 seconds)
- **End Time Input:**
  - Same format and behavior as Start Time
  - Default: 0:10 (10 seconds)
  - Auto-set to video duration when new video loads
- **"Set from Video" Buttons:**
  - Button next to Start Time input: "Set from Video" (desktop) / "Set" (mobile)
  - Button next to End Time input: "Set from Video" (desktop) / "Set" (mobile)
  - Captures current video playback position when clicked
  - Works whether video is playing or paused
  - Disabled when player not ready or video loading
- **Time Validation:**
  - End time must be greater than start time
  - Start time must be less than video duration
  - End time cannot exceed video duration
  - Validation errors displayed inline below inputs
  - Loop Duration display (desktop only): Shows calculated loop duration (end time - start time)

### Target Loops
- **Input Field:** Text input for number of loops
- **Range:** 1 to 10,000 loops
- **Default:** 5 loops
- **Validation:** Only accepts whole numbers
- **Auto-correction:** Empty value defaults to 1 on change, shows 5 on blur
- **Clamping:** Values outside range are clamped to valid range
- **Disabled:** Disabled during playback

### Loop Playback
- **Start Loop Button:**
  - Green button labeled "Start Loop"
  - Disabled when: no player, already playing, API not ready, validation errors exist, or end time ≤ start time
  - Behavior: Resets loop count, seeks to start time, sets playback speed, starts playback
- **Auto-Seek:** When video reaches end time, automatically seeks back to start time
- **Loop Counter:** Increments after each completed loop
- **Auto-Stop:** Stops playing when target loop count is reached
- **Progress Tracking:** Tracks current time and displays loop progress percentage

### Stop/Resume Loop
- **Stop Loop Button:**
  - Red button labeled "Stop Loop" (when playing) or "Resume Loop" (when stopped)
  - Toggles between pause/resume based on actual player state
  - First click pauses, second click resumes from current position
  - Tracks stop state to show correct button label

### Reset Loop
- **Reset Loop Button:**
  - Blue button labeled "Reset Loop"
  - Resets times to defaults (0:00 start, 0:10 end)
  - Resets target loops to 5
  - Pauses video if playing
  - Seeks video to 0 seconds
  - Resets loop counter to 0

---

## Playback Controls

### Playback Speed
- **Preset Buttons:** 
  - Six preset buttons: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  - Active preset is highlighted
  - Clicking sets playback speed to that value
- **Speed Slider (Desktop Only):**
  - Range slider: 0.25x to 2.0x
  - Step: 0.05x increments
  - Label displays current speed (e.g., "1.25x")
  - Updates in real-time as slider moves
- **Default:** 1x (normal speed)
- **Persistence:** Playback speed is saved with saved loops

### Volume Control (Desktop Only)
- **Volume Slider:**
  - Range slider: 0% to 100%
  - Default: 75%
  - Updates video volume in real-time
  - Disabled on mobile (iOS Safari doesn't support programmatic volume control)
- **Label:** "Volume" with current percentage for screen readers

---

## Video Management

### Recent Videos
- **Auto-Save:** Automatically saves up to 100 recently viewed videos
- **Storage:** Each video stored with: videoId, title, author, thumbnail, timestamp
- **Display:** Dropdown button showing "Recent (count)"
- **Dropdown Content:**
  - Shows thumbnails, titles, authors for each video
  - Most recently viewed at top
  - Clicking video loads it instantly
  - Shows star (★) icon if video is the default video
- **Delete Functionality:**
  - Red × button next to each video
  - Confirmation dialog before deletion
  - Cannot delete default video (must remove as default first)
- **Click-Outside-to-Close:** Dropdown closes when clicking outside
- **Mobile:** Bottom sheet interface with backdrop overlay

### Saved Loops
- **Save Loop Button:**
  - Appears when player is ready and end time > start time
  - Desktop: "💾 Save Loop"
  - Mobile: "Save Loop" (no emoji)
  - Saves: video URL, start time, end time, target loops, playback speed, video info (title, author, thumbnail)
- **Saved Loops Dropdown:**
  - Button shows "⭐ Saved Loops (count)"
  - Displays thumbnails, titles, loop times, loop count
  - Clicking saved loop loads video and restores all settings
  - Red × button to delete with confirmation
  - Max 100 saved loops
- **Load Behavior:**
  - If same video: Seeks to start time immediately
  - If different video: Loads video first, then seeks to start time
  - Video does not auto-play after loading
  - User must click "Start Loop" to begin
- **Click-Outside-to-Close:** Dropdown closes when clicking outside
- **Mobile:** Bottom sheet interface with backdrop overlay

### Default Video
- **Set as Default:**
  - Star (★) button next to video URL input (desktop only)
  - Active state when current video is default (filled star)
  - Clicking sets current video as default
  - Default video loads on app start
- **Remove as Default:**
  - Click active star button to remove default
  - Resets to app default video
- **Protection:** Default video cannot be deleted from recent videos list

### YouTube Search (Desktop Only)
- **Search Input:** Text input for song name or artist
- **Search Button:** "Search on YouTube" button (red styling)
  - Disabled when input is empty
  - Opens YouTube search results in new tab
- **Enter Key:** Pressing Enter in search input triggers search
- **Hint Text:** "Search will open in a new tab. Copy the video URL and paste it below."
- **Hidden on Mobile:** Entire search section hidden on mobile devices

---

## User Experience / UI

### Layout & Design
- **Theme:** Punk rock-inspired design with bold typography and high contrast
- **Color Scheme:** Black background, white text, red accents, green for active states
- **Typography:** Oswald for headings/buttons, Roboto Condensed for body text
- **Responsive Design:** Adapts layout for mobile and desktop
- **Mobile Detection:** Multiple methods (viewport width, touch capability, user agent)

### Progress Indicators
- **Progress Bar:**
  - Shows during playback
  - Visual bar indicating progress through current loop
  - Displays start time, current time, end time below bar
  - Updates in real-time
- **Loop Counter Display:**
  - Shows "Loop X / Y" with percentage
  - Example: "Loop 3 / 5 (60%)"
  - Displays current time when playing
- **Loading States:**
  - Loading spinner when video is loading
  - "Loading video..." text indicator
  - Loading indicator below video URL input

### Help Modal
- **Trigger:** "help" link at bottom of page
- **Modal:** Overlay with help content
- **Content:** 
  - Step-by-step instructions
  - Keyboard shortcuts (desktop only)
  - Mobile-specific notes
  - YouTube disclaimer
- **Close:** Click overlay, × button, or Esc key
- **Keyboard Navigation:** Properly manages focus

### Error Messages
- **Display Location:** Below video URL input and/or end time input
- **Styling:** Red text, uppercase, bold
- **Types:**
  - YouTube video errors (invalid ID, private video, etc.)
  - Time validation errors
  - Generic error messages
- **Screen Reader:** Error messages announced via aria-live regions

### Keyboard Shortcuts (Desktop Only)
- **Spacebar:** Start/Stop looping
  - If playing: Pauses
  - If stopped: Resumes
  - If not started: Starts loop
- **R Key:** Reset loop to start
- **Esc Key:** Close help modal
- **Note:** Shortcuts disabled when typing in input fields

### Accessibility
- **Skip Link:** "Skip to main content" link at top for keyboard navigation
- **ARIA Labels:** All interactive elements have appropriate labels
- **Live Regions:** Status updates announced to screen readers
  - Loop progress updates
  - Error messages
  - Loading states
- **Focus Indicators:** Green outline on focus for keyboard navigation
- **Screen Reader Support:** Proper semantic HTML and ARIA attributes

### Mobile-Specific Features
- **Search Section:** Hidden on mobile
- **Volume Control:** Hidden on mobile
- **Speed Slider:** Hidden on mobile (preset buttons only)
- **Loop Duration Display:** Hidden on mobile
- **Set List Link:** Hidden on mobile
- **Keyboard Shortcuts:** Not available on mobile
- **Clear Input Button:** Mobile-only × button in video URL input
- **Bottom Sheets:** Recent Videos and Saved Loops use bottom sheet interface
- **Touch Targets:** Larger touch targets and spacing on mobile

---

## Technical Implementation

### State Management
- **React Hooks:** Uses useState, useEffect, useRef, useCallback, useMemo
- **Player Instance:** Managed via ref and state
- **Loading Flags:** Tracks loading states for saved loops and recent videos
- **State Reset:** Resets to initial values when returning from Set List page

### Data Storage (localStorage)
- **Recent Videos:** Key `'recentVideos'`, max 100 items
- **Saved Loops:** Key `'savedLoops'`, max 100 items
- **Default Video:** Key `'defaultVideo'`, single object
- **Validation:** All data validated before saving/loading
- **Security:** Input sanitization, length limits, format validation

### YouTube API Integration
- **IFrame Player API:** Loaded dynamically
- **oEmbed API:** Used for fetching video metadata (free, no API key)
- **Error Handling:** Maps YouTube error codes to user-friendly messages
- **Timeout:** 5-second timeout on API requests

### Time Management
- **Format:** MM:SS display, seconds internally
- **Conversion:** Helper functions for converting between formats
- **Normalization:** Auto-normalizes invalid seconds (e.g., 0:75 → 1:15)
- **Validation:** Validates against video duration
- **Security:** Maximum 24 hours (86,400 seconds) to prevent DoS attacks

### Loop Logic
- **Time Checking:** Adaptive interval checking (500ms when >5s away, 100ms when closer)
- **Seeking:** Uses `seekTo()` to loop back to start time
- **State Tracking:** Tracks loop completion to prevent duplicate increments
- **Playback Speed:** Maintained during loop transitions

### Mobile Detection
- **Methods:**
  - Viewport width ≤ 768px
  - Touch capability AND viewport ≤ 1024px
  - User agent string detection
- **Updates:** Re-checks on window resize
- **iPhone Detection:** Separate detection for iPhone (not iPad/MacBook) for keyboard behavior

### Input Handling
- **Delete Key Behavior:** iPad/MacBook: Delete key clears entire input (with modifiers or when cursor at start)
- **iPhone:** Standard delete behavior (single character)
- **Focus Management:** Maintains focus after clearing input

---

## Error Handling

### Video Loading Errors
- **Invalid Video ID:** "Invalid video ID. Please check the URL or Video ID."
- **Video Not Found:** "Video not found. It may have been removed or made private."
- **Embedding Restricted:** "Video is not available for embedding. It may be private or restricted."
- **Generic Error:** "Failed to load video. Please check the URL or Video ID and try again."
- **Player Initialization Error:** "Error initializing video player. Please refresh the page and try again."

### Validation Errors
- **Time Validation:**
  - "End time must be greater than start time"
  - "Start time must be less than video duration (X:XX)"
  - "End time cannot exceed video duration (X:XX)"
- **Save Loop Validation:**
  - "Invalid video. Please load a valid YouTube video first."
  - "End time must be greater than start time."
  - "Failed to save loop. Please try again."
- **Default Video Validation:**
  - "Please load a valid video first"
  - "Cannot delete the default video. Remove it as default first."

### Storage Errors
- **Silent Failures:** Storage errors logged to console but don't break app
- **Fallbacks:** Returns empty arrays or null on storage failures
- **Data Validation:** Invalid data filtered out automatically

---

## Acceptance Criteria

### Core Functionality
- [ ] Video URL/ID input accepts valid YouTube URLs and video IDs
- [ ] Invalid video IDs show error messages
- [ ] Loading indicator appears while video loads
- [ ] Player initializes and displays video thumbnail
- [ ] Start time can be entered manually in MM:SS format
- [ ] End time can be entered manually in MM:SS format
- [ ] "Set from Video" buttons capture current video position
- [ ] Time inputs normalize invalid seconds on blur (e.g., 0:75 → 1:15)
- [ ] End time auto-sets to video duration when new video loads
- [ ] Time validation errors display when invalid
- [ ] Target loops input accepts numbers 1-10,000
- [ ] "Start Loop" button begins playback from start time
- [ ] Video automatically loops back to start time at end time
- [ ] Loop counter increments after each loop
- [ ] Playback stops when target loop count reached
- [ ] "Stop Loop" button pauses/resumes playback
- [ ] "Reset Loop" button resets times and loop counter
- [ ] Progress bar shows during playback
- [ ] Loop counter displays current/target with percentage

### Playback Controls
- [ ] Playback speed preset buttons work (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- [ ] Active preset is highlighted
- [ ] Speed slider works (desktop only, 0.25x-2.0x)
- [ ] Playback speed is maintained during loops
- [ ] Volume slider works (desktop only, 0-100%)
- [ ] Volume control is hidden on mobile

### Video Management
- [ ] Videos automatically saved to Recent Videos (max 100)
- [ ] Recent Videos dropdown shows thumbnails and titles
- [ ] Clicking recent video loads it instantly
- [ ] Recent videos can be deleted (except default)
- [ ] Default video can be set/removed via star button
- [ ] Default video loads on app start
- [ ] Saved Loops can be created from current settings
- [ ] Saved Loops dropdown shows all saved configurations
- [ ] Clicking saved loop loads video and restores all settings
- [ ] Saved loops can be deleted with confirmation
- [ ] Max 100 saved loops

### YouTube Search (Desktop Only)
- [ ] Search input accepts text
- [ ] "Search on YouTube" button opens results in new tab
- [ ] Enter key triggers search
- [ ] Search section hidden on mobile

### User Experience
- [ ] Help modal opens/closes correctly
- [ ] Keyboard shortcuts work (Spacebar, R, Esc)
- [ ] Progress bar updates in real-time
- [ ] Error messages display correctly
- [ ] Loading states show appropriately
- [ ] Mobile layout adapts correctly
- [ ] Touch targets are large enough on mobile
- [ ] Bottom sheets work on mobile
- [ ] All dropdowns close on outside click

### Accessibility
- [ ] Skip link works for keyboard navigation
- [ ] All interactive elements have ARIA labels
- [ ] Live regions announce status updates
- [ ] Focus indicators visible for keyboard navigation
- [ ] Screen reader announces loop progress
- [ ] Error messages announced to screen readers

### Error Handling
- [ ] Invalid video IDs show appropriate error
- [ ] Private/restricted videos show appropriate error
- [ ] Time validation errors show correctly
- [ ] Storage errors don't break the app
- [ ] Invalid data is filtered out automatically

### Mobile-Specific
- [ ] Search section hidden on mobile
- [ ] Volume control hidden on mobile
- [ ] Speed slider hidden on mobile
- [ ] Loop duration display hidden on mobile
- [ ] Set List link hidden on mobile
- [ ] Clear input button shows on mobile
- [ ] Bottom sheets work on mobile
- [ ] Touch targets are appropriately sized

---

## Technical Constraints

### Browser Support
- **Desktop:** Chrome, Firefox, Safari, Edge (modern versions)
- **Mobile:** iOS Safari, Chrome Mobile
- **Requirements:** JavaScript enabled, localStorage support

### API Limitations
- **YouTube IFrame Player API:** Must be loaded for video playback
- **YouTube oEmbed API:** Free, no API key required, 5-second timeout
- **Rate Limiting:** No explicit rate limits, but requests should be throttled

### Storage Limits
- **localStorage:** Browser-dependent (typically 5-10MB)
- **Recent Videos:** Max 100 items
- **Saved Loops:** Max 100 items
- **Data Size:** Each item ~1-2KB (thumbnail URLs are largest)

### Performance
- **Time Checking:** Adaptive intervals to minimize CPU usage
- **Memory:** Player instance properly cleaned up
- **Re-renders:** Memoized calculations to prevent unnecessary re-renders

---

## Security Considerations

### Input Validation
- **Video IDs:** Strict validation (11 alphanumeric characters only)
- **Time Values:** Validated against maximum (24 hours) to prevent DoS
- **Storage Data:** All data sanitized before saving
- **API Responses:** Validated and sanitized before use

### Data Sanitization
- **Title:** Max 200 characters
- **Author:** Max 100 characters
- **Thumbnail URLs:** Must be HTTPS, max 500 characters
- **URLs:** Max 500 characters, trimmed

### XSS Prevention
- **API Responses:** Validated content-type before parsing
- **User Input:** Never directly inserted into DOM without sanitization
- **Thumbnails:** Only HTTPS URLs accepted

---

## Future Enhancements (Out of Scope)

These features are documented but not part of current requirements:
- Voice search functionality
- Chord detection
- Spotify integration
- Additional playback features

---

## Revision History

- **Initial Version:** Based on existing implementation and README.md
- **Date:** Created to document current main page functionality
