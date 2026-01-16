// Helper functions for localStorage operations
import { extractVideoId } from './helpers.js'

// Helper function to save recent video to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveRecentVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    // Validate videoId before saving (security: prevent invalid data storage)
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      console.warn('Invalid videoId provided to saveRecentVideo:', videoId)
      // Return existing data instead of saving invalid data
      return loadRecentVideos()
    }
    
    // Sanitize inputs before saving
    const sanitized = {
      videoId, // Already validated above
      title: typeof title === 'string' ? title.substring(0, 200) : '',
      author: typeof author === 'string' ? author.substring(0, 100) : '',
      thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://')
        ? thumbnail.substring(0, 500)
        : '',
      timestamp: Date.now()
    }
    
    const recent = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    const newRecent = [
      sanitized,
      ...recent.filter(v => v.videoId !== videoId)
    ].slice(0, 100) // Keep last 100
    localStorage.setItem('recentVideos', JSON.stringify(newRecent))
    return newRecent
  } catch (error) {
    console.warn('Failed to save recent video:', error)
    return []
  }
}

// Security: Validate recent video data structure to prevent data poisoning
const validateRecentVideo = (video) => {
  // Basic structure check
  if (!video || typeof video !== 'object') {
    return null
  }
  
  // Video ID is required and must be valid (11 characters, alphanumeric)
  if (!video.videoId || typeof video.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(video.videoId)) {
    return null
  }
  
  // Return validated and sanitized video object
  // Optional fields with defaults and length limits (truncate if too long)
  return {
    videoId: video.videoId, // Already validated above
    title: typeof video.title === 'string' && video.title.length > 0
      ? video.title.substring(0, 200) // Truncate to 200 chars
      : '',
    author: typeof video.author === 'string' && video.author.length > 0
      ? video.author.substring(0, 100) // Truncate to 100 chars
      : '',
    thumbnail: typeof video.thumbnail === 'string' && 
               video.thumbnail.length > 0 &&
               video.thumbnail.startsWith('https://')
      ? video.thumbnail.substring(0, 500) // Truncate to 500 chars
      : '',
    timestamp: typeof video.timestamp === 'number' && video.timestamp > 0
      ? video.timestamp
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to load recent videos from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadRecentVideos = () => {
  try {
    const data = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Invalid recent videos data structure, resetting to empty array')
      return []
    }
    
    // Validate and filter out invalid entries
    // This silently removes corrupted or malicious data
    const validated = data
      .map(validateRecentVideo)
      .filter(video => video !== null) // Remove invalid entries
      .slice(0, 100) // Enforce maximum limit
    
    // Log if entries were filtered out (for debugging)
    if (validated.length < data.length) {
      console.warn(`Filtered out ${data.length - validated.length} invalid recent video entries`)
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load recent videos:', error)
    return []
  }
}

// Helper function to delete a recent video by videoId
export const deleteRecentVideo = (videoId) => {
  try {
    // Validate videoId before deleting
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      console.warn('Invalid videoId provided to deleteRecentVideo:', videoId)
      return loadRecentVideos() // Return current valid state
    }
    
    const recent = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    const filtered = recent.filter(v => v.videoId !== videoId)
    localStorage.setItem('recentVideos', JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.warn('Failed to delete recent video:', error)
    return loadRecentVideos() // Return current valid state on error
  }
}

// Helper function to save user's default video to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveDefaultVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    // Validate videoId before saving (security: prevent invalid data storage)
    const extractedId = extractVideoId(videoId)
    if (!extractedId || extractedId.length !== 11) {
      console.warn('Invalid videoId provided to saveDefaultVideo:', videoId)
      return null // Return null to indicate failure
    }
    
    // Validate URL is provided and is a string
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      console.warn('Invalid URL provided to saveDefaultVideo')
      return null
    }
    
    // Sanitize inputs before saving
    const defaultVideo = {
      videoId: extractedId, // Already validated above
      url: videoId.trim().substring(0, 500), // Sanitize URL length
      title: typeof title === 'string' ? title.substring(0, 200) : '',
      author: typeof author === 'string' ? author.substring(0, 100) : '',
      thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://')
        ? thumbnail.substring(0, 500)
        : '',
      timestamp: Date.now()
    }
    
    localStorage.setItem('defaultVideo', JSON.stringify(defaultVideo))
    return defaultVideo
  } catch (error) {
    console.warn('Failed to save default video:', error)
    return null
  }
}

