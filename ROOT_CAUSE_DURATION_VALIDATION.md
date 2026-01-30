# Root Cause Analysis: “End time cannot be after the video ends (3:58)” when end time is 3:58

## Observed behavior

- **User input:** End time set to **3:58** (matches the video length shown in the error).
- **Error:** “END TIME CANNOT BE AFTER THE VIDEO ENDS (3:58). USE THE ‘SET FROM VIDEO’ BUTTON TO CAPTURE THE EXACT TIME.”
- So the app treats an end time that equals the displayed duration as “after” the video end.

## Relevant code paths

### 1. Where `videoDuration` comes from

- **Source:** YouTube IFrame Player API `player.getDuration()`.
- **Used in:**
  - **onReady** (after `DURATION_DELAY` 500 ms): `setVideoDuration(duration)`.
  - **Duration useEffect** (after 500 ms, with retry after `API_TIMEOUT` 5 s): same `setVideoDuration(duration)`.
- **Type:** Float (e.g. `238.0`, `237.99`, `238.5`).
- **Display:** `secondsToMMSS(videoDuration)` uses `Math.floor` for minutes and seconds, so e.g. `238.7` → `"3:58"`, `237.99` → `"3:57"`.

### 2. Where `endTime` comes from

- **Auto-set when a new video loads:**  
  `setEndTime(videoDuration)` and `setEndTimeDisplay(secondsToMMSS(videoDuration))`.  
  So `endTime` is stored as the **raw float** from the API (e.g. `238.7`), while the user sees the floored string (e.g. `"3:58"`).
- **User typing:**  
  `mmssToSeconds("3:58")` → `238` (integer). So manually entered `3:58` is stored as `238`.

### 3. Validation logic (current, with 1 s tolerance)

```js
durationMax = videoDuration + TIME_LIMITS.DURATION_TOLERANCE  // +1 second
if (endTime > durationMax) {
  setValidationError(`End time cannot be after the video ends (${secondsToMMSS(videoDuration)}). ...`)
}
```

- Error is shown only when **`endTime > videoDuration + 1`**.
- So for the message to say “(3:58)”, we must have `secondsToMMSS(videoDuration) === "3:58"` → `videoDuration` in `[238, 239)`.
- For the condition to be true we need `endTime > durationMax` → with `durationMax` in `[239, 240)`, we need **`endTime >= 239`** (numerically).

So the bug appears when the **stored** `endTime` is ≥ 239 (or just above 239 with floats) while the **display** (and the error text) show “3:58”.

## Root cause analysis

### 1. **Float vs display mismatch (most likely)**

- Auto-set does `setEndTime(videoDuration)` with the **raw float** from the API (e.g. `238.7`).
- Display uses `secondsToMMSS(videoDuration)` → `"3:58"` (floor).
- So the user sees “3:58” but the stored `endTime` can be `238.7` or any value in `[238, 239)`.
- If later `videoDuration` is updated (see below) to a **smaller** value (e.g. `237.9`), then:
  - `durationMax = 237.9 + 1 = 238.9`.
  - `endTime` is still `238.7` (from the first auto-set).
  - `238.7 > 238.9` is false → no error from this scenario alone.

So the “exact 3:58” case is more likely when:

- `videoDuration` is read as **238.something** and we show “(3:58)”.
- `endTime` was set to that same 238.something (or slightly more) by auto-set.
- Later, **another read** of `getDuration()` (retry or onReady) updates `videoDuration` to a **different** value.

Then:

- If the **second** read is **smaller** (e.g. `237.0`):  
  `durationMax = 238.0`, `endTime = 238.7` → `238.7 > 238` → **error**, and we still show “(3:58)” if the **first** read was used for the message… but we show `secondsToMMSS(videoDuration)` which is the **current** `videoDuration`. So we’d show “(3:57)” in that case. So this doesn’t fully match “(3:58)” unless the **current** `videoDuration` is in [238, 239).

