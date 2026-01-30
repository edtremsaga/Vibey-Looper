# Error Handling Implementation Guide

## Overview
This guide explains how to implement user-friendly error messages with actionable suggestions, retry buttons, and error recovery options.

---

## Step 1: Create Error Types and Structure

### 1.1 Create Error Types Constant
Create a new file or add to `src/utils/constants.js`:

```javascript
// Error Types
export const ERROR_TYPES = {
  VIDEO_LOAD: 'VIDEO_LOAD',           // Video failed to load
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND', // Video doesn't exist
  VIDEO_PRIVATE: 'VIDEO_PRIVATE',     // Video is private/restricted
  NETWORK: 'NETWORK',                 // Network/API errors
  VALIDATION: 'VALIDATION',           // Input validation errors
  PLAYER: 'PLAYER',                   // Player initialization errors
  TIMEOUT: 'TIMEOUT',                 // Request timeout
  UNKNOWN: 'UNKNOWN'                  // Unknown errors
}

// Error Severity
export const ERROR_SEVERITY = {
  CRITICAL: 'CRITICAL',   // Blocks functionality, needs immediate action
  ERROR: 'ERROR',         // Error occurred but can recover
  WARNING: 'WARNING',    // Warning, functionality may be limited
  INFO: 'INFO'           // Informational message
}
```

### 1.2 Create Error Object Structure
Instead of just storing error strings, store error objects:

```javascript
// Error object structure
{
  type: ERROR_TYPES.VIDEO_NOT_FOUND,
  severity: ERROR_SEVERITY.ERROR,
  message: 'Video not found',
  suggestion: 'Try checking the URL or searching for the video',
  canRetry: true,
  retryAction: () => { /* retry function */ },
  recoverySteps: [
    'Check if the video URL is correct',
    'Try searching for the video using the search box',
    'Verify the video hasn\'t been deleted'
  ]
}
```

---

## Step 2: Create Error Helper Functions

### 2.1 Create Error Utility File
Create `src/utils/errorHelpers.js`:

```javascript
import { ERROR_TYPES, ERROR_SEVERITY } from './constants.js'

/**
 * Creates a structured error object with user-friendly message and suggestions
 */
export const createError = (type, errorCode = null, context = {}) => {
  const errorMap = {
    [ERROR_TYPES.VIDEO_NOT_FOUND]: {
      severity: ERROR_SEVERITY.ERROR,
      message: 'Video not found',
      suggestion: 'The video may have been removed or the URL is incorrect.',
      canRetry: true,
      recoverySteps: [
        'Double-check the video URL or Video ID',
        'Try searching for the video using the search box above',
        'Verify the video hasn\'t been deleted or made private',
        'Check your internet connection'
      ]
    },
    [ERROR_TYPES.VIDEO_PRIVATE]: {
      severity: ERROR_SEVERITY.ERROR,
      message: 'Video is not available',
      suggestion: 'This video is private or restricted and cannot be played.',
      canRetry: false,
      recoverySteps: [
        'This video requires special permissions to view',
        'Try a different video that is publicly available',
        'Contact the video owner if you need access'
      ]
    },
    [ERROR_TYPES.NETWORK]: {
      severity: ERROR_SEVERITY.ERROR,
      message: 'Connection problem',
      suggestion: 'Unable to connect to YouTube. Please check your internet connection.',
      canRetry: true,
      recoverySteps: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ]
    },
    [ERROR_TYPES.PLAYER]: {
      severity: ERROR_SEVERITY.CRITICAL,
      message: 'Video player error',
      suggestion: 'The video player failed to initialize. Please refresh the page.',
      canRetry: true,
      recoverySteps: [
        'Refresh the page (F5 or Cmd+R)',
        'Clear your browser cache and try again',
        'Try a different browser',
        'Check if JavaScript is enabled'
      ]
    },
    [ERROR_TYPES.TIMEOUT]: {
      severity: ERROR_SEVERITY.ERROR,
      message: 'Request timed out',
      suggestion: 'The request took too long. Your connection might be slow.',
      canRetry: true,
      recoverySteps: [
        'Check your internet connection speed',
        'Wait a moment and try again',
        'Try refreshing the page'
      ]
    },
    [ERROR_TYPES.VALIDATION]: {
      severity: ERROR_SEVERITY.WARNING,
      message: context.message || 'Invalid input',
      suggestion: context.suggestion || 'Please check your input and try again.',
      canRetry: false,
      recoverySteps: context.recoverySteps || []
    },
    [ERROR_TYPES.UNKNOWN]: {
      severity: ERROR_SEVERITY.ERROR,
      message: 'Something went wrong',
      suggestion: 'An unexpected error occurred. Please try again.',
      canRetry: true,
      recoverySteps: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the problem persists'
      ]
    }
  }

  const errorConfig = errorMap[type] || errorMap[ERROR_TYPES.UNKNOWN]
  
  return {
    type,
    severity: errorConfig.severity,
    message: errorConfig.message,
    suggestion: errorConfig.suggestion,
    canRetry: errorConfig.canRetry,
    recoverySteps: errorConfig.recoverySteps,
    timestamp: Date.now(),
    errorCode, // Original error code if available
    ...context // Additional context
  }
}

/**
 * Maps YouTube error codes to error types
 */
export const mapYouTubeError = (errorCode) => {
  const errorCodeMap = {
    2: ERROR_TYPES.VALIDATION,      // Invalid video ID
    5: ERROR_TYPES.PLAYER,          // HTML5 player error
    100: ERROR_TYPES.VIDEO_NOT_FOUND, // Video not found
    101: ERROR_TYPES.VIDEO_PRIVATE,   // Not available for embedding
    150: ERROR_TYPES.VIDEO_PRIVATE,  // Not available for embedding
  }
  
  return errorCodeMap[errorCode] || ERROR_TYPES.UNKNOWN
}

/**
 * Maps validation errors to error types
 */
export const mapValidationError = (errorMessage, context = {}) => {
  if (errorMessage.includes('End time must be greater')) {
    return createError(ERROR_TYPES.VALIDATION, null, {
      message: 'Invalid loop times',
      suggestion: 'The end time must be after the start time.',
      recoverySteps: [
        'Make sure the end time is greater than the start time',
        'Use the "Set from Video" buttons to capture times accurately',
        'Check that times are in MM:SS format (e.g., 1:30)'
      ]
    })
  }
  
  if (errorMessage.includes('video duration')) {
    return createError(ERROR_TYPES.VALIDATION, null, {
      message: 'Time exceeds video length',
      suggestion: `The ${context.field || 'time'} you entered is longer than the video.`,
      recoverySteps: [
        `Make sure the ${context.field || 'time'} is within the video duration`,
        'Use the "Set from Video" button to capture the exact time',
        'Check the video duration before setting loop times'
      ]
    })
  }
  
  // Default validation error
  return createError(ERROR_TYPES.VALIDATION, null, {
    message: errorMessage,
    suggestion: 'Please check your input and try again.',
    recoverySteps: []
  })
}
```

