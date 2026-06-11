import React from 'react'
import './ChartDisplay.css'

function ChartDisplay({ charts }) {
  return (
    <div className="charts-container">
      <div className="chart-item mb-5">
        <h5 className="mb-3">� Elevation & Pace Profile</h5>
        <p className="text-muted small">
          Combined view showing elevation changes and how your pace adjusts through the race (Strava-style).
        </p>
        <div className="chart-wrapper">
          {charts.pace && (
            <img
              src={`data:image/png;base64,${charts.pace}`}
              alt="Elevation and Pace Profile"
              className="chart-image"
            />
          )}
        </div>
      </div>

      <div className="chart-item mb-5">
        <h5 className="mb-3">⛰️ Pace vs Terrain Grade</h5>
        <p className="text-muted small">
          Shows how terrain gradient affects your pace. Bubble size represents elevation gain per segment.
        </p>
        <div className="chart-wrapper">
          {charts.terrain_pace && (
            <img
              src={`data:image/png;base64,${charts.terrain_pace}`}
              alt="Pace vs Terrain Grade"
              className="chart-image"
            />
          )}
        </div>
      </div>

      <div className="chart-item mb-5">
        <h5 className="mb-3">📈 Elevation Profile</h5>
        <div className="chart-wrapper">
          {charts.elevation && (
            <img
              src={`data:image/png;base64,${charts.elevation}`}
              alt="Elevation Profile"
              className="chart-image"
            />
          )}
        </div>
      </div>

      <div className="chart-item">
        <h5 className="mb-3">📊 Terrain Grade by Segment</h5>
        <p className="text-muted small">
          Shows uphill (red) and downhill (blue) terrain for each segment.
        </p>
        <div className="chart-wrapper">
          {charts.grade && (
            <img
              src={`data:image/png;base64,${charts.grade}`}
              alt="Terrain Grade"
              className="chart-image"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartDisplay
