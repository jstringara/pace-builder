import React, { useState } from 'react'
import './PacingForm.css'

const PRESETS = {
  default: { c1: 1.5, c2: 6.5, splitVariance: 0.05, minPct: 50, maxMult: 3.0 },
  race: { c1: 2.0, c2: 8.0, splitVariance: 0.02, minPct: 50, maxMult: 2.5 },
  training: { c1: 1.2, c2: 5.5, splitVariance: 0.08, minPct: 60, maxMult: 1.8 },
  very_hilly: { c1: 2.2, c2: 9.0, splitVariance: 0.03, minPct: 50, maxMult: 3.5 },
  rolling: { c1: 1.5, c2: 6.5, splitVariance: 0.05, minPct: 50, maxMult: 3.0 },
  ultra: { c1: 1.8, c2: 7.0, splitVariance: 0.10, minPct: 70, maxMult: 2.0 },
}

function PacingForm({ onSubmit, loading, error, onErrorDismiss }) {
  const [gpxFile, setGpxFile] = useState(null)
  const [basePace, setBasePace] = useState('5:30')
  const [c1, setC1] = useState(1.5)
  const [c2, setC2] = useState(6.5)
  const [splitVariance, setSplitVariance] = useState(0.05)
  const [minPct, setMinPct] = useState(50)
  const [maxMult, setMaxMult] = useState(3.0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [preset, setPreset] = useState('default')

  const applyPreset = (presetKey) => {
    const p = PRESETS[presetKey]
    setC1(p.c1)
    setC2(p.c2)
    setSplitVariance(p.splitVariance)
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
        c1,
        c2,
        splitVariance,
        minPct,
        maxMult,
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
                  {/* C1 */}
                  <div>
                    <label htmlFor="c1" className="form-label">
                      Effort Coefficient C1 (linear)
                      <span className="badge bg-secondary ms-2">{c1.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="c1"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={c1}
                      onChange={(e) => setC1(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      📈 Linear effort multiplier for grade. Higher = steeper penalty.
                    </small>
                  </div>

                  {/* C2 */}
                  <div>
                    <label htmlFor="c2" className="form-label">
                      Effort Coefficient C2 (quadratic)
                      <span className="badge bg-secondary ms-2">{c2.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="c2"
                      min="2.0"
                      max="12.0"
                      step="0.5"
                      value={c2}
                      onChange={(e) => setC2(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      📊 Quadratic effort multiplier for grade. Amplifies steep sections.
                    </small>
                  </div>

                  {/* Split Variance */}
                  <div>
                    <label htmlFor="splitVariance" className="form-label">
                      Split Variance (strategy)
                      <span className="badge bg-secondary ms-2">{(splitVariance * 100).toFixed(1)}%</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="splitVariance"
                      min="0.0"
                      max="0.20"
                      step="0.01"
                      value={splitVariance}
                      onChange={(e) => setSplitVariance(parseFloat(e.target.value))}
                    />
                    <small className="form-text text-muted d-block mt-2">
                      ⚡ Negative split strategy: 0% = even pace, 5% = moderate split, 20% = aggressive split.
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
