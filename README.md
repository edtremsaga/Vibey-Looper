# YouTube Loop Practice

A web app for looping specific segments of YouTube videos for practice or study.

## Features

- Load YouTube videos by URL or Video ID
- Set custom start and end times
- Set target number of loops
- Automatically seeks back to start time when end time is reached
- Tracks loop count and stops when target is reached
- Clean, dark-themed UI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown (usually `http://localhost:5173`)

## Usage

1. Enter a YouTube URL or Video ID in the input field
2. Set your desired start time (in seconds)
3. Set your desired end time (in seconds)
4. Set the target number of loops
5. Click "Start Loop" to begin
6. The video will automatically loop between your start and end times
7. Click "Stop" to pause, or "Reset" to return to the start

## Tech Stack

- React 18
- Vite
- YouTube IFrame Player API

