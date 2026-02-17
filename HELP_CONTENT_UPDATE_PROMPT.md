# Prompt: Update Vibey Looper Help Content

Use this prompt (with Cursor or another AI) to apply the recommended help-content changes to the Vibey Looper app.

---

## Goal

Update the **in-app help** in **`src/App.jsx`** so it matches the current app behavior and UI. Edit only the help modal content (the block where `showHelp &&` and `<div className="help-content">` appear). Preserve existing structure, styling, and the `isMobile` conditional logic; only change the copy and add the new bullets/sentences below.

---

## Changes to Make

### 1. Add: Default video (star ★)

- **Where:** Under **Find a YouTube video** (step 1), add one new bullet after the existing bullets (URL/Video ID and, on desktop, search box).
- **What to add:** A bullet explaining the star button: the user can set or remove the default video with the star (★); that video loads when they open the app; they can click/tap the star again to remove it as default; the default video cannot be removed from Recent until it is no longer set as default. Use "click" vs "tap" based on `isMobile` like the rest of the help.

### 2. Add: Loop Time display (desktop)

- **Where:** In **Set your loop times** (step 2) or **Control playback** (step 5), add one sentence for desktop only.
- **What to add:** On desktop, the **Loop Time** display shows the length of the current loop (end time minus start time). If you add it in step 2, wrap it in `{!isMobile && ( ... )}` so it only shows on desktop.

### 3. Add: Resume Loop (red button)

- **Where:** In **Control playback** (step 5), in the bullet that describes the red button.
- **What to add:** After saying that the red button "Stop Loop" pauses the loop, add that when paused the same button becomes **Resume Loop** and the user can click/tap it again to resume from the current position. Use "click" vs "tap" based on `isMobile`.

### 4. Fix: "Set" vs "Set from Video" on desktop

- **Where:** **Set your loop times** (step 2), in the bullets that mention the button next to Start Time and End Time.
- **Current:** The help refers to the "Set" button for both desktop and mobile.
- **Change:** On desktop the button label is **Set from Video**; on mobile it is **Set**. Update the copy so desktop users see "Set from Video" and mobile users see "Set" (e.g. use `{isMobile ? 'Set' : 'Set from Video'}` in the JSX where the button name is mentioned, or one sentence that says "Set from Video (desktop) or Set (mobile)").

### 5. Fix: Playback speed (slider and range on desktop)

- **Where:** **Control playback** (step 5), in the bullet about Playback Speed.
- **Current:** It says "Playback Speed" buttons and "0.5x to 2x".
- **Change:** Say that preset buttons go from 0.5x to 2x, and that on desktop a slider also allows any speed from 0.25x to 2x. Use conditional copy so the slider/0.25x mention only appears on desktop if you prefer (e.g. `{!isMobile && ' On desktop, a slider allows any speed from 0.25x to 2x.'}` or similar).

---

## Optional (include if you want)

- **Target loops range:** In **Set target loops** (step 3), add "(1 to 10,000)" so the range is documented.

---

## Constraints

- Edit only **`src/App.jsx`** and only the help modal content inside `<div className="help-content">`.
- Do not change component logic, state, or styling; only update the help text and add the new bullets/sentences above.
- Keep existing accessibility (e.g. `aria-label`, `sr-only`) and any `isMobile` conditionals; follow the same pattern for any new desktop-only or mobile-only sentences (e.g. `{!isMobile && ( <li>...</li> )}` or inline conditional text).
