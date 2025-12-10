// Helper functions for time conversion and video ID extraction

// Convert seconds to MM:SS format
export const secondsToMMSS = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Convert MM:SS format or plain number to seconds
export const mmssToSeconds = (input) => {
  if (!input || input.trim() === '') return 0
  
  // Handle plain number (seconds)
  if (/^\d+$/.test(input.trim())) {
    return parseFloat(input.trim())
  }
  
  // Handle MM:SS format
  const parts = input.trim().split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0
    const seconds = parseFloat(parts[1]) || 0
    return minutes * 60 + seconds
  }
  
  // Fallback to parsing as seconds
  return parseFloat(input) || 0
}

// Extract video ID from YouTube URL or return ID if already extracted
export const extractVideoId = (input) => {
  if (!input) return ''
  
  // If it's already just an ID (11 characters, alphanumeric)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim()
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  
  return input.trim()
}

// Get user-friendly error message from YouTube error code
export const getYouTubeErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 2:
      return 'Invalid video ID. Please check the URL or Video ID.'
    case 5:
      return 'The HTML5 player cannot be found. Please refresh the page.'
    case 100:
      return 'Video not found. It may have been removed or made private.'
    case 101:
    case 150:
      return 'Video is not available for embedding. It may be private or restricted.'
    default:
      return 'Failed to load video. Please check the URL or Video ID and try again.'
  }
}

