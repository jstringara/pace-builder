import React, { useState } from 'react'
import './PacingForm.css'

const PRESETS = {
  default: { alphaUp: 10.0, alphaDown: 5.0, minPct: 50, maxMult: 3.0 },
  race: { alphaUp: 15.0, alphaDown: 3.0, minPct: 50, maxMult: 2.5 },
  training: { alphaUp: 8.0, alphaDown: 6.0, minPct: 60, maxMult: 1.8 },
  very_hilly: { alphaUp: 18.0, alphaDown: 8.0, minPct: 50, maxMult: 3.5 },
  rolling: { alphaUp: 10.0, alphaDown: 5.0, minPct: 50, maxMult: 3.0 },
  ultra: { alphaUp: 12.0, alphaDown: 4.0, minPct: 70, maxMult: 2.0 },
}

function PacingForm({ onSubmit, loading, error, onErrorDismiss }) {
  const [gpxFile, setGpxFile] = useState(null)
  const [basePace, setBasePace] = useState('5:30')
  const [alphaUp, setAlphaUp] = useState(10.0)
  const [alphaDown, setAlphaDown] = useState(5.0)
  const [minPct, setMinPct] = useState(50)
  const [maxMult, setMaxMult] = useState(3.0)
  const [negativeSplit, setNegativeSplit] = useState(false)
  const [negativeSplitDelta, setNegativeSplitDelta] = useState(30)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [preset, setPreset] = useState('default')

  const applyPreset = (presetKey) => {
    const p = PRESETS[presetKey]
    setAlphaUp(p.alphaUp)
    setAlphaDown(p.alphaDown)
    setMinPct(p.minPct)
    setMaxMult(p.maxMult)
    setPreset(presetKey)
  }

  const loadSampleGpx = async () => {
    try {
      const basePath = import.meta.env.BASE_URL
      const gpxPath = basePath + 'sangiovanni.gpx'
      console.log('Loading GPX from:', gpxPath)
      
      const response = await fetch(gpxPath)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const file = new File([blob], 'sangiovanni.gpx', { type: 'application/gpx+xml' })
      setGpxFile(file)
      console.log('✓ Sample GPX loaded successfully')
    } catch (err) {
      console.error('Error loading sample GPX:', err)
      alert('Failed to load sample GPX file: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!gpxFile) {
      alert('Please select a GPX file')
      return
    }

    if (!basePace.match(/\d{1,2}:\d{2}/)) {
      alert('Please enter pace in mm:ss format (e.g., 5:30)')
      return
    }

    try {
      const gpxContent = await gpxFile.text()
      onSubmit({
        gpxContent,
        basePace,
        alphaUp,
        alphaDown,
        minPct,
        maxMult,
        negativeSplit,
        negativeSplitDelta,
      })
    } catch (err) {
      console.error('Error reading GPX file:', err)
    }
  }

  return (
    <div className="pacing-form-container">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light border-bottom">
          <h5 className="mb-0">⚙️ Pacing Configuration</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* GPX File Input */}
            <div className="mb-4">
              <label htmlFor="gpxFile" className="form-label fw-bold">
                GPX File <span className="badge bg-info ms-2">Required</span>
              </label>
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  id="gpxFile"
                  accept=".gpx"
                  onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                  style={{ display: gpxFile ? 'none' : 'block' }}
                />
                {gpxFile && (
                  <div className="form-control bg-light d-flex align-items-center" style={{ cursor: 'pointer' }}>
                    <span>✓ {gpxFile.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadSampleGpx}
                  title="Load the sample sangiovanni.gpx file"
                >
                  {gpxFile ? 'Change' : 'Use Sample'}
                </button>
                {gpxFile && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => setGpxFile(null)}
                    title="Clear the selected file"
                  >
                    Clear
                  </button>
                )}
              </div>
              <small className="form-text text-muted d-block mt-2">
                📍 {gpxFile ? `Selected: ${gpxFile.name}` : 'Upload your GPX track file or click "Use Sample"'}
              </small>
            </div>

            {/* Base Pace Input */}
            <div className="mb-4">
              <label htmlFor="basePace" className="form-label fw-bold">
                Target Pace (mm:ss) <span className="badge bg-info ms-2">Required</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="basePace"
                placeholder="5:30"
                value={basePace}
                onChange={(e) => setBasePace(e.target.value)}
                pattern="\d{1,2}:\d{2}"
                required
              />
              <small className="form-text text-muted d-block mt-2">
                ⏱️ Your goal pace per kilometer on flat terrain (e.g., 5:30).
              </small>
            </div>

            {/* Advanced Parameters Toggle */}
            <div className="mb-4">
              <button
                type="button"
                className="btn btn-link text-decoration-none p-0 fw-bold"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                ⚙️ Advanced Parameters {showAdvanced ? '▼' : '▶'}
              </button>
            </div>

            {/* Advanced Parameters Section */}
            {showAdvanced && (
              <div className="advanced-section mb-4 p-4 bg-light rounded">
                {/* Presets */}
                <div className="mb-4">
                  <label htmlFor="presetSelect" className="form-label fw-bold">
                    Presets <span className="badge bg-secondary ms-2">Helpful</span>
                  </label>
                  <select
                    id="presetSelect"
                    className="form-select"
                    value={preset}
                    onChange={(e) => applyPreset(e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="race">Race Day (aggressive climbs)</option>
                    <option value="training">Training Run (conservative)</option>
                    <option value="very_hilly">Very Hilly</option>
                    <option value="rolling">Rolling Hills</option>
                    <option value="ultra">Long Ultra (preserve energy)</option>
                  </select>
                  <small className="form-text text-muted d-block mt-2">
                    Choose a preset to quickly set the advanced parameters.
                  </small>
                </div>

                {/* Parameters Grid */}
                <div className="parameter-grid">
                  {/* Alpha Up */}
                  <div>
                    <label htmlFor="alphaUp" className="form-label">
                      Uphill Penalty (sec/%)
                      <span className="badge bg-secondary ms-2">{alphaUp.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="alphaUp"
                      min="5"
                      max="25"
                      step="0.5"
                      value={alphaUp}
                      onChange={(e) => setAlphaUp(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      ⬆️ Seconds added per 1% uphill grade.
                    </small>
                  </div>

                  {/* Alpha Down */}
                  <div>
                    <label htmlFor="alphaDown" className="form-label">
                      Downhill Bonus (sec/%)
                      <span className="badge bg-secondary ms-2">{alphaDown.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="alphaDown"
                      min="2"
                      max="12"
                      step="0.5"
                      value={alphaDown}
                      onChange={(e) => setAlphaDown(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      ⬇️ Seconds saved per 1% downhill grade.
                    </small>
                  </div>

                  {/* Min Pace */}
                  <div>
                    <label htmlFor="minPct" className="form-label">
                      Minimum Pace (% of base)
                      <span className="badge bg-secondary ms-2">{minPct}%</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="minPct"
                      min="30"
                      max="100"
                      step="5"
                      value={minPct}
                      onChange={(e) => setMinPct(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      🐢 Slowest allowed pace (safety floor).
                    </small>
                  </div>

                  {/* Max Pace */}
                  <div>
                    <label htmlFor="maxMult" className="form-label">
                      Maximum Pace (× base)
                      <span className="badge bg-secondary ms-2">{maxMult.toFixed(1)}×</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="maxMult"
                      min="1.5"
                      max="5.0"
                      step="0.5"
                      value={maxMult}
                      onChange={(e) => setMaxMult(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      🐇 Fastest allowed pace (safety ceiling).
                    </small>
                  </div>
                </div>

                {/* Negative Split Strategy */}
                <div className="mt-4 pt-4 border-top">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="negativeSplitToggle"
                      checked={negativeSplit}
                      onChange={(e) => setNegativeSplit(e.target.checked)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="negativeSplitToggle">
                      🏃 Negative Split Strategy
                    </label>
                  </div>
                  <small className="form-text text-muted d-block mb-3">
                    Run the second half faster than the first half to conserve energy early.
                  </small>

                  {negativeSplit && (
                    <div>
                      <label htmlFor="negativeSplitDelta" className="form-label">
                        Split Adjustment (sec/km)
                        <span className="badge bg-secondary ms-2">{negativeSplitDelta}</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        id="negativeSplitDelta"
                        min="10"
                        max="60"
                        step="5"
                        value={negativeSplitDelta}
                        onChange={(e) => setNegativeSplitDelta(parseFloat(e.target.value))}
                      />
                      <small className="form-text text-muted d-block mt-2">
                        ⚖️ How much to slow down first half / speed up second half.
                      </small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg fw-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Calculating...
                  </>
                ) : (
                  'Calculate Pacing Strategy'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mt-4" role="alert">
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={onErrorDismiss}
            aria-label="Close"
          ></button>
        </div>
      )}
    </div>
  )
}

export default PacingForm
