# Testing Guide: Chord Detection POC with Real YouTube Video

## What Was Implemented

✅ **ChordMini API Integration**
- Component now calls ChordMini API when video loads
- Extracts video ID from YouTube URL
- Fetches chord progression data
- Displays chords synchronized with video playback

✅ **UI Updates**
- Large current chord display
- Previous/Next chord context
- Timeline showing chord progression
- Matches app's punk rock aesthetic

## Next Steps to Test

### 1. Start the Development Server

The dev server should be running. If not:
```bash
npm run dev
```

### 2. Open the App

Navigate to the local development URL (usually `http://localhost:5173`)

### 3. Test with a YouTube Video

**Recommended Test Videos** (Simple Rock Songs):
- Any simple rock song with clear guitar/bass
- Examples:
  - "Wonderwall" by Oasis
  - "Sweet Home Alabama" by Lynyrd Skynyrd
  - "Smoke on the Water" by Deep Purple
  - "Seven Nation Army" by The White Stripes

**Steps**:
1. Paste a YouTube URL or Video ID in the input field
2. Wait for video to load
3. **Toggle "Chord Detection (POC)" to ON**
4. Wait for "Analyzing chords..." message
5. Once chords are detected, they'll appear in the display
6. Click "Start Loop" to play the video
7. Watch the chord display update as the video plays

### 4. What to Look For

**Success Indicators**:
- ✅ "Analyzing chords..." appears when enabled
- ✅ Chord progression loads (may take 10-30 seconds)
- ✅ Current chord displays in large red text
- ✅ Previous/Next chords show on sides
- ✅ Timeline shows chord progression
- ✅ Chord updates as video plays

**Potential Issues**:
- ⚠️ **Rate Limit**: If you see "Rate limit exceeded", wait 1 minute and try again (ChordMini allows 2 requests/minute)
- ⚠️ **API Error**: If API is down, you'll see an error message
- ⚠️ **No Chords**: Some videos may not return chord data

### 5. Testing Different Scenarios

**Test 1: Simple Rock Song**
- Use a well-known rock song
- Should detect chords clearly
- Accuracy should be good

**Test 2: Rate Limiting**
- Try multiple videos quickly
- Should see rate limit message after 2 requests
- Wait 1 minute and try again

**Test 3: Video Looping**
- Set start/end times
- Start loop
- Verify chord resets when loop restarts

**Test 4: Different Video Types**
- Try acoustic songs
- Try songs with complex arrangements
- Compare accuracy

## Expected Behavior

### When Video Loads:
1. User toggles "Chord Detection (POC)" to ON
2. Component extracts video ID from URL
3. Makes API call to ChordMini: `POST https://api.chordmini.me/v1/chords`
4. Shows "Analyzing chords..." message
5. Receives chord data (array of chords with timestamps)
6. Displays chord progression

### During Playback:
1. Component tracks `currentTime` from video
2. Finds matching chord for current time
3. Updates display with current chord
4. Shows previous/next chords for context
5. Highlights current chord in timeline

### Error Handling:
- **Rate Limit**: Shows message, allows retry after 1 minute
- **API Error**: Shows error message, allows retry
- **No Data**: Shows "No chord data available"

## API Details

**Endpoint**: `https://api.chordmini.me/v1/chords`

**Request**:
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response**:
```json
{
  "chords": [
    {"time": 0.0, "chord": "C", "confidence": 0.95},
    {"time": 4.2, "chord": "Am", "confidence": 0.92},
    {"time": 8.5, "chord": "F", "confidence": 0.88}
  ]
}
```

**Rate Limits**:
- 2 requests per minute
- No authentication required (currently)

## Troubleshooting

### Chords Not Appearing
1. Check browser console for errors
2. Verify video ID is correct
3. Check if API returned data (console.log)
4. Wait for analysis to complete (may take 10-30 seconds)

### Rate Limit Error
- Wait 1 minute between requests
- ChordMini allows 2 requests/minute
- Try a different video or wait

### API Not Responding
- Check internet connection
- Verify ChordMini API is accessible
- Check browser console for CORS errors

### Chords Not Syncing
- Verify `currentTime` is updating (check status display)
- Check if chord data has correct timestamps
- Verify video is playing

## Success Criteria

✅ **POC is successful if**:
- API call works and returns chord data
- Chords display correctly
- Chords sync with video playback
- UI matches design mockup
- Error handling works

## Next Steps After Testing

If POC is successful:
1. Gather user feedback
2. Measure accuracy with different songs
3. Evaluate rate limits impact
4. Decide on production approach:
   - Continue with ChordMini (if rate limits acceptable)
   - Upgrade to Klang.io (if need more requests)
   - Build backend service (if need unlimited)

If POC has issues:
1. Document problems
2. Evaluate alternative APIs
3. Consider backend solution
4. Refine approach

## Notes

- **Branch**: All changes are on `feature/chord-detection-poc`
- **Main Branch**: Unaffected, safe to test
- **Design**: Current design is for POC, will be refined for production




