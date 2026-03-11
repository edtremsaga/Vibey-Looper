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
            <li>Paste a YouTube link to load a video directly</li>
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
        </div>
      )}
    </section>
  )
}

export default HelpPanel
