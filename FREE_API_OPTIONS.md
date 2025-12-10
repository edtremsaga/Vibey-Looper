# Additional Free API Options for Chord Detection POC

## Summary

After researching additional free options beyond ChordMini and Klang.io, here are the alternatives:

**Best Additional Options**:
1. **Chords API (alday.dev)** - Free, simple, but **chord reference only** (not detection)
2. **Scales-Chords API** - Free, but **chord reference only** (not detection)
3. **Moises AI** - Has app, but **API access unclear/paid**
4. **Strumly** - **No clear API documentation found**
5. **Chordify** - **No public API found**

**Key Finding**: Most "free" options are either:
- Chord **reference** APIs (lookup chord diagrams, not detection)
- Apps without public APIs
- Services that require paid API access

**Recommendation**: **ChordMini remains the best free option** for actual chord detection from audio/YouTube.

---

## Detailed Analysis

### 1. Chords API (chords.alday.dev)

**Type**: Chord Reference API (NOT Detection)

**What it does**:
- Provides chord data (notes, fingerings, diagrams)
- Lookup existing chords by name
- Does NOT detect chords from audio

**API Details**:
- ✅ Free
- ✅ No authentication required
- ✅ REST API
- ❌ **Cannot detect chords from audio/YouTube**

**Use Case**: 
- Display chord diagrams once you know the chord name
- Not useful for detection POC

**Example**:
```javascript
// Get chord data for "C major"
fetch('https://api.chords.alday.dev/chords/C')
// Returns: {name: "C", notes: ["C", "E", "G"], fingerings: [...]}
```

**Verdict**: ❌ **Not suitable for POC** (no detection capability)

---

### 2. Scales-Chords API (scales-chords.com)

**Type**: Chord Reference API (NOT Detection)

**What it does**:
- Provides chord charts/images
- Chord sounds/audio playback
- Does NOT detect chords from audio

**API Details**:
- ✅ Free
- ✅ JavaScript library
- ❌ **Cannot detect chords from audio/YouTube**

**Use Case**:
- Display chord diagrams
- Play chord sounds
- Not useful for detection

**Example**:
```html
<script src="https://scales-chords.com/api/scales-chords.js"></script>
<script>
  // Display chord diagram
  ScalesChords.showChord('C', 'guitar');
</script>
```

**Verdict**: ❌ **Not suitable for POC** (no detection capability)

---

### 3. Moises AI

**Type**: App with Possible API (Unclear)

**What it does**:
- AI-powered chord detection
- Instrument separation
- Real-time chord display

**API Status**:
- ⚠️ **No clear public API documentation found**
- App exists, but API access appears to be:
  - Enterprise/paid only
  - Or not publicly available

**Pricing**:
- App: Free tier with limitations
- API: Not publicly documented (likely paid)

**Verdict**: ⚠️ **Unclear/Unavailable** - App exists but no clear free API

---

### 4. Strumly

**Type**: Web Service (API Status Unknown)

**What it does**:
- Analyzes YouTube videos for chords
- Real-time synchronization
- Interactive timeline

**API Status**:
- ⚠️ **No API documentation found**
- Appears to be web-only service
- No clear programmatic access

**Verdict**: ⚠️ **No API Available** - Web service only

---

### 5. Chordify

**Type**: Web Service (No Public API)

**What it does**:
- Extracts chords from songs
- Synchronizes with playback
- Supports YouTube, SoundCloud, etc.

**API Status**:
- ❌ **No public API found**
- Enterprise solutions may exist (not documented)
- Web service only

**Verdict**: ❌ **No Public API** - Web service only

---

### 6. Chord ai (App)

**Type**: Mobile App (No API)

**What it does**:
- Detects chords from songs
- Works with YouTube, SoundCloud
- Beat tracking

**API Status**:
- ❌ **Mobile app only**
- No API access

**Verdict**: ❌ **No API** - App only

---

### 7. Autochord (Python Library)

**Type**: Open-Source Library (NOT API)

**What it does**:
- Python library for chord detection
- Uses TensorFlow
- Can detect chords from audio files

**API Status**:
- ❌ **Not an API** - it's a Python library
- Would require backend service to use
- Free and open-source