// Security: Validate default video data structure to prevent data poisoning
const validateDefaultVideo = (video) => {
  // Basic structure check
  if (!video || typeof video !== 'object') {
    return null
  }
  
  // Video ID is required and must be valid (11 characters, alphanumeric)
  if (!video.videoId || typeof video.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(video.videoId)) {
    return null
  }
  
  // URL is required (can be full URL or just video ID)
  if (!video.url || typeof video.url !== 'string' || video.url.trim() === '') {
    return null
  }
  
  // Return validated and sanitized default video object
  return {
    videoId: video.videoId, // Already validated above
    url: video.url.trim().substring(0, 500), // Sanitize URL length
    title: typeof video.title === 'string' && video.title.length > 0
      ? video.title.substring(0, 200) // Truncate to 200 chars
      : '',
    author: typeof video.author === 'string' && video.author.length > 0
      ? video.author.substring(0, 100) // Truncate to 100 chars
      : '',
    thumbnail: typeof video.thumbnail === 'string' && 
               video.thumbnail.length > 0 &&
               video.thumbnail.startsWith('https://')
      ? video.thumbnail.substring(0, 500) // Truncate to 500 chars
      : '',
    timestamp: typeof video.timestamp === 'number' && video.timestamp > 0
      ? video.timestamp
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to load user's default video from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadDefaultVideo = () => {
  try {
    const stored = localStorage.getItem('defaultVideo')
    if (!stored) {
      return null
    }
    
    const data = JSON.parse(stored)
    
    // Validate and sanitize the data
    const validated = validateDefaultVideo(data)
    
    if (!validated) {
      console.warn('Invalid default video data structure, clearing')
      // Clear invalid data
      localStorage.removeItem('defaultVideo')
      return null
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load default video:', error)
    // Clear corrupted data
    try {
      localStorage.removeItem('defaultVideo')
    } catch (clearError) {
      // Ignore errors when clearing
    }
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

// Security: Validate saved loop data structure to prevent data poisoning
const validateSavedLoop = (loop) => {
  // Basic structure check
  if (!loop || typeof loop !== 'object') {
    return null
  }
  
  // Video ID is required and must be valid (11 characters, alphanumeric)
  if (!loop.videoId || typeof loop.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(loop.videoId)) {
    return null
  }
  
  // URL is required
  if (!loop.url || typeof loop.url !== 'string' || loop.url.trim() === '') {
    return null
  }
  
  // Start time: must be number, 0-86400 (24 hours max)
  const startTime = typeof loop.startTime === 'number' && loop.startTime >= 0 && loop.startTime <= 86400
    ? loop.startTime
    : null
  if (startTime === null) return null
  
  // End time: must be number, 0-86400, and > startTime
  const endTime = typeof loop.endTime === 'number' && loop.endTime > startTime && loop.endTime <= 86400
    ? loop.endTime
    : null
  if (endTime === null) return null
  
  // Target loops: must be number, 1-10000
  const targetLoops = typeof loop.targetLoops === 'number' && loop.targetLoops >= 1 && loop.targetLoops <= 10000
    ? loop.targetLoops
    : null
  if (targetLoops === null) return null
  
  // Return validated and sanitized saved loop object
  return {
    id: typeof loop.id === 'string' && loop.id.length > 0
      ? loop.id.substring(0, 100) // Unique ID
      : `${loop.videoId}-${Date.now()}`, // Generate ID if missing
    videoId: loop.videoId, // Already validated above
    url: loop.url.trim().substring(0, 500), // Sanitize URL length
    startTime, // Already validated above
    endTime, // Already validated above
    targetLoops, // Already validated above
    playbackSpeed: typeof loop.playbackSpeed === 'number' && loop.playbackSpeed >= 0.25 && loop.playbackSpeed <= 2.0
      ? loop.playbackSpeed
      : 1, // Default to 1x if invalid
    title: typeof loop.title === 'string' && loop.title.length > 0
      ? loop.title.substring(0, 200) // Truncate to 200 chars
      : '',
    author: typeof loop.author === 'string' && loop.author.length > 0
      ? loop.author.substring(0, 100) // Truncate to 100 chars
      : '',
    thumbnail: typeof loop.thumbnail === 'string' && 
               loop.thumbnail.length > 0 &&
               loop.thumbnail.startsWith('https://')
      ? loop.thumbnail.substring(0, 500) // Truncate to 500 chars
      : '',
    timestamp: typeof loop.timestamp === 'number' && loop.timestamp > 0
      ? loop.timestamp
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to save a loop configuration to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveSavedLoop = (videoId, startTime, endTime, targetLoops, playbackSpeed = 1, title = '', author = '', thumbnail = '') => {
  try {
    // Validate videoId
    const extractedId = extractVideoId(videoId)
    if (!extractedId || extractedId.length !== 11) {
      console.warn('Invalid videoId provided to saveSavedLoop:', videoId)
      return null
    }
    
    // Validate URL
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      console.warn('Invalid URL provided to saveSavedLoop')
      return null
    }
    
    // Validate times
    if (typeof startTime !== 'number' || startTime < 0 || startTime > 86400) {
      console.warn('Invalid startTime provided to saveSavedLoop:', startTime)
      return null
    }
    
    if (typeof endTime !== 'number' || endTime <= startTime || endTime > 86400) {
      console.warn('Invalid endTime provided to saveSavedLoop:', endTime)
      return null
    }
    
    // Validate target loops
    if (typeof targetLoops !== 'number' || targetLoops < 1 || targetLoops > 10000) {
      console.warn('Invalid targetLoops provided to saveSavedLoop:', targetLoops)
      return null
    }
    
    // Validate playback speed
    if (typeof playbackSpeed !== 'number' || playbackSpeed < 0.25 || playbackSpeed > 2.0) {
      playbackSpeed = 1 // Default to 1x if invalid
    }
    
    // Create saved loop object
    const savedLoop = {
      id: `${extractedId}-${Date.now()}`, // Unique ID
      videoId: extractedId,
      url: videoId.trim().substring(0, 500),
      startTime,
      endTime,
      targetLoops,
      playbackSpeed,
      title: typeof title === 'string' ? title.substring(0, 200) : '',
      author: typeof author === 'string' ? author.substring(0, 100) : '',
      thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://')
        ? thumbnail.substring(0, 500)
        : '',
      timestamp: Date.now()
    }
    
    // Load existing saved loops
    const savedLoops = JSON.parse(localStorage.getItem('savedLoops') || '[]')
    
    // Add new loop to the beginning (most recent first)
    const newSavedLoops = [savedLoop, ...savedLoops].slice(0, 100) // Keep max 100 saved loops
    
    localStorage.setItem('savedLoops', JSON.stringify(newSavedLoops))
    return savedLoop
  } catch (error) {
    console.warn('Failed to save loop:', error)
    return null
  }
}

// Helper function to load saved loops from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadSavedLoops = () => {
  try {
    const data = JSON.parse(localStorage.getItem('savedLoops') || '[]')
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Invalid saved loops data structure, resetting to empty array')
      return []
    }
    
    // Validate and filter out invalid entries
    const validated = data
      .map(validateSavedLoop)
      .filter(loop => loop !== null) // Remove invalid entries
      .slice(0, 100) // Enforce maximum limit
    
    // Log if entries were filtered out (for debugging)
    if (validated.length < data.length) {
      console.warn(`Filtered out ${data.length - validated.length} invalid saved loop entries`)
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load saved loops:', error)
    return []
  }
}

// Helper function to delete a saved loop by ID
export const deleteSavedLoop = (loopId) => {
  try {
    const savedLoops = JSON.parse(localStorage.getItem('savedLoops') || '[]')
    const filtered = savedLoops.filter(loop => loop.id !== loopId)
    localStorage.setItem('savedLoops', JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.warn('Failed to delete saved loop:', error)
    return loadSavedLoops() // Return current valid state on error
  }
}

// Helper function to save set list to localStorage
// Set list is an array of saved loop items (with their full data)
export const saveSetList = (setList) => {
  try {
    // Validate that setList is an array
    if (!Array.isArray(setList)) {
      console.warn('Invalid set list data structure')
      return false
    }
    
    // Validate each item in the set list
    const validated = setList
      .map(item => {
        // Each item should have at least videoId
        if (!item || typeof item !== 'object' || !item.videoId) {
          return null
        }
        return item
      })
      .filter(item => item !== null)
    
    localStorage.setItem('setList', JSON.stringify(validated))
    return true
  } catch (error) {
    console.warn('Failed to save set list:', error)
    return false
  }
}

// Helper function to load set list from localStorage
export const loadSetList = () => {
  try {
    const data = JSON.parse(localStorage.getItem('setList') || '[]')
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Invalid set list data structure, resetting to empty array')
      return []
    }
    
    // Filter out invalid entries (must have videoId)
    const validated = data.filter(item => 
      item && typeof item === 'object' && item.videoId
    )
    
    return validated
  } catch (error) {
    console.warn('Failed to load set list:', error)
    return []
  }
}

// Security: Validate saved set list data structure to prevent data poisoning
const validateSavedSetList = (savedSetList) => {
  // Basic structure check
  if (!savedSetList || typeof savedSetList !== 'object') {
    return null
  }
  
  // ID is required
  if (!savedSetList.id || typeof savedSetList.id !== 'string' || savedSetList.id.trim() === '') {
    return null
  }
  
  // Name is required and must be valid
  if (!savedSetList.name || typeof savedSetList.name !== 'string' || savedSetList.name.trim() === '') {
    return null
  }
  
  // Songs must be an array
  if (!Array.isArray(savedSetList.songs)) {
    return null
  }
  
  // Validate each song in the array
  const validatedSongs = savedSetList.songs
    .map(song => {
      if (!song || typeof song !== 'object' || !song.videoId) {
        return null
      }
      // Validate videoId format
      if (typeof song.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(song.videoId)) {
        return null
      }
      return song
    })
    .filter(song => song !== null)
  
  // Return validated and sanitized saved set list object
  return {
    id: savedSetList.id.substring(0, 100), // Sanitize ID length
    name: savedSetList.name.trim().substring(0, 50), // Sanitize name (max 50 chars)
    songs: validatedSongs,
    createdAt: typeof savedSetList.createdAt === 'number' && savedSetList.createdAt > 0
      ? savedSetList.createdAt
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to save a named set list to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveSavedSetList = (name, songs) => {
  try {
    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.warn('Invalid name provided to saveSavedSetList')
      return null
    }
    
    // Validate and sanitize name (max 50 characters)
    const sanitizedName = name.trim().substring(0, 50)
    
    // Validate songs array
    if (!Array.isArray(songs) || songs.length === 0) {
      console.warn('Invalid or empty songs array provided to saveSavedSetList')
      return null
    }
    
    // Validate each song has required fields
    const validatedSongs = songs.filter(song => 
      song && typeof song === 'object' && song.videoId
    )
    
    if (validatedSongs.length === 0) {
      console.warn('No valid songs in array provided to saveSavedSetList')
      return null
    }
    
    // Create saved set list object
    const savedSetList = {
      id: `setlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      name: sanitizedName,
      songs: validatedSongs,
      createdAt: Date.now()
    }
    
    // Load existing saved set lists
    const savedSetLists = JSON.parse(localStorage.getItem('savedSetLists') || '[]')
    
    // Add new set list to the beginning (most recent first)
    const newSavedSetLists = [savedSetList, ...savedSetLists].slice(0, 100) // Keep max 100 saved set lists
    
    localStorage.setItem('savedSetLists', JSON.stringify(newSavedSetLists))
    return savedSetList
  } catch (error) {
    console.warn('Failed to save saved set list:', error)
    return null
  }
}

// Helper function to update an existing saved set list
export const updateSavedSetList = (id, name, songs) => {
  try {
    // Validate inputs (same as saveSavedSetList)
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.warn('Invalid id provided to updateSavedSetList')
      return null
    }
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.warn('Invalid name provided to updateSavedSetList')
      return null
    }
    
    const sanitizedName = name.trim().substring(0, 50)
    
    if (!Array.isArray(songs) || songs.length === 0) {
      console.warn('Invalid or empty songs array provided to updateSavedSetList')
      return null
    }
    
    const validatedSongs = songs.filter(song => 
      song && typeof song === 'object' && song.videoId
    )
    
    if (validatedSongs.length === 0) {
      console.warn('No valid songs in array provided to updateSavedSetList')
      return null
    }
    
    // Load existing saved set lists
    const savedSetLists = JSON.parse(localStorage.getItem('savedSetLists') || '[]')
    
    // Find and update the set list
    const updatedSetLists = savedSetLists.map(setList => {
      if (setList.id === id) {
        return {
          ...setList,
          name: sanitizedName,
          songs: validatedSongs,
          createdAt: setList.createdAt // Keep original creation time
        }
      }
      return setList
    })
    
    // Check if set list was found
    const found = savedSetLists.some(setList => setList.id === id)
    if (!found) {
      console.warn('Set list with id not found:', id)
      return null
    }
    
    localStorage.setItem('savedSetLists', JSON.stringify(updatedSetLists))
    return updatedSetLists.find(setList => setList.id === id)
  } catch (error) {
    console.warn('Failed to update saved set list:', error)
    return null
  }
}

// Helper function to load saved set lists from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadSavedSetLists = () => {
  try {
    const data = JSON.parse(localStorage.getItem('savedSetLists') || '[]')
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Invalid saved set lists data structure, resetting to empty array')
      return []
    }
    
    // Validate and filter out invalid entries
    const validated = data
      .map(validateSavedSetList)
      .filter(setList => setList !== null) // Remove invalid entries
      .slice(0, 100) // Enforce maximum limit
    
    // Log if entries were filtered out (for debugging)
    if (validated.length < data.length) {
      console.warn(`Filtered out ${data.length - validated.length} invalid saved set list entries`)
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load saved set lists:', error)
    return []
  }
}

// Helper function to delete a saved set list by ID
export const deleteSavedSetList = (id) => {
  try {
    // Validate id
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.warn('Invalid id provided to deleteSavedSetList')
      return loadSavedSetLists() // Return current valid state
    }
    
    const savedSetLists = JSON.parse(localStorage.getItem('savedSetLists') || '[]')
    const filtered = savedSetLists.filter(setList => setList.id !== id)
    localStorage.setItem('savedSetLists', JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.warn('Failed to delete saved set list:', error)
    return loadSavedSetLists() // Return current valid state on error
  }
}
