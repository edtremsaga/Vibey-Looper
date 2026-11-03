import { useRef, useState } from 'react'

const STORAGE_KEYS = [
  'recentVideos', 'savedLoops', 'savedSetLists', 'setList', 'defaultVideo',
  'musicLooperLocalLoops_v1',
]

export default function BackupControls() {
  const inputRef = useRef(null)
  const [message, setMessage] = useState('')

  const exportBackup = () => {
    const storage = Object.fromEntries(STORAGE_KEYS.flatMap(key => {
      const value = localStorage.getItem(key)
      return value === null ? [] : [[key, value]]
    }))
    const backup = { app: 'music-looper', version: 1, exportedAt: new Date().toISOString(), storage }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    link.download = `music-looper-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setMessage(`Backup downloaded with ${Object.keys(storage).length} saved data entries.`)
  }

  const importBackup = async (file) => {
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('This backup file is too large.')
      const backup = JSON.parse(await file.text())
      if (backup?.app !== 'music-looper' || backup?.version !== 1 || !backup.storage || typeof backup.storage !== 'object') {
        throw new Error('Choose a Music Looper backup file.')
      }
      const entries = Object.entries(backup.storage)
      if (!entries.length || entries.some(([key, value]) => !STORAGE_KEYS.includes(key) || typeof value !== 'string')) {
        throw new Error('This backup does not contain valid Music Looper data.')
      }
      if (!window.confirm('Import this backup and replace the Music Looper data in this Chrome profile?')) return
      entries.forEach(([key, value]) => localStorage.setItem(key, value))
      location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not import this backup.')
    }
  }

  return <div className="backup-controls">
    <button type="button" className="help-link-text" onClick={exportBackup}>Export Backup</button>
    <button type="button" className="help-link-text" onClick={() => inputRef.current?.click()}>Import Backup</button>
    <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={event => { const file = event.target.files?.[0]; if (file) void importBackup(file); event.target.value = '' }} />
    {message && <span role="status">{message}</span>}
  </div>
}
