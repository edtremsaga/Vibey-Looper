import { useEffect, useRef, useState } from 'react'
import { importRecording, listRecordings, readRecording, loadLocalLoops, saveLocalLoop } from './utils/recordings.js'
import { createAudioLoop } from './utils/audioLoop.js'
import { secondsToMMSS } from './utils/helpers.js'
import { DEFAULTS } from './utils/constants.js'
import './LocalMp3Panel.css'

const parseTime = value => {
  if (!/^\d+(?:\.\d+|:\d+(?:\.\d+)?)?$/.test(value.trim())) return NaN
  const parts = value.trim().split(':').map(Number)
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]
}

const formatTime = value => {
  const milliseconds = Math.floor(value * 1000)
  const minutes = Math.floor(milliseconds / 60000)
  const seconds = ((milliseconds % 60000) / 1000).toFixed(3).replace(/\.?0+$/, '')
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds || '0'}`
}

export default function LocalMp3Panel({ selection, onSelect, onClose, isMobile }) {
  const [open, setOpen] = useState(false)
  const [recordings, setRecordings] = useState([])
  const [loops, setLoops] = useState(loadLocalLoops)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const importingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!open) return
    dialogRef.current.showModal()
    let current = true
    listRecordings().then(items => { if (current) setRecordings(items) })
      .catch(() => { if (current) setMessage('Could not read browser storage. Check your browser storage settings.') })
    return () => { current = false }
  }, [open])

  function closeDialog() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  async function importFiles(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (importingRef.current || !files.length) return
    importingRef.current = true
    setBusy(true)
    let added = 0
    const failures = []
    for (const file of files) {
      try {
        await importRecording(file)
        added += 1
      } catch (error) {
        failures.push(`${file.name}: ${error.name === 'QuotaExceededError' ? 'Browser storage is full.' : error.message}`)
      }
      if (!mountedRef.current) break
    }
    if (mountedRef.current) {
      try { setRecordings(await listRecordings()) } catch { failures.push('Could not refresh the recording list.') }
      setMessage(`${added} recording(s) imported. ${failures.join(' ')}`)
      setBusy(false)
    }
    importingRef.current = false
    if (added && navigator.storage?.persist) navigator.storage.persist().catch(() => {})
  }

  function select(recording, loop) {
    onSelect({ recording, loop, key: crypto.randomUUID() })
    closeDialog()
  }

  return <section className="local-mp3-section" aria-label="Local MP3s">
    <div className="local-mp3-toolbar">
      <button ref={triggerRef} type="button" className="btn-save-loop" onClick={() => { setMessage(''); setOpen(true) }}>Local MP3s</button>
      {selection && <button type="button" className="btn-save-loop" onClick={onClose}>Return to YouTube</button>}
    </div>
    {!selection && <p className="local-mp3-hint">Or import MP3s from your computer. Audio stays in this browser.</p>}
    {selection && <LocalAudioLooper key={selection.key} selection={selection} isMobile={isMobile}
      onSaved={() => setLoops(loadLocalLoops())} />}
    {open && <dialog ref={dialogRef} className="local-mp3-dialog" aria-labelledby="local-mp3-title" onCancel={closeDialog}>
      <div className="local-mp3-toolbar"><h2 id="local-mp3-title">Local MP3s</h2><button type="button" onClick={closeDialog}>Close</button></div>
      <p>Choose MP3 files from a folder on your computer. Imported copies remain in this browser unless site data is cleared or evicted. They are not uploaded or synced.</p>
      <label className="local-mp3-import">Import MP3 files (up to 100 MB each)
        <input type="file" accept=".mp3,audio/mpeg" multiple disabled={busy} onChange={importFiles} />
      </label>
      <p role="status">{busy ? 'Importing recordings...' : message}</p>
      <h3>Recordings</h3>
      {!recordings.length && <p>No recordings imported yet.</p>}
      <ul className="local-mp3-list">{recordings.map(recording => <li key={recording.id}>
        <button type="button" onClick={() => select(recording)}>{recording.title} <span>{secondsToMMSS(recording.duration)}</span></button>
      </li>)}</ul>
      <h3>Saved MP3 loops</h3>
      {!loops.length && <p>No saved MP3 loops yet. These loops are separate from YouTube saved loops and are not available on the Set List page.</p>}
      <ul className="local-mp3-list">{loops.map(loop => <li key={loop.id}>
        <button type="button" onClick={() => select({ id: loop.recordingId, title: loop.title }, loop)}>
          {loop.title} <span>{secondsToMMSS(loop.startTime)} to {secondsToMMSS(loop.endTime)} / {loop.targetLoops} repeats</span>
        </button>
      </li>)}</ul>
    </dialog>}
  </section>
}

export function LocalAudioLooper({ selection, isMobile, onSaved }) {
  const { recording, loop } = selection
  const audioRef = useRef(null)
  const engineRef = useRef(null)
  const baselineRef = useRef(null)
  const [duration, setDuration] = useState(null)
  const [start, setStart] = useState(loop ? formatTime(loop.startTime) : '0:00')
  const [end, setEnd] = useState(loop ? formatTime(loop.endTime) : '')
  const [target, setTarget] = useState(loop?.targetLoops || 5)
  const [speed, setSpeed] = useState(loop?.playbackSpeed || 1)
  const [volume, setVolume] = useState(DEFAULTS.VOLUME)
  const [count, setCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Loading recording...')
  const startTime = parseTime(start)
  const endTime = parseTime(end)
  const valid = duration && Number.isFinite(startTime) && Number.isFinite(endTime) &&
    startTime >= 0 && endTime > startTime && endTime <= duration &&
    Number.isInteger(Number(target)) && Number(target) >= 1 && Number(target) <= 10000

  useEffect(() => {
    const audio = audioRef.current
    const engine = createAudioLoop(audio, { onCount: setCount, onState: setRunning, onError: setError })
    engineRef.current = engine
    let current = true
    let url
    readRecording(recording.id).then(stored => {
      if (!current) return
      if (!stored?.blob) throw new Error('Recording unavailable. Import the same MP3 again to reconnect saved loops.')
      url = URL.createObjectURL(stored.blob)
      audio.src = url
      audio.load()
    }).catch(error => { if (current) { setError(error.message); setStatus('') } })
    return () => {
      current = false
      engine.destroy()
      engineRef.current = null
      audio.removeAttribute('src')
      audio.load()
      if (url) URL.revokeObjectURL(url)
    }
  }, [recording.id])

  useEffect(() => {
    audioRef.current.playbackRate = Number(speed)
    audioRef.current.preservesPitch = true
  }, [speed, duration])

  useEffect(() => {
    if (!isMobile) audioRef.current.volume = volume / 100
  }, [volume, isMobile])

  function loaded() {
    const value = audioRef.current.duration
    if (!Number.isFinite(value) || value <= 0) { setError('This recording has no playable duration.'); return }
    setDuration(value)
    if (!loop) setEnd(formatTime(value))
    audioRef.current.currentTime = loop ? Math.min(loop.startTime, value) : 0
    setStatus('')
  }

  function startLoop() {
    if (!valid) return
    setError('')
    baselineRef.current = { start, end }
    setStarted(true)
    engineRef.current.start({ startTime, endTime, targetLoops: Number(target) })
  }

  function reset() {
    const baseline = baselineRef.current
    if (baseline) { setStart(baseline.start); setEnd(baseline.end) }
    setTarget(5)
    setStarted(false)
    setError('')
    engineRef.current.reset(baseline ? parseTime(baseline.start) : (Number.isFinite(startTime) ? startTime : 0))
  }

  function save() {
    if (!valid) return
    try {
      saveLocalLoop({ recordingId: recording.id, title: recording.title, startTime, endTime,
        targetLoops: Number(target), playbackSpeed: Number(speed) })
      onSaved()
      setStatus('MP3 loop saved. Open Local MP3s to load it again.')
    } catch { setError('Could not save the loop. Check available browser storage.') }
  }

  return <div className="local-audio-looper">
    <h2>{recording.title}</h2>
    <p className="local-mp3-hint">Local MP3. Use the audio controls to preview, then Start Loop to repeat a section.</p>
    <audio ref={audioRef} controls preload="metadata" onLoadedMetadata={loaded} aria-label="MP3 preview"
      onError={() => { engineRef.current?.pause(); setError('Could not play this recording. Import the MP3 again.'); setDuration(null) }} />
    <p role="status">{status}</p>
    {error && <p role="alert" className="error-message">{error}</p>}
    {duration && !valid && <p role="alert" className="error-message">Choose a valid start and end within {secondsToMMSS(duration)}, and 1 to 10000 repeats.</p>}
    <div className="local-time-controls">
      <label>Start Time (MM:SS)<input aria-label="MP3 start time" value={start} disabled={running}
        onChange={event => setStart(event.target.value)} onBlur={() => { if (Number.isFinite(startTime)) setStart(formatTime(startTime)) }} />
        <button type="button" disabled={!duration || running} onClick={() => setStart(formatTime(audioRef.current.currentTime))}>Set from Audio</button>
      </label>
      <label>End Time (MM:SS)<input aria-label="MP3 end time" value={end} disabled={running}
        onChange={event => setEnd(event.target.value)} onBlur={() => { if (Number.isFinite(endTime)) setEnd(formatTime(endTime)) }} />
        <button type="button" disabled={!duration || running} onClick={() => setEnd(formatTime(audioRef.current.currentTime))}>Set from Audio</button>
      </label>
      <label># of Loops<input aria-label="MP3 repeat count" type="number" min="1" max="10000" step="1" value={target}
        disabled={running} onChange={event => setTarget(event.target.value)} /></label>
    </div>
    <div className="buttons-row">
      <button type="button" className="btn btn-start" disabled={!valid || running} onClick={startLoop}>Start Loop</button>
      <button type="button" className="btn btn-stop" disabled={!duration} onClick={() => {
        if (running || !audioRef.current.paused) engineRef.current.pause()
        else if (valid && started && count < Number(target)) {
          setError('')
          engineRef.current.resume({ startTime, endTime, targetLoops: Number(target) })
        }
      }}>{!running && started && count < Number(target) ? 'Resume Loop' : 'Stop Loop'}</button>
      <button type="button" className="btn btn-reset" disabled={!duration} onClick={reset}>Reset Loop</button>
      <button type="button" className="btn-save-loop" disabled={!valid} onClick={save}>Save MP3 Loop</button>
    </div>
    <label>Playback Speed: {Number(speed).toFixed(2)}x
      <input aria-label="MP3 playback speed" type="range" min="0.25" max="2" step="0.05" value={speed} onChange={event => setSpeed(event.target.value)} />
    </label>
    {!isMobile && <label>Volume<input aria-label="MP3 volume" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label>}
    <div className="status">
      <div className="status-context">Loop: {Number.isFinite(startTime) ? secondsToMMSS(startTime) : '--:--'} &rarr; {Number.isFinite(endTime) ? secondsToMMSS(endTime) : '--:--'} &bull; {target} repeats</div>
      <div role="status" className="status-main">Loop {count} / {target}</div>
    </div>
  </div>
}