---

## Step 3: Update App.jsx State Management

### 3.1 Replace Simple Error State
**Current:**
```javascript
const [validationError, setValidationError] = useState('')
```

**New:**
```javascript
const [error, setError] = useState(null) // null or error object
const [isRetrying, setIsRetrying] = useState(false)
```

### 3.2 Create Error Helper Functions in App.jsx
Add these helper functions:

```javascript
import { createError, mapYouTubeError, mapValidationError, ERROR_TYPES } from './utils/errorHelpers.js'

// Helper to set error
const handleError = (errorType, errorCode = null, context = {}) => {
  const error = createError(errorType, errorCode, context)
  setError(error)
}

// Helper to clear error
const clearError = () => {
  setError(null)
  setIsRetrying(false)
}

// Helper to retry based on error type
const retryError = async () => {
  if (!error || !error.canRetry) return
  
  setIsRetrying(true)
  clearError()
  
  try {
    switch (error.type) {
      case ERROR_TYPES.VIDEO_NOT_FOUND:
      case ERROR_TYPES.NETWORK:
      case ERROR_TYPES.TIMEOUT:
        // Retry loading the video
        if (player && videoId) {
          const extractedId = extractVideoId(videoId)
          if (extractedId) {
            player.loadVideoById(extractedId)
          }
        }
        break
        
      case ERROR_TYPES.PLAYER:
        // Reload the page
        window.location.reload()
        break
        
      default:
        // Generic retry - just clear error
        break
    }
  } catch (retryError) {
    handleError(ERROR_TYPES.UNKNOWN, null, {
      message: 'Retry failed',
      suggestion: 'The retry attempt failed. Please try refreshing the page.'
    })
  } finally {
    setIsRetrying(false)
  }
}
```

---

## Step 4: Update Error Handling Throughout App.jsx

### 4.1 Update YouTube Player Error Handler
**Current:**
```javascript
onError: (event) => {
  setIsLoading(false)
  const errorCode = event.data
  const errorMessage = getYouTubeErrorMessage(errorCode)
  setValidationError(errorMessage)
  playerInitializedRef.current = false
}
```

**New:**
```javascript
onError: (event) => {
  setIsLoading(false)
  const errorCode = event.data
  const errorType = mapYouTubeError(errorCode)
  handleError(errorType, errorCode, {
    videoId: extractVideoId(videoId)
  })
  playerInitializedRef.current = false
}
```