- If the **second** read is **larger** (e.g. `239.0`):  
  We’d set `videoDuration = 239.0`, display “(3:59)”. So again not “(3:58)”.

So for the exact screenshot (message “(3:58)” and end time field “3:58”):

- The **current** `videoDuration` must be in `[238, 239)` so the message is “(3:58)”.
- So `durationMax` is in `[239, 240)`.
- To trigger the error we need `endTime > durationMax` → **`endTime >= 239`** (or a float just above 239).
- So the **stored** `endTime` must be ≥ 239, while the **display** shows “3:58”. That implies:
  - **Display/state desync:** e.g. `endTimeDisplay` is `"3:58"` but `endTime` state is 239 (or 239.x), or
  - **Floating‑point comparison:** e.g. `endTime = 239.0` and `durationMax = 238.9999999` so `239.0 > 238.9999999` is true.

So the root cause is a combination of:

1. **Multiple updates to `videoDuration`** from `getDuration()` at different times (onReady + delayed useEffect + retry), which can yield slightly different floats.
2. **Storing `endTime` as a float** when auto-set from `videoDuration`, so `endTime` can be 239.x or 238.x while the user sees “3:58” or “3:59”.
3. **Strict `>` comparison** with `durationMax = videoDuration + 1`, so tiny float differences can make `endTime > durationMax` true even when both “look” like 3:58 in the UI.
4. **Possible display/state desync** so the input shows “3:58” (e.g. from `endTimeDisplay`) while the value used in validation (`endTime`) is 239 or 239.x.

### 2. **Why the 1 s tolerance doesn’t always fix it**

- Tolerance allows `endTime <= videoDuration + 1`.
- If `videoDuration` is updated to a **lower** value after we auto-set `endTime`, then `durationMax` shrinks but `endTime` stays at the previous (higher) value → we can still get `endTime > durationMax`.
- If `endTime` is 239 (or 239.x) and `videoDuration` is 238.x, then `durationMax = 239.x` and `239 > 239.x` can be false, but `239.0000001 > 238.9999999 + 1` can be true due to floating point.

So the core issue is **floating‑point duration + multiple reads + strict comparison**, not only “1 second” in the abstract.

## Summary

| Factor | Role |
|--------|------|
| **YouTube `getDuration()`** | Returns a float; can vary slightly between calls. |
| **Multiple duration reads** | onReady + useEffect + retry can update `videoDuration` at different times. |
| **Auto-set `endTime`** | Stores raw float; display is floored (“3:58”) so stored value can be 238.x or 239.x. |
| **Validation** | `endTime > videoDuration + 1` is strict; float rounding can make “same” displayed time fail. |
| **Display vs state** | User sees “3:58”; value used in validation can be ≥ 239, causing the error while message says “(3:58)”. |

**Root cause:** The “end time cannot be after the video ends (3:58)” error with end time 3:58 is caused by (1) storing and comparing **floats** for duration and end time, (2) **multiple updates** to `videoDuration` from the API, and (3) a **strict** `endTime > durationMax` check, which together can make an end time that displays as 3:58 (or equals the displayed duration) fail validation when the stored value is 239 or when floating‑point rounding makes `endTime` slightly above `durationMax`.

## Recommended direction for a fix

1. **Normalize for comparison:** Use a single, comparable representation when validating, e.g. compare **integer seconds** or round both sides to the same precision (e.g. 1 decimal) before `endTime > durationMax`.
2. **Optional: normalize stored end time when it’s “at” duration:** When auto-setting, consider setting `endTime = Math.floor(videoDuration)` (or `Math.min(..., Math.floor(videoDuration))`) so the stored value matches what we show and what we allow as “end of video”.
3. **Optional: debounce or single source for duration:** Reduce multiple updates to `videoDuration` (e.g. use the first valid read per video, or ignore later reads that differ by less than 1 s) so `durationMax` doesn’t jump and cause previously valid `endTime` to become invalid.

This report is for analysis only; no code changes were made.
