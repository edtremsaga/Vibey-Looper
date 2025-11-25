# Vibey YouTube Loop Practice 🎵

A modern, beautiful web application for looping specific segments of YouTube videos for practice, study, or enjoyment. Built with React, Vite, and the YouTube IFrame Player API.

![Vibey Looper](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

- 🎬 **YouTube Video Integration** - Load any YouTube video by URL or Video ID
- ⏱️ **MM:SS Time Format** - Set start and end times in an intuitive minutes:seconds format
- 🔁 **Automatic Looping** - Seamlessly loops between your specified times
- 📊 **Progress Tracking** - Visual progress bar and loop counter with percentage complete
- ⌨️ **Keyboard Shortcuts** - Quick controls with Spacebar, R, and Esc keys
- ✅ **Input Validation** - Smart validation with helpful error messages
- 🎉 **Completion Notification** - Animated celebration when target loops are reached
- 🎨 **Modern UI** - Beautiful glassmorphism effects, animated gradients, and smooth transitions
- 📱 **Responsive Design** - Works great on desktop and mobile devices
- ❓ **Built-in Help** - Comprehensive help modal with instructions and keyboard shortcuts

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/edtremsaga/Vibey-Looper.git
cd Vibey-Looper
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown (usually `http://localhost:5173`)

## 📖 Usage

### Basic Usage

1. **Enter a YouTube Video**: Paste a YouTube URL or enter a Video ID in the input field at the top
2. **Set Loop Times**: 
   - Enter start time in MM:SS format (e.g., `0:46` for 46 seconds, `1:02` for 1 minute 2 seconds)
   - Enter end time in MM:SS format (e.g., `1:30` for 1 minute 30 seconds)
3. **Set Target Loops**: Enter how many times you want the video to loop
4. **Start Looping**: Click the green "Start Loop" button
5. **Watch it Loop**: The video automatically seeks back to the start when it reaches the end time

### Keyboard Shortcuts

- **Spacebar** - Start/Stop looping
- **R** - Reset to start time
- **Esc** - Close help modal

### Tips

- You can also enter plain numbers (like `46`) which will be treated as seconds
- The progress bar shows your position within the loop segment
- Current playback time is displayed in real-time while looping
- The app automatically stops when your target number of loops is reached

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **YouTube IFrame Player API** - Video playback and control
- **CSS3** - Modern styling with animations and gradients

## 📁 Project Structure

```
Vibey-Looper/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## 🎨 Features in Detail

### Progress Tracking
- Visual progress bar showing position within the loop segment
- Real-time current playback time display
- Overall loop progress percentage (e.g., "Loop 3/5 (60%)")

### Smart Validation
- Automatic validation of start/end times
- Clear error messages for invalid inputs
- Disabled states for controls when validation fails

### Modern UI/UX
- Animated gradient backgrounds
- Glassmorphism (frosted glass) effects on inputs
- Glowing button effects with smooth transitions
- Loading indicators and completion animations
- Responsive design for all screen sizes

## 🐛 Troubleshooting

### Video Won't Load
- Make sure the YouTube video is embeddable (some videos have embedding disabled)
- Check that you've entered a valid YouTube URL or Video ID
- Ensure you have a stable internet connection

### Loop Not Working
- Verify that your end time is greater than your start time
- Make sure the video has loaded completely before starting
- Check the browser console for any error messages

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open an issue for bugs or feature requests
- Submit a pull request with improvements
- Share feedback or suggestions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Vibey Craft**
- GitHub: [@edtremsaga](https://github.com/edtremsaga)

## 🙏 Acknowledgments

- YouTube IFrame Player API for video functionality
- React team for the amazing framework
- Vite for the excellent development experience

---

Made with ❤️ by Vibey Craft
