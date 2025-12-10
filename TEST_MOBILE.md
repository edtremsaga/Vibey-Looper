# Testing Mobile Experience on MacBook

## Quick Guide: Simulate iPhone in Browser

### Option 1: Chrome DevTools (Easiest)

1. **Open your app** in Chrome: http://localhost:5173

2. **Open DevTools:**
   - Press `Cmd + Option + I` (Mac)
   - Or right-click → "Inspect"
   - Or View → Developer → Developer Tools

3. **Enable Device Toolbar:**
   - Click the device icon (📱) in the top-left of DevTools
   - Or press `Cmd + Shift + M`

4. **Select iPhone:**
   - Click the device dropdown (top center)
   - Choose:
     - **iPhone 12 Pro** (recommended)
     - **iPhone SE** (smaller screen)
     - **iPhone 14 Pro Max** (larger screen)

5. **Test the search:**
   - You should see the mobile layout
   - Try typing in the search box
   - Click "Search on YouTube"
   - See how it behaves

---

### Option 2: Safari (Native Mac Browser)

1. **Enable Developer Menu:**
   - Safari → Settings → Advanced
   - Check "Show features for web developers"

2. **Open your app:** http://localhost:5173

3. **Enter Responsive Design Mode:**
   - Develop → Enter Responsive Design Mode
   - Or press `Cmd + Option + R`

4. **Select iPhone:**
   - Use the device dropdown at the top
   - Choose an iPhone model

5. **Test the search feature**

---

### Option 3: Firefox DevTools

1. **Open your app** in Firefox: http://localhost:5173

2. **Open DevTools:** `Cmd + Option + I`

3. **Enable Responsive Design Mode:**
   - Click the device icon (📱)
   - Or press `Cmd + Shift + M`

4. **Select iPhone** from the device dropdown

---

## What to Test

### Layout:
- [ ] Search box is visible and properly sized
- [ ] Button is easy to tap (not too small)
- [ ] Layout looks good on mobile screen
- [ ] Text is readable

### Functionality:
- [ ] Can type in search box
- [ ] Button enables/disables correctly
- [ ] Clicking button opens YouTube search
- [ ] Enter key works to trigger search

### Behavior:
- [ ] Does it open in new tab or same tab?
- [ ] Can you easily navigate back?
- [ ] Is the workflow smooth?

---

## Tips

- **Chrome DevTools** is usually the easiest for this
- You can test different iPhone models
- Try both portrait and landscape orientations
- Test with touch simulation (Chrome has this)

---

## Quick Test Steps

1. Open Chrome
2. Go to http://localhost:5173
3. Press `Cmd + Option + I` (open DevTools)
4. Press `Cmd + Shift + M` (mobile mode)
5. Select "iPhone 12 Pro"
6. Test the search feature!

Let me know what you find!







