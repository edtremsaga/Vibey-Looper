// Local-audio loop state is independent of the YouTube player and its callbacks.
export function createAudioLoop(audio, { onCount, onState, onError }) {
  let range = null
  let count = 0
  let active = false
  let waitingForSeek = false
  let timer = null
  let generation = 0

  function pause() {
    active = false
    generation += 1
    clearInterval(timer)
    timer = null
    audio.pause()
    onState(false)
  }

  function play() {
    const attempt = ++generation
    try {
      Promise.resolve(audio.play()).catch(error => {
        if (attempt !== generation) return
        pause()
        onError(error.name === 'NotAllowedError'
          ? 'Playback was blocked. Click Start Loop to try again.'
          : 'Could not play this MP3. Try importing it again.')
      })
    } catch {
      pause()
      onError('Could not play this MP3.')
    }
  }

  function complete() {
    if (!active || waitingForSeek) return
    waitingForSeek = true
    count += 1
    onCount(count)
    if (count >= range.targetLoops) {
      pause()
      return
    }
    audio.currentTime = range.startTime
    play()
  }

  function tick() {
    if (!active || audio.seeking) return
    // A seek must have returned inside the segment before another completion.
    if (waitingForSeek) {
      if (audio.currentTime < range.endTime && !audio.ended) waitingForSeek = false
      return
    }
    if (audio.currentTime >= range.endTime) complete()
  }

  function ended() {
    // Ignore an old queued ENDED event after seeking back into the segment.
    if (audio.ended) complete()
  }

  function seeked() {
    if (active && audio.currentTime < range.endTime && !audio.ended) waitingForSeek = false
  }

  function mediaPaused() {
    if (active && audio.paused && !audio.ended) pause()
  }

  function activate() {
    active = true
    onState(true)
    clearInterval(timer)
    timer = setInterval(tick, 50)
    play()
  }

  audio.addEventListener('ended', ended)
  audio.addEventListener('seeked', seeked)
  audio.addEventListener('pause', mediaPaused)

  return {
    start(nextRange) {
      pause()
      range = { ...nextRange }
      count = 0
      onCount(0)
      waitingForSeek = true
      audio.currentTime = range.startTime
      activate()
    },
    pause,
    resume(nextRange) {
      if (range && nextRange) range = { ...nextRange }
      if (!range || count >= range.targetLoops) return
      activate()
    },
    reset(startTime) {
      pause()
      range = null
      count = 0
      waitingForSeek = false
      onCount(0)
      audio.currentTime = startTime
    },
    destroy() {
      pause()
      audio.removeEventListener('ended', ended)
      audio.removeEventListener('seeked', seeked)
      audio.removeEventListener('pause', mediaPaused)
    },
  }
}
