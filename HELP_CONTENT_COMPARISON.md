# Help Content Comparison: Desktop vs Mobile

## Desktop Version (with search box)

### How to Use

1. **Find a YouTube video:**
   - Use the search box at the top to search for songs. Click "Search on YouTube" to open results in a new tab.
   - Or paste a YouTube URL or enter a Video ID directly in the input field below.

2. **Set your loop times:**
   - **Start Time:** Enter the start time in MM:SS format (e.g., "0:46" for 46 seconds, "1:02" for 1 minute 2 seconds)
   - **End Time:** Enter the end time in MM:SS format (e.g., "1:30" for 1 minute 30 seconds)

3. **Set target loops:** Enter how many times you want the video to loop between the start and end times.

4. **Start looping:** Click the green "Start Loop" button. The video will automatically:
   - Play from the start time
   - Seek back to the start when it reaches the end time
   - Count each completed loop
   - Stop automatically when the target number of loops is reached

5. **Control playback:**
   - Click "Stop" (red button) to pause the loop
   - Click "Reset" (blue button) to return to the start time and reset the loop counter
   - Use the "Playback Speed" dropdown to adjust video speed (0.25x to 2x)

**Tip:** You can also enter plain numbers (like "46") which will be treated as seconds.

### Keyboard Shortcuts
- **Spacebar:** Start/Stop looping
- **R:** Reset to start time
- **Esc:** Close help modal

---

## Mobile Version (without search box)

### How to Use

1. **Find a YouTube video:**
   - Paste a YouTube URL or enter a Video ID directly in the input field.

2. **Set your loop times:**
   - **Start Time:** Enter the start time in MM:SS format (e.g., "0:46" for 46 seconds, "1:02" for 1 minute 2 seconds)
   - **End Time:** Enter the end time in MM:SS format (e.g., "1:30" for 1 minute 30 seconds)

3. **Set target loops:** Enter how many times you want the video to loop between the start and end times.

4. **Start looping:** Tap the green "Start Loop" button. The video will automatically:
   - Play from the start time
   - Seek back to the start when it reaches the end time
   - Count each completed loop
   - Stop automatically when the target number of loops is reached

5. **Control playback:**
   - Tap "Stop" (red button) to pause the loop
   - Tap "Reset" (blue button) to return to the start time and reset the loop counter
   - Use the "Playback Speed" dropdown to adjust video speed (0.25x to 2x)

**Tip:** You can also enter plain numbers (like "46") which will be treated as seconds.

---

## Key Differences

1. **Desktop:** Includes instructions about the search box
2. **Mobile:** Removes search box instructions, only mentions URL/Video ID input
3. **Mobile:** Changes "Click" to "Tap" for button interactions
4. **Mobile:** Keyboard shortcuts section can be hidden (since mobile devices don't typically use keyboard shortcuts)

## Implementation Notes

- Use `window.innerWidth <= 768` or CSS media queries to detect mobile
- Conditionally render different help content based on device type
- Consider hiding keyboard shortcuts section on mobile devices






