# POC Code Inventory

## All Code Files on Branch: `feature/chord-detection-poc`

### Source Files

#### `src/chordDetection.js`
- **Purpose**: Core chord detection algorithm (bass-focused)
- **Status**: Complete (ready for backend integration)
- **Key Functions**:
  - `frequencyToNote()` - Converts frequency to note name
  - `detectBassRootNote()` - Detects root note from bass frequencies
  - `inferChordQuality()` - Determines major/minor from context
  - `detectChord()` - Main detection function
  - `initializeAudioAnalysis()` - Web Audio API setup (for future use)
  - `getCurrentChord()` - Gets chord from analyser

#### `src/ChordDisplay.jsx`
- **Purpose**: React component for displaying detected chords
- **Status**: Complete (UI ready, needs data source)
- **Features**:
  - Chord progression display
  - Current/Previous/Next chord display
  - Timeline visualization
  - Error handling
  - Loading states
  - API integration structure (currently shows limitation message)

#### `src/chordDetection.css`
- **Purpose**: Styling for chord display
- **Status**: Complete
- **Features**:
  - Matches app's punk rock aesthetic
  - Responsive design (mobile/desktop)
  - Large current chord display
  - Timeline styling

#### `src/App.jsx` (Modified)
- **Changes**:
  - Added `chordDetectionEnabled` state
  - Added `ChordDisplay` component import
  - Added toggle button for chord detection
  - Passes `videoId` and `currentTime` to `ChordDisplay`

### Documentation Files

1. `CHORD_DETECTION_RESEARCH.md` - Initial research findings
2. `FEASIBILITY_ANALYSIS.md` - Detailed feasibility study
3. `FREE_API_OPTIONS.md` - Alternative API research
4. `BRANCH_VS_FEATURE_FLAG_ANALYSIS.md` - Implementation strategy analysis
5. `CHORD_DISPLAY_DESIGN.md` - UI design documentation
6. `CHORD_DETECTION_POC_NOTES.md` - Implementation notes
7. `TESTING_GUIDE.md` - Testing instructions
8. `API_TROUBLESHOOTING.md` - API issue documentation
9. `CHORDMINI_API_FINDINGS.md` - ChordMini API discovery
10. `POC_SUMMARY.md` - Complete session summary
11. `POC_CODE_INVENTORY.md` - This file

### Mockup Files

- `chord-display-mockup.html` - Interactive visual mockup

---

## Code Status

### ✅ Complete
- UI component structure
- Styling
- Error handling
- Loading states
- Synchronization logic
- Integration with existing app

### ⚠️ Needs Data Source
- API integration (requires backend or different API)
- Actual chord detection (needs audio source)

### 📝 Ready for Production
- Code structure is production-ready
- Just needs data source (backend or API)

---

## How to Use This Code

### To Test UI (Without Real Data)
1. Modify `ChordDisplay.jsx` to use mock data
2. Test chord display and synchronization
3. Verify UI/UX

### To Integrate Real API
1. Choose: Klang.io API or Backend service
2. Update `ChordDisplay.jsx` API call
3. Test with real YouTube videos

### To Build Backend
1. Use `chordDetection.js` algorithm
2. Implement audio extraction (yt-dlp)
3. Call detection functions
4. Return JSON to frontend

---

## Key Code Patterns

### Chord Synchronization
```javascript
// In ChordDisplay.jsx
useEffect(() => {
  if (!chordProgression || !currentTime) return
  
  const currentChordData = chordProgression.find((chord, index) => {
    const chordStartTime = chord.time || 0
    const nextChord = chordProgression[index + 1]
    const chordEndTime = nextChord ? (nextChord.time || chordStartTime) : Infinity
    return currentTime >= chordStartTime && currentTime < chordEndTime
  })
  
  if (currentChordData) {
    setCurrentChord({...})
  }
}, [chordProgression, currentTime])
```

### Error Handling
```javascript
try {
  // API call
} catch (fetchError) {
  // Network/CORS errors
  setError('Clear error message')
} finally {
  setIsAnalyzing(false)
}
```

---

## Branch Information

**Branch**: `feature/chord-detection-poc`
**Base**: `main`
**Status**: All changes isolated, main branch untouched

**To view**:
```bash
git checkout feature/chord-detection-poc
```

**To merge** (if approved):
```bash
git checkout main
git merge feature/chord-detection-poc
```

**To abandon**:
```bash
git checkout main
git branch -D feature/chord-detection-poc
```

---

*All code is preserved on the branch and in this documentation.*


