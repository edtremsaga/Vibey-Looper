# Prompt: Check Vibey Looper Help Content Is Up to Date

Use this prompt (with Cursor or another AI) to verify that the in-app help for Vibey Looper accurately reflects the current app.

---

## Instructions for the checker

You are checking that the Vibey Looper app’s **help content is accurate and complete** compared to the current application.

**Do not make any code changes.** Only analyze and report. Do not edit `App.jsx` or any other files.

**Canonical help location:** The live help text is in **`src/App.jsx`** in the help modal section (search for `showHelp &&` and the `<div className="help-content">` block). Treat this as the main source of truth for what the app claims to do.

**Optional reference:** **`MAIN_PAGE_REQUIREMENTS.md`** (and any Set List requirements docs) list the intended features and behavior; use them to ensure no major features are missing from the help.

---

## Checklist

1. **Feature coverage**  
   For every main feature visible in the UI, confirm the help either explains it or explicitly says it’s desktop-only/mobile-only where relevant. In particular:
   - **Default video (star):** Setting or removing the default video via the star (★) button. If the app has this and the help does not mention it, recommend adding a short note (where to find it and what it does).
   - **Loop duration (desktop):** The display of loop duration (e.g. end time − start time) on desktop. If the app shows this and the help does not mention it, recommend adding a brief mention (e.g. where it appears and what it represents).

2. **Button and link labels**  
   Wording in the help must match the app exactly (e.g. “Stop Loop”, “Reset Loop”, “Set”, “Start Loop”, “Set from Video” where shown, “Save Loop”, “Saved Loops”, “set list”, etc.).

3. **Desktop vs mobile**  
   The help’s desktop vs mobile differences must match the app: e.g. search box, volume, playback speed UI, loop duration, keyboard shortcuts, and “click” vs “tap” where applicable.

4. **Ranges and formats**  
   Any numbers or formats mentioned in the help (e.g. playback speed 0.5x–2x, MM:SS, target loops range) must match the app’s behavior and UI.

---

## Output

Produce a short report:

- **Correct:** What already matches and is complete.
- **Missing:** Features in the app (especially default video and loop duration) that are not covered in the help, with a concrete suggestion for where/how to add them.
- **Wrong:** Any help text that contradicts the app (wrong labels, ranges, or behavior), with file and approximate location (e.g. “in `App.jsx` help modal, step 5”).

The user may use this report to update the help in `src/App.jsx`; do not make those edits yourself.
