// Recording bytes and metadata stay in this browser; nothing is uploaded.
export const RECORDING_ID_PATTERN = /^audio:[a-f0-9]{64}$/
export const MAX_RECORDING_BYTES = 100 * 1024 * 1024

function openRecordings() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('music_looper_recordings_v1', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('recordings', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Close other Music Looper tabs and try again.'))
  })
}

async function recordingRequest(mode, action) {
  const db = await openRecordings()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('recordings', mode)
      const request = action(transaction.objectStore('recordings'))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error || new Error('Recording storage failed.'))
      transaction.onerror = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}

export const readRecording = (id) => recordingRequest('readonly', store => store.get(id))

export async function listRecordings() {
  const records = await recordingRequest('readonly', store => store.getAll())
  return records.map(({ id, title, duration }) => ({ id, title, duration }))
}

export async function importRecording(file) {
  if (!/\.mp3$/i.test(file.name)) throw new Error('Choose an MP3 file.')
  if (!file.size) throw new Error('This file is empty.')
  if (file.size > MAX_RECORDING_BYTES) throw new Error('Maximum size is 100 MB per recording.')
  const url = URL.createObjectURL(file)
  let duration
  try {
    duration = await new Promise((resolve, reject) => {
      const audio = new Audio()
      const finish = (error) => {
        clearTimeout(timer)
        const value = audio.duration
        audio.onloadedmetadata = null
        audio.onerror = null
        audio.removeAttribute('src')
        audio.load()
        if (error) reject(error)
        else resolve(value)
      }
      const timer = setTimeout(() => finish(new Error('Could not read this MP3. Try downloading it again.')), 10000)
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) && audio.duration > 0
        ? null : new Error('This MP3 has no playable duration.'))
      audio.onerror = () => finish(new Error('This file could not be decoded as audio.'))
      audio.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
  const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  const id = 'audio:' + Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
  const record = { id, title: file.name.replace(/\.mp3$/i, '').slice(0, 200), duration, blob: file }
  await recordingRequest('readwrite', store => store.put(record))
  return { id, title: record.title, duration }
}

// Separate key keeps MP3 loops out of the existing YouTube-only Set List.
const LOOP_KEY = 'musicLooperLocalLoops_v1'
export function loadLocalLoops() {
  try {
    const value = JSON.parse(localStorage.getItem(LOOP_KEY) || '[]')
    return Array.isArray(value) ? value.filter(loop =>
      loop && typeof loop.id === 'string' && RECORDING_ID_PATTERN.test(loop.recordingId) &&
      typeof loop.title === 'string' && Number.isFinite(loop.startTime) && loop.startTime >= 0 &&
      Number.isFinite(loop.endTime) && loop.endTime > loop.startTime &&
      Number.isInteger(loop.targetLoops) && loop.targetLoops >= 1 && loop.targetLoops <= 10000 &&
      Number.isFinite(loop.playbackSpeed) && loop.playbackSpeed >= 0.25 && loop.playbackSpeed <= 2
    ).slice(0, 100) : []
  } catch {
    return []
  }
}

export function saveLocalLoop(loop) {
  const saved = { ...loop, id: crypto.randomUUID() }
  localStorage.setItem(LOOP_KEY, JSON.stringify([saved, ...loadLocalLoops()].slice(0, 100)))
  return saved
}