**Use Case**:
- Could be used in backend service (Option 1)
- Not a direct API alternative

**Verdict**: ⚠️ **Not an API** - Library for backend implementation

---

### 8. Samplab

**Type**: Desktop App/Plugin (No API)

**What it does**:
- Transcribes chords from audio
- Desktop application
- Plugin format

**API Status**:
- ❌ **No API** - Desktop app/plugin only

**Verdict**: ❌ **No API** - Desktop app only

---

## Comparison Table

| Service | Free? | API? | Detection? | YouTube? | POC Suitable? |
|---------|-------|------|------------|---------|---------------|
| **ChordMini** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **YES** |
| **Klang.io** | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Free tier very limited |
| **Chords API** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No (reference only) |
| **Scales-Chords** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No (reference only) |
| **Moises AI** | ⚠️ Unclear | ⚠️ Unclear | ✅ Yes | ✅ Yes | ❌ No clear API |
| **Strumly** | ⚠️ Unknown | ❌ No | ✅ Yes | ✅ Yes | ❌ No API |
| **Chordify** | ⚠️ Unknown | ❌ No | ✅ Yes | ✅ Yes | ❌ No API |
| **Chord ai** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ❌ App only |
| **Autochord** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ⚠️ Library (needs backend) |

---

## Key Findings

### 1. Most "Free APIs" Are Reference APIs
- **Chords API** and **Scales-Chords API** are chord **reference** services
- They provide chord data (diagrams, notes) but **cannot detect** chords from audio
- Useful for **displaying** chords, not for **detecting** them

### 2. Detection Services Lack Public APIs
- **Moises**, **Strumly**, **Chordify**, **Chord ai** are apps/services
- They detect chords but don't offer public APIs (or require paid access)
- Not suitable for programmatic integration

### 3. Open-Source Libraries Require Backend
- **Autochord** and similar libraries are Python tools
- Would require building backend service (Option 1)
- Not direct API alternatives

### 4. ChordMini Remains Best Free Option
- ✅ Free
- ✅ Public API
- ✅ Detects chords from YouTube
- ✅ No authentication required
- ⚠️ Rate limits (2 req/min)

---

## Updated Recommendation

### For POC: ChordMini is Still the Best Free Option

**Why**:
1. **Only free API** that actually detects chords from audio/YouTube
2. **Simple integration** (1 day implementation)
3. **No authentication** required
4. **Handles YouTube URLs** directly

**Limitations to Consider**:
- Rate limit: 2 requests/minute (may be restrictive)
- No guarantee it stays free
- Accuracy: ~85-90% (estimated)

### Alternative: Klang.io Free Tier

**If ChordMini rate limits are too restrictive**:
- Klang.io Basic: Free, 50 requests/month, 15s max
- **Problem**: 15 seconds is too short for full songs
- **Use Case**: Only for testing very short clips

### Fallback: Backend Service (If Free APIs Don't Work)

**If free APIs don't meet needs**:
- Build backend with **Autochord** or **librosa**
- Use open-source libraries
- More control, but requires development

---

## Implementation Strategy

### Phase 1: Try ChordMini (Free)
1. Implement ChordMini API integration
2. Test with simple rock songs
3. Evaluate accuracy and rate limits
4. **If works**: Continue with ChordMini

### Phase 2: If ChordMini Doesn't Work

**Option A**: Accept rate limits
- Implement request queuing
- Cache results aggressively
- Show "processing" message to users

**Option B**: Move to Klang.io
- Start with Basic (free, limited)
- Upgrade to Startup ($99/month) if needed

**Option C**: Build Backend
- Use Autochord or librosa
- Full control, no rate limits
- 4-6 weeks development

---

## Conclusion

**After comprehensive research, ChordMini remains the best free option** for chord detection from YouTube videos.

**Other "free" options are either**:
- Chord reference APIs (not detection)
- Apps without APIs
- Libraries requiring backend development

**Recommendation**: 
1. **Start with ChordMini** for POC
2. **Test thoroughly** with real songs
3. **Evaluate** if rate limits are acceptable
4. **Plan migration** to Klang.io or backend if needed

The free API landscape for chord detection is limited, making ChordMini the clear choice for a free POC.


