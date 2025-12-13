# Visual Time Markers - Design Mockup

## Current State (Text Inputs Only)

```
┌─────────────────────────────────────────────────┐
│  [YouTube Video Player - 640x390px]             │
└─────────────────────────────────────────────────┘

Start Time: [0:00]  End Time: [0:10]  Target Loops: [5]
```

**Problem:** User has to guess or type MM:SS values without visual reference.

---

## Proposed Design (With Visual Timeline)

```
┌─────────────────────────────────────────────────┐
│  [YouTube Video Player - 640x390px]             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Visual Timeline Scrubber                        │
│                                                  │
│  [0:00]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[3:45]│
│         │                    │                  │
│      START                 END                  │
│      (0:00)               (0:10)               │
│                                                  │
│  Current: ▸ (playing at 0:05)                    │
└─────────────────────────────────────────────────┘

Start Time: [0:00]  End Time: [0:10]  Target Loops: [5]
```

---

## Detailed Visual Design

### Timeline Bar
- **Full width** horizontal bar showing entire video duration
- **Background:** Dark gray (#333) or black
- **Active area:** Light gray or white showing video duration
- **Height:** ~40-50px for easy clicking/dragging

### Start/End Markers
- **Start marker:** Green vertical line with label "START" above
- **End marker:** Red vertical line with label "END" above
- **Draggable:** Click and drag to adjust times
- **Snap to seconds:** Optional snap-to-second precision
- **Visual feedback:** Highlight on hover, show time tooltip

### Current Playback Position
- **Playhead:** White/blue vertical line with arrow (▸)
- **Updates in real-time** as video plays
- **Shows current time** below the playhead

### Time Labels
- **Start/End times:** Displayed below markers (e.g., "0:00", "0:10")
- **Total duration:** Shown at both ends (e.g., "0:00" and "3:45")
- **Current time:** Shown below playhead when playing

### Interactive Features
- **Click timeline:** Seek to that position
- **Drag start marker:** Adjust start time
- **Drag end marker:** Adjust end time
- **Hover:** Show time tooltip
- **Keyboard:** Arrow keys to fine-tune (±1 second)

---

## Visual Example (ASCII Art)

```
┌─────────────────────────────────────────────────────────────┐
│                    YouTube Video Player                      │
│                  (640x390px, white border)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Timeline:                                                    │
│                                                               │
│  0:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3:45  │
│        │                              │                       │
│     START                          END                        │
│     0:00                          0:10                       │
│        │                              │                       │
│        └─────────── LOOP ────────────┘                       │
│                                                               │
│  Current: ▸ 0:05 (playing)                                    │
└─────────────────────────────────────────────────────────────┘

Start Time: [0:00]  End Time: [0:10]  Target Loops: [5]
```

---

## Color Scheme (Punk Rock Aesthetic)

- **Timeline background:** Black (#000) or dark gray (#222)
- **Timeline track:** Light gray (#666) or white (#fff)
- **Start marker:** Green (#00ff00) or lime green
- **End marker:** Red (#ff0000) or bright red
- **Playhead:** White (#fff) or cyan (#00ffff)
- **Loop area highlight:** Yellow/amber (#ffaa00) with transparency
- **Text:** White (#fff) for labels

---

## Responsive Design

### Desktop (MacBook, iPad)
- Full timeline visible
- Draggable markers
- Hover tooltips
- Click to seek

### Mobile (iPhone)
- Simplified timeline (may hide on very small screens)
- Touch-friendly markers (larger hit areas)
- Swipe to adjust (alternative to dragging)

---

## User Interactions

### Setting Start Time
1. **Click on timeline** → Start time jumps to clicked position
2. **Drag green START marker** → Start time follows marker
3. **Type in input** → Marker moves to typed time
4. **Arrow keys** (when input focused) → Fine-tune ±1 second

### Setting End Time
1. **Click on timeline** → End time jumps to clicked position
2. **Drag red END marker** → End time follows marker
3. **Type in input** → Marker moves to typed time
4. **Arrow keys** (when input focused) → Fine-tune ±1 second

### Visual Feedback
- **Hover over marker:** Highlight + show time tooltip
- **Dragging:** Marker follows cursor, show time as you drag
- **Playing:** Playhead moves smoothly, loop area highlighted
- **Loop active:** Highlight the loop region between start/end

---

## Implementation Approach

### Component Structure
```
<Timeline>
  <TimelineTrack>
    <StartMarker />
    <EndMarker />
    <Playhead />
    <LoopHighlight /> (shaded area between start/end)
  </TimelineTrack>
  <TimeLabels />
</Timeline>
```

### Key Features
1. **Calculate positions:** `(time / duration) * width`
2. **Handle drag events:** `onMouseDown`, `onMouseMove`, `onMouseUp`
3. **Sync with inputs:** When user types, update marker position
4. **Sync with player:** When video plays, update playhead
5. **Validation:** Ensure start < end, end <= duration

---

## Benefits

✅ **Visual feedback** - See exactly where loop points are  
✅ **Faster workflow** - Drag instead of typing  
✅ **Better precision** - Click exact position  
✅ **Intuitive** - Musicians think visually  
✅ **Context** - See loop in relation to full video  

---

**Estimated Implementation Time:** 4-6 hours



