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

---

## Save Set List Feature - Requirements

### Overview
Users can save their current set list with a custom name and later load saved set lists to populate the set list box.

---

## Step 1: Save Set List Button

### Button Location
- **Position:** Next to "Play Set List" button
- **Layout:** All three buttons (Play Set List, Save Set List, Saved Set Lists) in the same row
- **Styling:** Match "Play Set List" button styling
- **State:** Disabled when set list is empty (same as "Play Set List")

---

## Step 2: Save Set List Modal/Dialog

### Modal Appearance
- **Type:** Modal/dialog (not browser prompt, not inline input)
- **Styling:** Match existing help modal styling (black background, red accents)
- **Components:**
  - Text input field for set list name
  - Cancel button
  - Save button

### Input Validation
- **Required:** Set list name cannot be empty
- **Whitespace:** Cannot be empty or whitespace-only
- **Max Length:** 50 characters
- **Duplicate Check:** Cannot save with a name that already exists (show error)

### Error Display
- **Duplicate Name Error:** Display inside the modal, below the input field
- **Empty Name Error:** Display inside the modal, below the input field
- **Empty Set List Error:** Show error if trying to save an empty set list

---

## Step 3: Save Functionality

### Data Structure
- **Storage Location:** localStorage (same as saved loops)
- **Storage Key:** `'savedSetLists'` (following `'savedLoops'` pattern)
- **Data Structure:**
  ```javascript
  {
    id: string,           // Unique identifier (timestamp-based or UUID)
    name: string,         // Set list name entered by user
    songs: Array,         // Array of song objects matching current setList structure
                          // { id, videoId, title, author, thumbnail, url }
    createdAt: timestamp  // Timestamp for sorting/filtering
  }
  ```

### Storage Functions
- **Location:** Add to `src/utils/storage.js`
- **Functions:**
  - `saveSavedSetList(setList)` - Save a new set list or update existing
  - `loadSavedSetLists()` - Load all saved set lists
  - `deleteSavedSetList(id)` - Delete a saved set list by ID
- **Pattern:** Follow the same validation pattern as existing saved loops functions

### Save Behavior
- **Save New:** If name doesn't exist, create new saved set list
- **Overwrite:** If saving with same name as currently loaded set list, overwrite that saved set list
- **Duplicate Error:** If name exists and it's NOT the currently loaded set list, show error asking for different name
- **Empty Set List:** Cannot save empty set list, show error

### After Saving
- **Modal:** Close modal automatically
- **Success Message:** Display below the buttons (where error messages currently appear)
- **Message Text:** "Set list 'Name' saved successfully"
- **Current Set List:** Keep the current set list visible (don't clear it)

---

## Step 5: Saved Set Lists Button

### Button Location
- **Position:** Next to "Save Set List" button
- **Text:** "Saved Set Lists"
- **Styling:** Match "Save Set List" and "Play Set List" buttons
- **State:** Always enabled (even if no saved set lists exist)

---

## Step 6: Saved Set Lists Dropdown

### Dropdown Appearance
- **Type:** Dropdown similar to "Saved Loops" dropdown
- **Styling:** Match existing "Saved Loops" dropdown styling
- **Position:** Below "Saved Set Lists" button

### Dropdown Content
- **Display Format:** Show saved set lists with:
  - Set list name
  - Number of songs (e.g., "My Set List (5 songs)")
- **Empty State:** When no saved set lists exist, show "No saved set lists" message
- **Delete Button:** Red X button next to each saved set list item to enable deletion

### Interaction
- **Click Set List:** 
  - Load the saved set list's songs into the set list box (right column)
  - Replace the current set list (don't append/merge)
  - Close dropdown automatically after selection
  - User can then click "Play Set List" to play those songs

### Delete Functionality
- **Delete Button:** Red X next to each saved set list in dropdown
- **Confirmation:** Show confirmation dialog before deleting
- **Behavior:** If deleted set list is currently loaded, keep the current set list (just remove from saved lists)
- **State:** After deletion, current set list remains loaded (if it was the deleted one)

---

## Tracking Loaded Set List

### Loaded Set List ID
- **Purpose:** Track which saved set list is currently loaded
- **Behavior:**
  - When user loads a saved set list, store its ID
  - Keep tracking the same ID even if user manually modifies the set list (adds/removes songs)
  - This allows overwriting the correct saved set list when saving with the same name
- **Clear ID:** Clear tracked ID when:
  - User loads a different saved set list
  - User starts with an empty set list (not loaded from saved)

---

## Playback Restrictions

### Loading During Playback
- **Restriction:** User cannot load a different set list while playback is active
- **Implementation:** Disable "Saved Set Lists" dropdown/button during playback
- **Visual:** Button should be visually disabled (grayed out) during playback

---

## Mobile Behavior

### Visibility
- **Feature Availability:** Set list feature (including save/load) is **desktop only**
- **Set List Link:** Hidden on mobile (already implemented)
- **Access Prevention:** No additional checks needed if URL is accessed directly on mobile

---

## Technical Implementation Notes

### Storage Pattern
- Follow existing `src/utils/storage.js` pattern for saved loops
- Use same validation approach
- Use same error handling pattern

### Modal Implementation
- Use similar structure to help modal
- Match styling (black background, red accents)
- Ensure accessibility (keyboard navigation, focus management)

### Dropdown Implementation
- Use similar structure to "Saved Loops" dropdown
- Match styling and behavior
- Ensure click-outside-to-close functionality

### State Management
- Add state for:
  - Modal open/close
  - Input value
  - Error messages (modal errors vs. general errors)
  - Success messages
  - Dropdown open/close
  - Currently loaded set list ID
  - Saved set lists list

---

## Acceptance Criteria - Save Set List Feature

- [ ] "Save Set List" button appears next to "Play Set List" button
- [ ] Button is disabled when set list is empty
- [ ] Clicking button opens modal with name input
- [ ] Modal has Cancel and Save buttons
- [ ] Modal styling matches help modal
- [ ] Input validation: name cannot be empty
- [ ] Input validation: name cannot be whitespace-only
- [ ] Input validation: name max length 50 characters
- [ ] Duplicate name error shows inside modal below input
- [ ] Empty set list error shows when trying to save empty set list
- [ ] Saving creates entry in localStorage with correct structure
- [ ] Saved set lists stored under key 'savedSetLists'
- [ ] Success message appears below buttons after saving
- [ ] Modal closes after successful save
- [ ] Current set list remains visible after saving
- [ ] "Saved Set Lists" button appears next to "Save Set List" button
- [ ] Button is always enabled
- [ ] Clicking button shows dropdown with saved set lists
- [ ] Each dropdown item shows name and song count
- [ ] Empty state shows "No saved set lists" message
- [ ] Red X button appears next to each saved set list
- [ ] Clicking X shows confirmation dialog
- [ ] Confirmation deletes the saved set list
- [ ] Clicking a saved set list loads it into set list box
- [ ] Loading replaces current set list (doesn't append)
- [ ] Dropdown closes automatically after selection
- [ ] Loaded set list ID is tracked
- [ ] Modifying loaded set list keeps same ID tracked
- [ ] Saving with same name as loaded set list overwrites it
- [ ] Saved Set Lists button is disabled during playback
- [ ] All three buttons display in same row
- [ ] Feature is desktop only (not visible on mobile)
