# Vibey Looper

A web application for looping YouTube videos to help musicians practice and learn songs by repeating specific sections. Set custom start and end times, control playback speed, and save your loop configurations for quick access.

## Features

### 🎯 Core Functionality
- **Custom Loop Points**: Set precise start and end times in MM:SS format
- **"Set from Video" Buttons**: Capture current video position with a single click to set loop points quickly
- **Target Loop Counter**: Set how many times you want a section to loop and track progress
- **Auto-Seek**: Automatically returns to start time when end time is reached
- **Auto-Stop**: Stops playing when target loop count is reached

### 🎮 Playback Controls
- **Playback Speed**: Adjust video speed from 0.5x to 2x with preset buttons (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- **Fine Speed Control**: Desktop users can use a slider for precise speed adjustment (0.25x - 2.0x)
- **Volume Control**: Desktop-only volume slider (0-100%)
- **Keyboard Shortcuts**:
  - `Spacebar`: Start/Stop looping
  - `R`: Reset to start time
  - `Esc`: Close help modal

### 📚 Video Management
- **Recent Videos**: Automatically saves up to 100 recently viewed videos with thumbnails
- **Saved Loops**: Save complete loop configurations (video, start time, end time, target loops, playback speed)
- **Default Video**: Set a default video that loads when you open the app
- **Quick Access**: Click any recent video or saved loop to instantly load it

### 🎨 User Experience
- **Modern UI**: Punk rock-inspired design with bold typography and high contrast
- **Responsive Design**: Works on desktop and mobile devices
- **Search Integration**: Built-in YouTube search (opens results in new tab)
- **Video Thumbnails**: Visual previews for recent videos and saved loops
- **Progress Tracking**: Visual progress bar showing loop completion percentage

## How to Use

1. **Load a YouTube Video**:
   - Paste a YouTube URL or Video ID into the input field
   - Or use the search box to find videos (opens in new tab)

2. **Set Loop Points**:
   - Enter start and end times manually in MM:SS format (e.g., "1:30" for 1 minute 30 seconds)
   - Or use the "Set from Video" buttons next to Start Time/End Time to capture the current video position
   - The "Set from Video" buttons work whether the video is playing or paused

3. **Configure Loop Settings**:
   - Set your target number of loops
   - Adjust playback speed if desired

4. **Start Looping**:
   - Click "Start Loop" to begin
   - The video will automatically loop between your start and end times
   - Progress is tracked and displayed

5. **Save Your Configuration**:
   - Click "Save Loop" to save your current loop settings
   - Access saved loops anytime from the "Saved Loops" dropdown
   - Click any saved loop to instantly restore all settings

## Technical Details

### Built With
- **React 18** - UI framework
- **Vite** - Build tool and development server
- **YouTube IFrame Player API** - Video playback
- **YouTube oEmbed API** - Video metadata (free, no API key required)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

### Data Storage
- All data (recent videos, saved loops, default video) is stored in browser `localStorage`
- No server-side storage - everything stays in your browser
- Recent videos: up to 100 entries
- Saved loops: unlimited

## Installation

1. Clone the repository:
```bash
git clone https://github.com/edtremsaga/Vibey-Looper.git
cd Vibey-Looper
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
Vibey-Looper/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.jsx         # Application entry point
│   ├── index.css        # Global styles
│   └── utils/
│       ├── helpers.js   # Helper functions (time conversion, video ID extraction)
│       └── storage.js   # localStorage operations
├── dist/                # Production build output
└── package.json         # Project dependencies and scripts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for personal use.

## Acknowledgments

- YouTube IFrame Player API for video playback
- YouTube oEmbed API for video metadata
