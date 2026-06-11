import React from 'react'
import './ChartDisplay.css'

function ChartDisplay({ charts }) {
  return (
    <div className="charts-container">
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

      <div className="chart-item mb-5">
        <h5 className="mb-3">🏃 Pacing Strategy</h5>
        <p className="text-muted small">
          Comparison between your base pace and adjusted pace for each segment.
        </p>
        <div className="chart-wrapper">
          {charts.pace && (
            <img
              src={`data:image/png;base64,${charts.pace}`}
              alt="Pacing Strategy"
              className="chart-image"
            />
          )}
        </div>
      </div>

      <div className="chart-item">
        <h5 className="mb-3">⛰️ Terrain Grade</h5>
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
