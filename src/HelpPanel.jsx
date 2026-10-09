import { useId, useState } from 'react'

function HelpPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const detailsId = useId()

  return (
    <section className="help-panel" aria-label="How it works">
      <div className="help-panel-header">
        <div className="help-panel-intro">
          <h3 className="help-panel-title">How it works</h3>
          <ul className="help-panel-summary">
            <li>Search YouTube by song, artist, or both</li>
            <li>Paste a YouTube link or import an MP3 from your computer</li>
            <li>Star a video to make it your default</li>
          </ul>
        </div>
        <button
          type="button"
          className="help-panel-toggle"
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {isExpanded && (
        <div id={detailsId} className="help-panel-details">
          <h4>Find a YouTube video</h4>
          <p>
            Use the search box at the top to search by song title, artist, or both.
            Press Enter or click Search, then click a result to load the video.
          </p>
          <p>
            You can also paste a YouTube link directly into the input field below.
          </p>
          <h4>Practice with a local MP3</h4>
          <p>
            Select <strong>Local MP3s</strong> to import MP3 files from your computer, then choose a recording to use the same start time, end time, repeat count, speed, and Reset Loop controls.
          </p>
          <p>
            Recordings stay in this browser and are not uploaded or synced. Save MP3 Loop stores a reusable local loop; MP3 loops are currently separate from YouTube saved loops and Set List.
          </p>
        </div>
      )}
    </section>
  )
}

export default HelpPanel
