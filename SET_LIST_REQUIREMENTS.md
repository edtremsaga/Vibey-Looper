# Set List Feature - Requirements Document

## Overview
A new "Set List" page that allows users to create and play a sequence of songs from their saved loops.

---

## Basic Structure

### Main Page Integration
- **Control Location:** "Set List" button/link positioned below the loop counter ("Loop 0/5" box) and above the help link on main page
- **Visibility:** Desktop only (not visible on mobile)
- **Styling:** Should match the existing "help" link styling
- **Navigation:** "Back" button at the top of Set List page to return to main page
- **Spacing:** Reduce vertical padding between "set list" link and "help" area by 25%

---

## Layout - Two Columns

### Left Panel: "Saved Set List Items"
- **Purpose:** Display all available saved loops that can be added to set list
- **Population:** Populated by existing saved loops data
- **Behavior:** Songs are **copied** (not moved) when dragged to the right panel
- **Drag:** Full item is draggable to the right column
- **Visual:** Thumbnail, title, and author displayed for each item

### Right Panel: "Set List"
- **Purpose:** User's curated set list for playback
- **Drag Behavior:** 
  - Users can drag songs from left to right to add to set list
  - Users can reorder songs within this column by dragging
- **Remove Functionality:** Each song has an "X" button to remove it from set list
- **Duplicate Prevention:** Prevent duplicate songs in the set list (check by `videoId`)
- **Numbered Badges:** Each item displays a numbered badge (1, 2, 3...) indicating position
  - Badges auto-update when items are reordered
  - **Timing:** Slight delay in badge update is acceptable
- **Empty State:** When empty, display text: "Drag songs here to create your set list. Then click the play set list button"
- **Visual:** Thumbnail, title, and author displayed for each item

---

## YouTube Player

### Player Container
- **Location:** Set List page has its own YouTube player
- **Styling:** Matches main page player (size, styling)
- **Border:** White border around YouTube iframe player area
- **Initialization:** Player should initialize only when the first song is played
- **Before Play:** Player container should be empty (no placeholder, no thumbnail)

---

## Playback Functionality

### Play Button
- **Location:** "Play Set List" button positioned **above** the two columns
- **Size:** Smaller vertically than main app buttons
- **Behavior:**
  - When clicked and set list is not empty: Starts playback
  - Shows "Stop Set List" text when playing
  - User can stop/pause playback during set list

### Playback Sequence
- **Play Order:** Songs play in order (from top to bottom of set list)
- **Song Playback:** Each song plays the **full video once** (NOT saved loop settings)
- **Transitions:** 5-second pause between songs
- **Countdown:** Display countdown ("5", "4", "3"...) below the player during pause
- **Completion:** After the last song, display "Set list complete" message below the player

### Visual Feedback During Playback
- **Highlight:** The currently playing song in the right column should be highlighted (green, matching app colors)
- **Back Button:** The "Back" button should be visually disabled (grayed out) during playback

---

## Error Handling

### Empty Set List Error
- **Trigger:** When "Play Set list" is clicked with an empty set list
- **Display:** Inline error message below the button/player
- **Message:** Should clearly indicate that the set list is empty

### Duplicate Song Error
- **Trigger:** When user tries to drag a duplicate song into the set list
- **Display:** Show error message
- **Behavior:** Prevent the duplicate from being added

---

## Persistence

### LocalStorage
- **Storage Location:** Set list should persist in `localStorage`
- **Functions:** Add `saveSetList` and `loadSetList` functions to `src/utils/storage.js`
- **Validation:** Follow the same validation pattern as existing saved loops functions
- **Survival:** Set list should survive page refresh

---

## UI/UX Requirements

### Text Handling
- **Truncation:** Truncate song text in both lists to fit within borders
- **Tooltips:** On hover, display the full text as a tooltip (using `title` attribute)

### Scrolling
- **Vertical Scrollbars:** Should appear if there are many items in either list
- **Container:** Lists should be contained within scrollable containers

### Visual Feedback
- **Drag-and-Drop:** Visual feedback during drag (opacity, shadow, highlight drop zone)
- **Colors:** Match existing app colors (red accents, green for active/highlighted)
- **Layout:** Layout should fit within the app's red border constraints

---

## Technical Implementation

### State Management
- **Routing:** Use state toggle in `App.jsx` (no React Router)
  - Boolean state variable: `showSetListPage`
  - Conditionally render SetList component or main app content
- **Player Management:** Create/destroy player instance when switching pages

### Drag-and-Drop Library
- **Library:** Use `@hello-pangea/dnd` for drag-and-drop functionality
- **Approach:** Standard React patterns (no `flushSync`, no remounting, no complex timing workarounds)
- **Implementation:** Clean, straightforward React code with normal state updates

### Code Structure
- **New File:** Create `src/SetList.jsx` component
- **Storage:** Extend `src/utils/storage.js` with set list functions
- **Styling:** Add styles to `src/App.css`
- **Branch:** Use Git branch for development

---

## Acceptance Criteria

- [ ] "Set List" link appears on main page (desktop only)
- [ ] Clicking link opens Set List page
- [ ] "Back" button returns to main page
- [ ] Left column shows all saved loops
- [ ] Right column starts empty with placeholder text
- [ ] Drag from left to right adds song to set list
- [ ] Dragged songs remain in left column (copy, not move)
- [ ] Songs in set list have numbered badges (1, 2, 3...)
- [ ] Badges update when items are reordered (delay acceptable)
- [ ] Each set list item has "X" button to remove
- [ ] Duplicate songs cannot be added (error shown)
- [ ] Reorder works within set list column
- [ ] Player container is empty until first play
- [ ] "Play Set List" button is above columns and smaller
- [ ] Playback works: full video, 5-second pause, countdown
- [ ] Currently playing song is highlighted
- [ ] "Set list complete" message shows after last song
- [ ] Back button is grayed out during playback
- [ ] Empty set list shows error when trying to play
- [ ] Set list persists in localStorage
- [ ] Text truncates with tooltips on hover
- [ ] Scrollbars appear when lists are long
- [ ] Visual feedback during drag-and-drop
- [ ] Layout fits within red border constraints