### 4.2 Update Validation Errors
**Current:**
```javascript
if (endTime <= startTime) {
  setValidationError('End time must be greater than start time')
  return
}
```

**New:**
```javascript
if (endTime <= startTime) {
  handleError(ERROR_TYPES.VALIDATION, null, {
    message: 'Invalid loop times',
    suggestion: 'The end time must be after the start time.',
    recoverySteps: [
      'Make sure the end time is greater than the start time',
      'Use the "Set from Video" buttons to capture times accurately'
    ]
  })
  return
}
```

### 4.3 Update Video Duration Validation
**Current:**
```javascript
if (startTime >= videoDuration) {
  setValidationError(`Start time must be less than video duration (${secondsToMMSS(videoDuration)})`)
  return
}
```

**New:**
```javascript
if (startTime >= videoDuration) {
  handleError(ERROR_TYPES.VALIDATION, null, {
    message: 'Start time exceeds video length',
    suggestion: `The start time must be before the video ends (${secondsToMMSS(videoDuration)}).`,
    recoverySteps: [
      `Set start time to less than ${secondsToMMSS(videoDuration)}`,
      'Use the "Set from Video" button to capture the exact time',
      'Check the video duration before setting loop times'
    ],
    field: 'start time',
    maxValue: videoDuration
  })
  return
}
```

### 4.4 Update API Timeout Errors
**Current:**
```javascript
if (error.name === 'AbortError') {
  console.warn('YouTube API request timed out')
}
```

**New:**
```javascript
if (error.name === 'AbortError') {
  handleError(ERROR_TYPES.TIMEOUT, null, {
    message: 'Request timed out',
    suggestion: 'The request took too long. Your connection might be slow.'
  })
}
```

---

## Step 5: Create Error Display Component

### 5.1 Create ErrorMessage Component
Create `src/components/ErrorMessage.jsx`:

```javascript
import { useState } from 'react'
import './ErrorMessage.css'

function ErrorMessage({ error, onRetry, onDismiss, isRetrying }) {
  if (!error) return null
  
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div 
      className={`error-message error-${error.severity.toLowerCase()}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-header">
        <div className="error-icon">
          {error.severity === 'CRITICAL' ? '⚠️' : '❌'}
        </div>
        <div className="error-content">
          <h3 className="error-title">{error.message}</h3>
          <p className="error-suggestion">{error.suggestion}</p>
        </div>
        <button
          className="error-close"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
      
      {error.recoverySteps && error.recoverySteps.length > 0 && (
        <div className="error-details">
          <button
            className="error-details-toggle"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
          >
            {showDetails ? 'Hide' : 'Show'} suggestions
          </button>
          
          {showDetails && (
            <ul className="error-recovery-steps">
              {error.recoverySteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="error-actions">
        {error.canRetry && (
          <button
            className="btn btn-retry"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        )}
        {error.type === 'PLAYER' && (
          <button
            className="btn btn-refresh"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
```

### 5.2 Create ErrorMessage CSS
Create `src/components/ErrorMessage.css`:

```css
.error-message {
  background: #2a1a1a;
  border: 2px solid #ff4444;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  color: #fff;
}

.error-critical {
  border-color: #ff0000;
  background: #3a1a1a;
}

.error-error {
  border-color: #ff4444;
}

.error-warning {
  border-color: #ffaa00;
  background: #2a2a1a;
}

.error-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.error-suggestion {
  margin: 0;
  font-size: 14px;
  color: #ccc;
  line-height: 1.5;
}

.error-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.error-close:hover {
  opacity: 1;
}

.error-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.error-details-toggle {
  background: none;
  border: none;
  color: #4a9eff;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 0;
  text-decoration: underline;
}

.error-details-toggle:hover {
  color: #6ab4ff;
}

.error-recovery-steps {
  margin: 12px 0 0 0;
  padding-left: 20px;
  color: #ddd;
  font-size: 14px;
  line-height: 1.8;
}

.error-recovery-steps li {
  margin-bottom: 8px;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-retry,
.btn-refresh {
  padding: 8px 16px;
  border: 2px solid #4a9eff;
  background: #1a3a5a;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-retry:hover:not(:disabled),
.btn-refresh:hover {
  background: #2a5a7a;
  border-color: #6ab4ff;
}

.btn-retry:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile styles */
@media (max-width: 768px) {
  .error-message {
    padding: 12px;
    margin: 12px 0;
  }
  
  .error-title {
    font-size: 16px;
  }
  
  .error-suggestion {
    font-size: 13px;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .btn-retry,
  .btn-refresh {
    width: 100%;
  }
}
```

---

## Step 6: Update App.jsx to Use Error Component

### 6.1 Import Error Component
```javascript
import ErrorMessage from './components/ErrorMessage.jsx'
```

### 6.2 Replace Error Display
**Current:**
```javascript
{validationError && (
  <span 
    id="video-id-error"
    className="error-message"
    role="alert"
    aria-live="assertive"
  >
    {validationError}
  </span>
)}
```

**New:**
```javascript
<ErrorMessage
  error={error}
  onRetry={retryError}
  onDismiss={clearError}
  isRetrying={isRetrying}
/>
```

### 6.3 Update All Error References
Replace all `setValidationError` calls with `handleError` using appropriate error types.

---

## Step 7: Add Specific Error Handlers

### 7.1 Network Error Detection
Add to `fetchVideoTitle` function:

```javascript
const fetchVideoTitle = async (videoId) => {
  try {
    // ... existing validation ...
    
    const response = await fetch(url, {
      signal: controller.signal
    })
    
    if (!response.ok) {
      // Network error or HTTP error
      if (!navigator.onLine) {
        handleError(ERROR_TYPES.NETWORK, null, {
          message: 'No internet connection',
          suggestion: 'Please check your internet connection and try again.'
        })
      } else {
        handleError(ERROR_TYPES.NETWORK, response.status, {
          message: 'Failed to load video information',
          suggestion: 'Unable to fetch video details. Please try again.'
        })
      }
      return null
    }
    
    // ... rest of function ...
  } catch (error) {
    if (error.name === 'AbortError') {
      handleError(ERROR_TYPES.TIMEOUT, null, {
        message: 'Request timed out',
        suggestion: 'The request took too long. Your connection might be slow.'
      })
    } else if (!navigator.onLine) {
      handleError(ERROR_TYPES.NETWORK, null, {
        message: 'No internet connection',
        suggestion: 'Please check your internet connection and try again.'
      })
    } else {
      handleError(ERROR_TYPES.NETWORK, null, {
        message: 'Connection error',
        suggestion: 'Unable to connect to YouTube. Please try again.'
      })
    }
    return null
  }
}
```

### 7.2 Player Initialization Errors
Update player initialization:

```javascript
try {
  const newPlayer = new window.YT.Player(container, {
    // ... config ...
  })
} catch (error) {
  setIsLoading(false)
  handleError(ERROR_TYPES.PLAYER, null, {
    message: 'Video player failed to load',
    suggestion: 'The video player could not be initialized. Please refresh the page.',
    originalError: error.message
  })
  playerInitializedRef.current = false
}
```

---

## Step 8: Update Constants File

Add to `src/utils/constants.js`:

```javascript
// Error Types
export const ERROR_TYPES = {
  VIDEO_LOAD: 'VIDEO_LOAD',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  VIDEO_PRIVATE: 'VIDEO_PRIVATE',
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  PLAYER: 'PLAYER',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
}

// Error Severity
export const ERROR_SEVERITY = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO'
}
```

---

## Step 9: Testing Checklist

- [ ] Test video not found error (invalid video ID)
- [ ] Test private video error
- [ ] Test network error (disable internet)
- [ ] Test timeout error (slow connection simulation)
- [ ] Test validation errors (invalid times)
- [ ] Test retry button functionality
- [ ] Test error dismissal
- [ ] Test error details toggle
- [ ] Test mobile responsiveness
- [ ] Test screen reader compatibility

---

## Step 10: Migration Strategy

1. **Phase 1**: Create error utilities and component (Steps 1-5)
2. **Phase 2**: Update one error type at a time (start with video errors)
3. **Phase 3**: Update validation errors
4. **Phase 4**: Update all remaining errors
5. **Phase 5**: Test thoroughly
6. **Phase 6**: Remove old `validationError` state and `getYouTubeErrorMessage` function

---

## Benefits

✅ **User-friendly messages**: Clear, non-technical language  
✅ **Actionable suggestions**: Users know what to do next  
✅ **Retry functionality**: Quick recovery from transient errors  
✅ **Better UX**: Collapsible details, visual indicators  
✅ **Accessibility**: Proper ARIA labels and screen reader support  
✅ **Maintainability**: Centralized error handling logic

---

## Example Error Messages

**Before:**
> "Error loading video. Please check the URL or Video ID and try again."

**After:**
> **Video not found**  
> The video may have been removed or the URL is incorrect.  
> [Show suggestions ▼]  
> [Try Again] button

**Expanded:**
- Double-check the video URL or Video ID
- Try searching for the video using the search box above
- Verify the video hasn't been deleted or made private
- Check your internet connection
