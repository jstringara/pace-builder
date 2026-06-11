import React from 'react'

function SegmentsTable({ segments }) {
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
    <div className="table-responsive">
      <table className="table table-sm table-hover">
        <thead className="table-light">
          <tr>
            <th>Km</th>
            <th>Dist (m)</th>
            <th>Grade %</th>
            <th>Elev Gain (m)</th>
            <th>Base Pace</th>
            <th>Adjusted Pace</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg) => (
            <tr key={seg.segment_num}>
              <td>
                <strong>{seg.segment_num}</strong>
              </td>
              <td>{seg.distance_m.toFixed(0)}</td>
              <td>{seg.grade.toFixed(2)}%</td>
              <td>{seg.elevation_gain_m.toFixed(1)}</td>
              <td>{formatPace(seg.base_pace_sec)}</td>
              <td>
                <strong>{seg.adjusted_pace_str}</strong>
              </td>
              <td>{formatTime(seg.segment_time_sec)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SegmentsTable
