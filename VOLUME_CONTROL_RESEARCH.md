# Volume Control for Vibey Looper

## Feasibility: ✅ YES

The YouTube IFrame API **fully supports** volume control programmatically.

## Available Methods

### Volume Control
- `player.setVolume(volume)` - Sets volume (0-100)
- `player.getVolume()` - Gets current volume (0-100)

### Mute Control
- `player.mute()` - Mutes the video
- `player.unMute()` - Unmutes the video
- `player.isMuted()` - Returns true if muted

## Implementation

### 1. Add State
```javascript
const [volume, setVolume] = useState(100) // 0-100
const [isMuted, setIsMuted] = useState(false)
```

### 2. Set Volume on Player Ready
```javascript
onReady: (event) => {
  setPlayer(event.target)
  // Set initial volume
  if (event.target.setVolume) {
    event.target.setVolume(volume)
  }
  if (isMuted && event.target.mute) {
    event.target.mute()
  }
}
```

### 3. Update Volume Handler
```javascript
const handleVolumeChange = useCallback((newVolume) => {
  setVolume(newVolume)
  if (player && player.setVolume) {
    try {
      player.setVolume(newVolume)
      // Auto-unmute if volume > 0
      if (newVolume > 0 && isMuted && player.unMute) {
        player.unMute()
        setIsMuted(false)
      }
    } catch (error) {
      console.warn('Failed to set volume:', error)
    }
  }
}, [player, isMuted])
```

### 4. Mute Toggle Handler
```javascript
const handleMuteToggle = useCallback(() => {
  if (!player) return
  
  try {
    if (isMuted) {
      if (player.unMute) {
        player.unMute()
        setIsMuted(false)
      }
    } else {
      if (player.mute) {
        player.mute()
        setIsMuted(true)
      }
    }
  } catch (error) {
    console.warn('Failed to toggle mute:', error)
  }
}, [player, isMuted])
```

---

## UI Design Options

### Option 1: Slider + Mute Button (Recommended)

**Layout**: Matches playback speed section pattern
```
┌─────────────────────────────────────┐
│           VOLUME                     │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]  │
│   ^                                  │
│  Slider (no percentage display)     │
└─────────────────────────────────────┘
```

**Pattern** (same as Playback Speed):
- Label centered above
- Controls in a row below
- Clean, consistent design

**Pros**:
- ✅ Precise control (0-100%)
- ✅ Visual feedback
- ✅ Standard UI pattern
- ✅ Works well on mobile

**Cons**:
- ⚠️ Takes more space

---

### Option 2: Preset Buttons (Like Playback Speed)

**Layout**: Similar to current speed presets
```
┌─────────────────────────────────────┐
│  Volume                              │
│  [Mute] [25%] [50%] [75%] [100%]    │
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Matches existing design
- ✅ Quick access to common levels
- ✅ Compact

**Cons**:
- ⚠️ Less precise (only preset values)

---

### Option 3: Hybrid (Slider + Presets)

**Layout**: Slider with preset buttons
```
┌─────────────────────────────────────┐
│  Volume                              │
│  [🔇] [━━━━━━━━━━━━━━━━━━━━] 100%   │
│  [Mute] [25%] [50%] [75%] [100%]    │
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Best of both worlds
- ✅ Precise + quick presets

**Cons**:
- ⚠️ More complex UI

---

## Recommended: Option 1 (Slider + Mute Button)

**Why**:
- Most intuitive
- Precise control
- Standard pattern users expect
- Works well on mobile (touch-friendly)

**Design**:
- "Volume" label centered above
- Slider on left
- Volume percentage on right
- Matches app's punk rock aesthetic

---

## Implementation Example

### Component Structure
```jsx
<div className="volume-control-section">
  <div className="volume-control-label" style={{ textAlign: 'center' }}>Volume</div>
  <div className="volume-control-wrapper">
    <input
      type="range"
      min="0"
      max="100"
      value={volume}
      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
      className="volume-slider"
    />
  </div>
</div>
```

### CSS Styling (Matches App Theme)
```css
.volume-control-section {
  width: 100%;
  margin: 20px 0;
}

.volume-control-section {
  width: 100%;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.volume-control-label {
  font-family: 'Oswald', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #fff;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  width: 100%;
}

.volume-control-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.volume-slider {
  height: 8px;
  background: #333;
  border: 2px solid #666;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  /* Match width of playback speed buttons row exactly */
  width: 100%;
  max-width: 530px;
}

/* Ensure all three sections have same width */
.speed-presets-buttons {
  max-width: 530px;
  width: 100%;
}

.buttons-row {
  max-width: 530px;
  width: 100%;
}

.volume-slider {
  flex: 1;
  height: 8px;
  background: #333;
  border: 2px solid #666;
  outline: none;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #ff0000;
  border: 2px solid #000;
  cursor: pointer;
  box-shadow: 2px 2px 0px #000;
}

.volume-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #ff0000;
  border: 2px solid #000;
  cursor: pointer;
  box-shadow: 2px 2px 0px #000;
}

```

---

## Placement in UI

### Recommended: Above Playback Speed Section

**Updated Layout**:
1. Controls (Start Time, End Time, Loops)
2. **→ Volume Control (NEW)**
3. Playback Speed
4. Progress Bar
5. Buttons (Start, Stop, Reset)
6. Status

**Why**:
- Groups all playback controls together
- Volume is a more fundamental control (often adjusted first)
- Logical flow: Volume → Speed
- Doesn't disrupt existing layout

---

## Mobile Considerations

- Slider works well on touch devices
- Mute button should be large enough (44x44px minimum)
- Consider vertical layout on very small screens

---

## Accessibility

- Mute button has `aria-label`
- Slider has proper labels
- Keyboard accessible (tab navigation)
- Screen reader friendly

---

## Summary

✅ **Feasible**: YouTube IFrame API fully supports volume control
✅ **Simple**: Easy to implement
✅ **UI**: Slider + mute button recommended
✅ **Placement**: After playback speed section

Ready to implement!

