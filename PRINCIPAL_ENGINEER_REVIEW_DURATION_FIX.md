# Principal Engineer Review: Duration / End-Time Validation Fix

**Date:** 2026-01-30  
**Context:** "END TIME CANNOT BE AFTER THE VIDEO ENDS" appears when switching videos (new URL, saved loop, or player loading a different video first). Root cause: we keep `endTime` (and `startTime`) from the previous video and validate against the new video’s duration.

**Proposed fix:** When we set `videoDuration` for the **current** video (in the effect that gets duration from the player), if `endTime` > new duration (or `startTime` ≥ new duration), **cap** `endTime` and `startTime` to the new video’s duration and update displays—**unless** we are preserving times (e.g. loading a saved loop).

---

## 1. Agreement with the approach

**Verdict: I agree with the approach.**

- The root cause is correct: we validate the **new** video’s duration against the **old** video’s end time because we never reset/cap when the effective “current video” changes.
- Fixing state at the **source** (when we learn the new duration) is the right place: we avoid ever having “current video duration” + “previous video end time” in state, so validation doesn’t need to special-case this.
- Capping only when times are **invalid** for the current video (endTime > duration, startTime ≥ duration) is correct; we are correcting inconsistent state, not arbitrarily overwriting user input.

---

## 2. Where to implement

**Recommendation: Implement in the same place we set `videoDuration` (the “get duration” useEffect, ~687–749), right after we call `setVideoDuration(duration)` and set `videoDurationVideoIdRef.current = extractedId`.**

- We already know this duration is for the **current** video (we’re in the branch where `extractedId` matches).
- We can cap `endTime` / `startTime` and their displays in the same tick, so the next validation run sees consistent state.
- We must **not** cap when the user explicitly asked to preserve times (saved loop): respect `preserveEndTimeRef`, `isLoadingSavedLoopRef`, and `loadingFromSavedLoopRef` the same way the auto-set endTime effect does. If any of those are set, skip capping and let validation show an error if the saved times are invalid for this video.

---

## 3. Edge cases and behavior

| Scenario | Desired behavior | Does the proposed fix respect it? |
|----------|-------------------|-----------------------------------|
| User switches URL from video A (6:59) to video B (4:25) | endTime should become 4:25 (or at least ≤ 4:25); no false “end time after video end” | Yes: we cap endTime to new duration when we set videoDuration for B. |
| User loads saved loop for video B with endTime 5:00; video B is 4:25 | Show error “end time after video end” (saved 5:00 is invalid); do **not** overwrite saved 5:00 with 4:25 | Yes: we skip capping when preserve/saved-loop flags are set. |
| Player loads “radio” video first (7:14), then requested video (6:59) | endTime might be set to 7:14 then we get 6:59; we should cap to 6:59 so error doesn’t show | Yes: when we set videoDuration for the requested video (6:59), we cap endTime to 6:59 if it’s currently 7:14. |
| startTime > new duration (e.g. start 5:00, new video 4:25) | startTime should be capped (e.g. to 4:25 or 0); endTime capped as above | Yes: proposed fix includes capping startTime as well (e.g. to 0 or to duration) so both are consistent. |

---

## 4. Alternative considered

- **Only fix in validation (e.g. “if endFails, cap endTime then re-run”):** Would remove the error but couples validation to mutating state and can cause extra renders and harder-to-reason ordering. Prefer fixing state when we **learn** the new duration (single source of truth).

---

## 5. Risk and testing

- **Risk:** If we ever cap when we shouldn’t (e.g. saved-loop path sets flags a tick late), we could overwrite a user’s saved end time. Mitigation: use the same guards as the auto-set endTime effect (`preserveEndTimeRef`, `isLoadingSavedLoopRef`, `loadingFromSavedLoopRef`) and only cap when we’re **not** in a “preserve times” path.
- **Testing:** After implementation, verify: (1) switch URL from long video to short video → endTime caps, no error; (2) load saved loop with end time past new video’s duration → error still shows, saved end time not overwritten; (3) URL with playlist/radio that loads different video first → after requested video loads, endTime caps to its duration.

---

## 6. Conclusion

**I agree with the proposed fix.** Implement capping of `endTime` (and `startTime` + displays) in the duration-setting effect when we set `videoDuration` for the current video, and skip capping when we are preserving times (saved loop). That addresses the root cause without breaking saved-loop behavior and keeps validation simple.
