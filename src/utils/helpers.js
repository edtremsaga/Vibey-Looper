// Helper functions for time conversion and video ID extraction
import { TIME_LIMITS } from './constants.js'

// Convert seconds to MM:SS format
export const secondsToMMSS = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Normalize MM:SS format - converts invalid seconds (>59) to valid MM:SS
// Example: "0:75" → "1:15", "2:90" → "3:30"
export const normalizeMMSS = (input) => {
  if (!input || input.trim() === '') return input
  
  const trimmed = input.trim()
  
  // Only normalize if it's in MM:SS format (has a colon)
  const parts = trimmed.split(':')
  if (parts.length !== 2) {
    // Not MM:SS format, return as-is
    return input
  }
  
  const minutesStr = parts[0].trim()
  const secondsStr = parts[1].trim()
  
  // Parse minutes and seconds
  const minutes = parseInt(minutesStr) || 0
  const seconds = parseFloat(secondsStr) || 0
  
  // If seconds are already valid (0-59), no normalization needed
  if (seconds >= 0 && seconds < 60) {
    return input
  }
  
  // Normalize: convert excess seconds to minutes
  const totalSeconds = minutes * 60 + seconds
  const normalizedMinutes = Math.floor(totalSeconds / 60)
  const normalizedSeconds = Math.floor(totalSeconds % 60)
  
  // Return normalized MM:SS format
  return `${normalizedMinutes}:${normalizedSeconds.toString().padStart(2, '0')}`
}

// Convert MM:SS format or plain number to seconds
// Security: Validates and limits input to prevent DoS attacks via extremely large values
export const mmssToSeconds = (input) => {
  if (!input || input.trim() === '') return 0
  
  // Security: Maximum reasonable value (24 hours = 86400 seconds)
  // This prevents DoS attacks via extremely large time values
  const MAX_SECONDS = TIME_LIMITS.MAX_SECONDS
  
  const trimmed = input.trim()
  
  // Handle plain number (seconds) - must be all digits
  if (/^-?\d+$/.test(trimmed)) {
    const seconds = parseFloat(trimmed)
    // Clamp to valid range: 0 to MAX_SECONDS
    if (seconds > MAX_SECONDS) return MAX_SECONDS
    if (seconds < 0) return 0
    return seconds
  }
  
  // Handle MM:SS format (or negative MM:SS)
  const parts = trimmed.split(':')
  if (parts.length === 2) {
    // Check if minutes part is negative
    const minutesStr = parts[0].trim()
    const isNegative = minutesStr.startsWith('-')
    const minutes = Math.abs(parseInt(minutesStr) || 0)
    const seconds = Math.max(0, parseFloat(parts[1]) || 0)
    
    // If negative, return 0
    if (isNegative) return 0
    
    const total = minutes * 60 + seconds
    // Clamp to valid range: 0 to MAX_SECONDS
    return Math.min(total, MAX_SECONDS)
  }
  
  // Fallback to parsing as seconds (handles decimals, negatives, etc.)
  const result = parseFloat(trimmed) || 0
  // Clamp to valid range: 0 to MAX_SECONDS
  return Math.max(0, Math.min(result, MAX_SECONDS))
}

// Extract video ID from YouTube URL or return ID if already extracted
// Security: Returns empty string if input cannot be validated as a valid YouTube video ID
export const extractVideoId = (input) => {
  if (!input) return ''
  
  // Strict validation: YouTube video IDs are exactly 11 alphanumeric characters (plus _ and -)
  const strictIdPattern = /^[a-zA-Z0-9_-]{11}$/
  
  const trimmed = input.trim()
  
  // If it's already just a valid ID (11 characters, alphanumeric)
  if (strictIdPattern.test(trimmed)) {
    return trimmed
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match && match[1] && strictIdPattern.test(match[1])) {
      return match[1]
    }
  }
  
  // Security fix: Return empty string instead of untrusted input
  // This prevents injection of invalid data when extraction fails
  return ''
}

// Get user-friendly error message from YouTube error code
export const getYouTubeErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 2:
      return 'Invalid video ID. Please check the URL or Video ID. You can also use the search box above to find videos.'
    case 5:
      return 'Video player error. Please refresh the page (F5 or Cmd+R) to reload the player.'
    case 100:
      return 'Video not found. The video may have been removed, made private, or the URL is incorrect. Try searching for the video using the search box above, or check the URL.'
    case 101:
    case 150:
      return 'Video is not available. This video is private or restricted and cannot be played. Try a different video that is publicly available.'
    default:
      return 'Failed to load video. Please check the URL or Video ID and try again. You can also use the search box above to find videos.'
  }
}

