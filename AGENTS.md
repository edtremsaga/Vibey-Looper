# AGENTS.md — Music Looper

Instructions for AI coding agents (Codex, Cursor, etc.) working in this repository.

This file defines architectural guardrails and constraints. Follow these rules unless the user explicitly instructs otherwise.

---

# Project Overview

Music Looper is a **React + Vite client application** that loads YouTube videos and allows musicians to loop sections for practice.

Primary workflow:

1. Load a YouTube video
2. Set loop start and end markers
3. Repeat loop for practice

The looper behavior is already implemented and must remain stable.

---

# Critical Architecture Rules

## 1. Video loading pipeline

All videos must be loaded through the existing function:

handleVideoIdChange(...)

Do NOT create a second loading path.

Do NOT bypass this function.

This function is responsible for:

- updating videoId state
- triggering player load
- resetting start time to 0
- recalculating video duration
- preserving looper behavior

Search results, recent videos, and manual URL paste must all use this same loading path.

---

## 2. Looper behavior must not change

Do NOT modify:

loop start logic  
loop end logic  
duration detection  
player initialization  
saved loop loading  
recent video loading  

Loading a video should always produce:

start = beginning of video  
end = end of video (calculated duration)

---

## 3. YouTube API security

The YouTube API key must NEVER appear in client code.

Search must use a server-side endpoint.

Use environment variables:

Development:
local environment variable

Production:
Vercel environment variable

Do NOT expose the key in frontend JavaScript.

---

# Search Feature Implementation Rules

The search feature should:

- appear in the existing search section
- show results inline
- allow Enter to run search
- allow button click to run search

When a search result is clicked:

1. Load the video immediately
2. Collapse the results list
3. Populate the URL field
4. Show a short message:

Loaded: <video title>

This message should disappear automatically.

Search result click must call:

handleVideoIdChange()

---

# Scope Control

Do NOT:

- redesign the UI
- refactor unrelated files
- change component structure unnecessarily
- introduce new frameworks

Make minimal, targeted changes only.

---

# Development Commands

Install:

npm install

Run Vite frontend only:

npm run dev

Note:

- `npm run dev` runs the Vite frontend only.
- It does NOT expose `/api` routes.
- Features that depend on Vercel serverless functions, including YouTube search, require running the project with Vercel locally.

Create `.env.local` in the repo root with:

YOUTUBE_API_KEY=your_youtube_data_api_key

Run local development with Vercel:

npx vercel dev

This runs both the Vite app and the `/api` serverless functions locally.

Build:

npm run build

---

# Coding Style

Prefer:

- small focused functions
- clear variable names
- minimal dependencies
- readable React state management

Avoid large refactors unless explicitly requested.

---

# Implementation Strategy

Before writing code:

1. Analyze the existing video loading pipeline
2. Identify the insertion point for search
3. Implement the smallest working solution
4. Preserve current behavior
