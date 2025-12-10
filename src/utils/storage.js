// Helper functions for localStorage operations
import { extractVideoId } from './helpers.js'

// Helper function to save recent video to localStorage
export const saveRecentVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    const recent = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    const newRecent = [
      { videoId, title, author, thumbnail, timestamp: Date.now() },
      ...recent.filter(v => v.videoId !== videoId)
    ].slice(0, 30) // Keep last 30
    localStorage.setItem('recentVideos', JSON.stringify(newRecent))
    return newRecent
  } catch (error) {
    console.warn('Failed to save recent video:', error)
    return []
  }
}

// Helper function to load recent videos from localStorage
export const loadRecentVideos = () => {
  try {
    return JSON.parse(localStorage.getItem('recentVideos') || '[]')
  } catch (error) {
    console.warn('Failed to load recent videos:', error)
    return []
  }
}

// Helper function to save user's default video to localStorage
export const saveDefaultVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    const defaultVideo = {
      videoId: extractVideoId(videoId),
      url: videoId,
      title,
      author,
      thumbnail,
      timestamp: Date.now()
    }
    localStorage.setItem('defaultVideo', JSON.stringify(defaultVideo))
    return defaultVideo
  } catch (error) {
    console.warn('Failed to save default video:', error)
    return null
  }
}

// Helper function to load user's default video from localStorage
export const loadDefaultVideo = () => {
  try {
    const stored = localStorage.getItem('defaultVideo')
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  } catch (error) {
    console.warn('Failed to load default video:', error)
    return null
  }
}

// Helper function to clear user's default video (reset to app default)
export const clearDefaultVideo = () => {
  try {
    localStorage.removeItem('defaultVideo')
  } catch (error) {
    console.warn('Failed to clear default video:', error)
  }
}

