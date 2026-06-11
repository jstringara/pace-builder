import React from 'react'

function SummaryStats({ totalDist, totalElev, totalTime, avgPace }) {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatPace = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="row mb-4">
      <div className="col-md-3 mb-3">
        <div className="stat-box">
          <div className="stat-value">{totalDist.toFixed(2)}</div>
          <div className="stat-label">Total Distance (km)</div>
        </div>
      </div>
      <div className="col-md-3 mb-3">
        <div className="stat-box">
          <div className="stat-value">{totalElev.toFixed(0)}</div>
          <div className="stat-label">Elevation Gain (m)</div>
        </div>
      </div>
      <div className="col-md-3 mb-3">
        <div className="stat-box">
          <div className="stat-value">{formatTime(totalTime)}</div>
          <div className="stat-label">Total Time</div>
        </div>
      </div>
      <div className="col-md-3 mb-3">
        <div className="stat-box">
          <div className="stat-value">{formatPace(avgPace)}</div>
          <div className="stat-label">Avg Pace (/km)</div>
        </div>
      </div>
    </div>
  )
}

export default SummaryStats
