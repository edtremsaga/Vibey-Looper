# Vibey-Looper Onboarding Architecture Report

## 1. Executive Summary

Vibey-Looper is a client-side React/Vite app for musicians practicing against YouTube videos. Its core job is to load a YouTube video, let the user define a start/end segment, repeat that segment a target number of times, and preserve useful practice state in `localStorage`.

The real product today is broader than a bare looper: it also manages recent videos, saved loop presets, a user default video, playback speed and desktop volume controls, and a separate Set List flow that plays full videos sequentially from saved loops.

## 2. How the App Works Today

### User flow

1. App boots into `src/main.jsx`, renders `App`.
2. `App` loads the user’s default video from `localStorage`, otherwise falls back to a hardcoded app default YouTube URL.
3. It dynamically loads the YouTube IFrame API and creates one player instance.
4. When a valid URL/video ID is present, it cues the video without autoplay, fetches metadata from YouTube oEmbed, and stores that video in recent history.
5. Start/end times can be typed or captured from the current playback position with “Set from Video” / “Set”.
6. Clicking `Start Loop` seeks to `startTime`, starts playback, and begins a polling loop that watches current time and seeks back to `startTime` at `endTime`.
7. Each completed pass increments `currentLoops`; playback pauses automatically when `currentLoops >= targetLoops`.
8. The user can pause/resume, reset, save the loop preset, load recent/saved items, or jump into the Set List page.

### Major user-visible features implemented in code

- YouTube URL or 11-char video ID input.
- Desktop-only search UI that opens YouTube search in a new tab.
- Start/end loop times with MM:SS normalization.
- “Set from Video” buttons.
- Target loop count 1..10,000.
- Pause/resume via one Stop/Resume button.
- Reset button.
- Playback speed presets and desktop slider.
- Desktop volume slider.
- Progress bar and loop counter.
- Recent videos with thumbnails and delete flow.
- Saved loops with thumbnails, times, playback speed persistence, and delete flow.
- User default video via star button.
- Separate Set List page with saved-set-list persistence.

### Important edge behaviors

- New videos are loaded with `cueVideoById` when possible so users see thumbnails without autoplay.
- On new video load, `endTime` is usually auto-set to the video duration.
- Loading a saved loop uses several guard refs to preserve the saved start/end instead of letting auto-duration overwrite them.
- Returning from the Set List page resets the main page to an initial state.
- Mobile uses alternate layouts for recent/saved dropdowns and disables desktop-only UI in CSS, not JSX.

## 3. Technical Architecture

### Stack

- React 18, Vite 5, Vitest, Testing Library.
- `@hello-pangea/dnd` for Set List drag/drop.
- No backend. All persistence is browser `localStorage`.
- YouTube IFrame Player API for playback and YouTube oEmbed for title/author/thumbnail.

### Main components

- `src/App.jsx`: almost all main-page product logic, YouTube integration, loop engine, persistence wiring, help modal, and page toggle to Set List.
- `src/SetList.jsx`: separate page/state machine for building and playing a sequence of songs from saved loops.
- `src/utils/helpers.js`: time parsing/formatting, MM:SS normalization, video ID extraction, YouTube error mapping.
- `src/utils/storage.js`: all `localStorage` read/write/validation functions.
- `src/utils/constants.js`: limits, breakpoints, defaults, player sizing.

### State management

- Pure local React state and refs. No context/store/router.
- `App.jsx` is highly stateful and uses many refs as control flags for async/player sequencing.
- The loop engine is a `useEffect` with recursive `setTimeout`, adaptive polling cadence, and `hasLoopedRef` to avoid double-counting.

### Persistence

- `recentVideos`, `savedLoops`, `defaultVideo`, `setList`, `savedSetLists` in `localStorage`.
- Stored data is validated and sanitized on both write and read.

### YouTube integration

- Script tag injection for IFrame API.
- One player instance per page.
- oEmbed metadata fetch with timeout/content-type validation.
- Friendly error mapping for IFrame API error codes `2` / `5` / `100` / `101` / `150`.

### Mobile behavior found in code

- Mobile detection is JS-based using viewport, touch capability, and UA.
- CSS hides desktop search, desktop label row, speed slider, and volume on small screens.
- Recent/saved dropdowns become mobile bottom-sheet style overlays.
- Set List itself is available on mobile in code/CSS, despite docs that sometimes describe it as desktop-only.
- In Set List, drag is disabled on mobile, but add/remove still works.

## 4. Data / Storage Model

### Stored locally

- `recentVideos`: `{ videoId, title, author, thumbnail, timestamp }`, max 100.
- `defaultVideo`: `{ videoId, url, title, author, thumbnail, timestamp }`.
- `savedLoops`: `{ id, videoId, url, startTime, endTime, targetLoops, playbackSpeed, title, author, thumbnail, timestamp }`, max 100.
- `setList`: array of saved-loop-like items currently staged for playback.
- `savedSetLists`: `{ id, name, songs, createdAt }`, max 100.

### Handling details

- Recent videos are auto-saved when videos load/play.
- Saved loops persist full loop config including playback speed.
- Default video is protected from deletion while still marked default.
- Set List playback ignores saved loop boundaries; it plays each song’s full video once.

### Constraints and assumptions

- Valid YouTube IDs are exactly 11 chars.
- Time inputs are clamped to 24 hours.
- Thumbnail URLs must be HTTPS.
- Duplicate prevention in Set List is by `videoId`, not saved-loop ID.

## 5. Documentation Map

### Most important current docs

- `README.md`: decent product overview, but already stale in spots.
- `MAIN_PAGE_REQUIREMENTS.md`: best single doc for intended current main-page behavior; mostly aligned, but not fully.
- `SET_LIST_REQUIREMENTS.md`: good for intent/history of Set List behavior.
- `ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md`: useful for understanding recent accessibility work that is visible in code.
- `CODE_REVIEW_JAN2025.md`: broad quality snapshot; some observations are outdated.
- `SECURITY_REVIEW_DEC2024.md`: explains the validation/sanitization posture that is clearly reflected in helpers/storage.
- `PRINCIPAL_ENGINEER_REVIEW_DURATION_FIX.md`: very relevant to the current duration/end-time logic and appears reflected in code.
- `MOBILE_BEHAVIOR.md`: narrower exploratory doc about search behavior on iPhone; not authoritative for whole app.
- `YOUTUBE_IMPROVEMENTS.md`, `DESIGN_RECOMMENDATIONS.md`: forward-looking/ideation, not current product spec.

### Docs that look historical, exploratory, or off-track

- `QUICK_REFERENCE.md`, `TESTING_GUIDE.md`, `API_TROUBLESHOOTING.md`: about a chord-detection POC, not the current looper app.
- Several review/testing/proposal docs are snapshots of prior iterations rather than source-of-truth specs.

## 6. Known Risks / Sharp Edges

### Technical

- `src/App.jsx` is a monolith and carries most product logic plus many async guard refs; change risk is high.
- Player-loading and saved-loop restoration depend on ordering between `useEffect`s, player callbacks, and refs like `preserveEndTimeRef`.
- Validation and error messaging reuse one `validationError` channel for both time-validation and YouTube/player failures.

### UX

- Search is a copy/paste workflow, not integrated search.
- Reset behavior is non-obvious: code restores the last started loop’s saved times, but some docs still describe reset-to-defaults.
- Set List uses saved loops as song sources but plays full videos, which may surprise users expecting saved loop boundaries.

### Testing, security, and accessibility gaps

- Security validation is strong for a client-only app.
- Accessibility work is visible and meaningful.
- Automated test coverage is thin: one small `App.test.jsx` and test setup stubs. It mostly checks render/help content, not core looping behavior.

## 7. Codebase Quality Assessment

### What looks strong

- Input/data validation is unusually thorough for a small frontend app.
- Storage helpers are defensive and fairly disciplined.
- Error handling is pragmatic and user-facing.
- Set List is a real feature, not just a stub.

### What looks complex

- Main app state orchestration around video loading, duration discovery, saved-loop preservation, and loop playback.
- Mobile behavior is split across JS detection, duplicated markup sections, and CSS gating.

### What looks confusing

- Docs are numerous and mixed-quality; several are stale or for abandoned/experimental work.
- Some behavior is enforced in CSS while help/docs talk about product-level availability.

### Where contributors will get tripped up

- Anything touching `videoDuration`, `loadingFromSavedLoopRef`, `preserveEndTimeRef`, `lastAutoSetEndTimeVideoIdRef`, or the loop polling effect.
- Assuming docs are authoritative without checking code.
- Assuming Set List uses loop boundaries; it does not.

## 8. If I Had to Work on This Next Week

### Where I would start

I would start with `src/App.jsx`, `src/SetList.jsx`, `src/utils/storage.js`, `src/utils/helpers.js`, and `MAIN_PAGE_REQUIREMENTS.md`.

### What I would manually test first

- Load a fresh video and confirm end-time auto-sets to duration.
- Start/stop/resume/reset a loop and verify loop counts.
- Save a loop, reload it on same video and on different video.
- Switch between long and short videos to test duration validation.
- Build/play a Set List, including mobile behavior and duplicate prevention.

### Areas that deserve extra caution

- Saved-loop load path.
- Cross-video duration changes.
- Returning from Set List to main page.
- Any change that touches mobile-only or desktop-only behavior.

## 9. Open Questions / Ambiguities

- This report is based on code and documentation review, not direct runtime verification.
- Some docs say Set List is desktop-only, but code/CSS still supports mobile Set List layouts.
- Some docs say reset returns times to defaults; current code restores the last-started loop times and only resets target loops/count.
- `README.md` says saved loops are “unlimited”; code caps them at 100.
- `@vercel/analytics` is declared in `package.json`, but no usage was found in the key runtime files reviewed.

## Mental Model

- Single-page React app with a boolean page toggle, not routing.
- Main page is a YouTube segment looper with strong local persistence.
- One giant `App.jsx` owns most behavior.
- YouTube metadata comes from oEmbed; playback comes from IFrame API.
- Looping is implemented by polling current time and seeking backward at `endTime`.
- Saved loops preserve start/end/target loops/playback speed plus metadata.
- Recent/default video are first-class product features.
- Set List is built from saved loops but plays full videos in sequence.
- Mobile is mostly a CSS-adapted variant of the same app.
- Docs are useful but noisy; code is the source of truth.

## Prioritized Reading Order for a New Engineer

1. `src/App.jsx`
2. `src/SetList.jsx`
3. `src/utils/storage.js`
4. `src/utils/helpers.js`
5. `src/utils/constants.js`
6. `README.md`
7. `MAIN_PAGE_REQUIREMENTS.md`
8. `SET_LIST_REQUIREMENTS.md`
9. `PRINCIPAL_ENGINEER_REVIEW_DURATION_FIX.md`
10. `ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md`

## Five Files Most Important to Understand First

- `src/App.jsx`
- `src/SetList.jsx`
- `src/utils/storage.js`
- `src/utils/helpers.js`
- `MAIN_PAGE_REQUIREMENTS.md`
