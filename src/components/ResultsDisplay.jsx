import React, { useState } from 'react'
import SummaryStats from './SummaryStats'
import SegmentsTable from './SegmentsTable'
import ChartDisplay from './ChartDisplay'
import './ResultsDisplay.css'

function ResultsDisplay({ results }) {
  const [activeTab, setActiveTab] = useState('table')

  const totalTime = results.segments.reduce((sum, seg) => sum + seg.segment_time_sec, 0)
  const totalElev = results.segments.reduce((sum, seg) => sum + seg.elevation_gain_m, 0)
  const avgPacePerKm = Math.round(totalTime / results.total_distance_km)

  const downloadCSV = () => {
    let csv = 'Segment,Distance (m),Grade (%),Elevation Gain (m),Base Pace,Adjusted Pace,Time\n'

    results.segments.forEach((seg) => {
      const baseMin = Math.floor(seg.base_pace_sec / 60)
      const baseSec = seg.base_pace_sec % 60
      const timeHours = Math.floor(seg.segment_time_sec / 3600)
      const timeMin = Math.floor((seg.segment_time_sec % 3600) / 60)
      const timeSec = seg.segment_time_sec % 60

      csv += `"${seg.segment_num}","${seg.distance_m.toFixed(0)}","${seg.grade.toFixed(2)}","${seg.elevation_gain_m.toFixed(1)}","${baseMin}:${String(baseSec).padStart(2, '0')}","${seg.adjusted_pace_str}","${String(timeHours).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}:${String(timeSec).padStart(2, '0')}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'pace_builder_splits.csv'
    link.click()
  }

  return (
    <div className="results-display">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light border-bottom d-flex flex-column">
          <h3 className="mb-3">📊 Your Pacing Strategy</h3>
          {/* Tabs for Table and Charts */}
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'table' ? 'active' : ''}`}
                id="table-tab"
                onClick={() => setActiveTab('table')}
                role="tab"
              >
                <span className="icon-label">📋</span> Segments Table
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'charts' ? 'active' : ''}`}
                id="charts-tab"
                onClick={() => setActiveTab('charts')}
                role="tab"
              >
                <span className="icon-label">📈</span> Charts & Graphs
              </button>
            </li>
          </ul>
        </div>

        {/* Summary Stats */}
        <div className="card-body">
          <SummaryStats
            totalDist={results.total_distance_km}
            totalElev={totalElev}
            totalTime={totalTime}
            avgPace={avgPacePerKm}
          />
        </div>

        <div className="card-body">
          {activeTab === 'table' && (
            <>
              <SegmentsTable segments={results.segments} />
              <div className="mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={downloadCSV}
                >
                  📥 Download as CSV
                </button>
              </div>
            </>
          )}

          {activeTab === 'charts' && (
            <ChartDisplay charts={results.charts} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultsDisplay
