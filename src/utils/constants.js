// Application Constants
// Centralized constants to avoid magic numbers throughout the codebase

// Breakpoints (in pixels)
export const BREAKPOINTS = {
  MOBILE: 600,      // Mobile phones
  TABLET: 768,      // Tablets and small screens
  DESKTOP: 1024,    // Desktop screens
  VIDEO: 680,       // Video container breakpoint
}

// Time Limits (in seconds)
export const TIME_LIMITS = {
  MAX_SECONDS: 86400,     // 24 hours maximum
  API_TIMEOUT: 5000,      // 5 seconds for API requests
  DURATION_DELAY: 500,    // Delay to get video duration
  PLAYER_INIT_DELAY: 200, // Delay for player initialization
  CHECK_INTERVAL_FAR: 500, // Check interval when far from end (5+ seconds)
  CHECK_INTERVAL_NEAR: 100, // Check interval when near end (<5 seconds)
}

// Loop Limits
export const LOOP_LIMITS = {
  MAX_LOOPS: 10000,    // Maximum number of loops
  MAX_SAVED_LOOPS: 100, // Maximum saved loops in storage
  MAX_SET_LISTS: 100,   // Maximum saved set lists in storage
}

// String Length Limits
export const STRING_LIMITS = {
  TITLE: 200,        // Maximum title length
  AUTHOR: 100,       // Maximum author length
  URL: 500,          // Maximum URL length
  THUMBNAIL: 500,    // Maximum thumbnail URL length
  ID: 100,           // Maximum ID length
  SET_LIST_NAME: 50, // Maximum set list name length
}

// YouTube Player Dimensions
export const YOUTUBE = {
  PLAYER_WIDTH: 640,
  PLAYER_HEIGHT: 390,
  VIDEO_CONTAINER_WIDTH: 560,
  VIDEO_CONTAINER_HEIGHT: 315,
}

// Default Values
export const DEFAULTS = {
  VOLUME: 75,        // Default volume (0-100)
  TARGET_LOOPS: 5,   // Default number of loops
  START_TIME: 0,     // Default start time
  END_TIME: 10,      // Default end time (10 seconds)
  PLAYBACK_SPEED: 1, // Default playback speed (1x)
}

// Playback Speed Limits
export const PLAYBACK_SPEED = {
  MIN: 0.25,
  MAX: 2.0,
  STEP: 0.05,
}

// Volume Limits
export const VOLUME = {
  MIN: 0,
  MAX: 100,
}

// Z-Index Values
export const Z_INDEX = {
  SKIP_LINK: 10000,
  DROPDOWN: 1000,
  MODAL_OVERLAY: 1000,
}
