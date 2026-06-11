import React, { useState, useEffect } from 'react'
import PacingForm from './components/PacingForm'
import ResultsDisplay from './components/ResultsDisplay'
import './App.css'

function App() {
  const [pyodide, setPyodide] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    initPyodide()
  }, [])

  const initPyodide = async () => {
    try {
      const pyodideModule = await loadPyodide()
      await pyodideModule.loadPackage('micropip')
      
      // Load matplotlib for graph generation
      await pyodideModule.loadPackage('matplotlib')
      
      // Load the pacing_strategy module
      const response = await fetch(import.meta.env.BASE_URL + 'pacing_strategy.py')
      const pacingScript = await response.text()
      pyodideModule.runPython(pacingScript)
      
      setPyodide(pyodideModule)
      console.log('✓ Pyodide initialized successfully')
    } catch (err) {
      console.error('Pyodide initialization error:', err)
      setError('Failed to initialize Python runtime. Please refresh the page.')
    }
  }

  const handleCalculate = async (formData) => {
    if (!pyodide) {
      setError('Python runtime not ready')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        gpxContent,
        basePace,
        alphaUp,
        alphaDown,
        minPct,
        maxMult,
        negativeSplit,
        negativeSplitDelta,
      } = formData

      // Set Python globals
      pyodide.globals.set('gpx_content', gpxContent)
      pyodide.globals.set('base_pace', basePace)
      pyodide.globals.set('alpha_up', alphaUp)
      pyodide.globals.set('alpha_down', alphaDown)
      pyodide.globals.set('min_pace_frac', minPct / 100)
      pyodide.globals.set('max_pace_mult', maxMult)
      pyodide.globals.set('negative_split', negativeSplit)
      pyodide.globals.set('negative_split_delta', negativeSplitDelta)

      // Run Python calculation and chart generation
      const result = await pyodide.runPythonAsync(`
import json
import io
import base64
from matplotlib import pyplot as plt

# Use the functions from pacing_strategy
points = parse_gpx_string(gpx_content)
segments, total_distance_km, is_negative_split = calculate_segments(
    points,
    base_pace,
    alpha_up=alpha_up,
    alpha_down=alpha_down,
    min_pace_frac=min_pace_frac,
    max_pace_mult=max_pace_mult,
    negative_split=negative_split,
    negative_split_delta=negative_split_delta,
)

# Convert results to JSON
result = {
    'total_distance_km': total_distance_km,
    'segments': [
        {
            'segment_num': seg.segment_num,
            'distance_m': seg.distance_m,
            'elevation_gain_m': seg.elevation_gain_m,
            'elevation_loss_m': seg.elevation_loss_m,
            'grade': seg.grade,
            'base_pace_sec': seg.base_pace_sec,
            'adjusted_pace_sec': seg.adjusted_pace_sec,
            'adjusted_pace_str': seg.adjusted_pace_str,
            'segment_time_sec': seg.segment_time_sec,
        }
        for seg in segments
    ]
}

# Generate elevation profile chart
fig, ax = plt.subplots(figsize=(12, 5), dpi=80)
cumulative_dist = []
elevations = []
current_dist = 0

for seg in segments:
    cumulative_dist.append(current_dist)
    elevations.append(points[0].ele)  # Start elevation
    current_dist += seg.distance_m / 1000

cumulative_dist.append(current_dist)
elevations.append(points[-1].ele)

# Create elevation profile from points
all_distances = []
all_elevations = []
cumulative = 0
for i, point in enumerate(points):
    if i == 0:
        all_distances.append(0)
        all_elevations.append(point.ele)
    elif i % max(1, len(points) // 100) == 0:  # Sample points for performance
        haversine_dist = haversine_distance(points[i-1].lat, points[i-1].lon, point.lat, point.lon)
        cumulative += haversine_dist / 1000
        all_distances.append(cumulative)
        all_elevations.append(point.ele)

ax.fill_between(all_distances, all_elevations, alpha=0.3, color='#2563eb')
ax.plot(all_distances, all_elevations, linewidth=2, color='#2563eb')
ax.set_xlabel('Distance (km)', fontsize=11, fontweight='bold')
ax.set_ylabel('Elevation (m)', fontsize=11, fontweight='bold')
ax.set_title('Elevation Profile', fontsize=13, fontweight='bold', pad=15)
ax.grid(True, alpha=0.3)
ax.set_facecolor('#f8f9fa')
fig.patch.set_facecolor('white')
plt.tight_layout()

buf = io.BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)
elevation_chart = base64.b64encode(buf.read()).decode()
plt.close()

# Generate pace strategy chart
fig, ax = plt.subplots(figsize=(12, 5), dpi=80)
segment_nums = [seg.segment_num for seg in segments]
base_paces = [seg.base_pace_sec / 60 for seg in segments]  # Convert to minutes
adjusted_paces = [seg.adjusted_pace_sec / 60 for seg in segments]

x = range(len(segment_nums))
width = 0.35

ax.bar([i - width/2 for i in x], base_paces, width, label='Base Pace', alpha=0.8, color='#10b981')
ax.bar([i + width/2 for i in x], adjusted_paces, width, label='Adjusted Pace', alpha=0.8, color='#f59e0b')

ax.set_xlabel('Segment (km)', fontsize=11, fontweight='bold')
ax.set_ylabel('Pace (min/km)', fontsize=11, fontweight='bold')
ax.set_title('Pacing Strategy: Base vs Adjusted', fontsize=13, fontweight='bold', pad=15)
ax.set_xticks(x)
ax.set_xticklabels(segment_nums)
ax.legend(loc='upper right', framealpha=0.9)
ax.grid(True, alpha=0.3, axis='y')
ax.set_facecolor('#f8f9fa')
fig.patch.set_facecolor('white')
plt.tight_layout()

buf = io.BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)
pace_chart = base64.b64encode(buf.read()).decode()
plt.close()

# Generate grade distribution chart
fig, ax = plt.subplots(figsize=(12, 5), dpi=80)
grades = [seg.grade for seg in segments]
colors = ['#ef4444' if g > 0 else '#3b82f6' for g in grades]

ax.bar(segment_nums, grades, color=colors, alpha=0.8)
ax.axhline(y=0, color='black', linestyle='-', linewidth=0.8)
ax.set_xlabel('Segment (km)', fontsize=11, fontweight='bold')
ax.set_ylabel('Grade (%)', fontsize=11, fontweight='bold')
ax.set_title('Terrain Grade by Segment', fontsize=13, fontweight='bold', pad=15)
ax.grid(True, alpha=0.3, axis='y')
ax.set_facecolor('#f8f9fa')
fig.patch.set_facecolor('white')
plt.tight_layout()

buf = io.BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)
grade_chart = base64.b64encode(buf.read()).decode()
plt.close()

result['charts'] = {
    'elevation': elevation_chart,
    'pace': pace_chart,
    'grade': grade_chart
}

json.dumps(result)
      `)

      const resultData = JSON.parse(result)
      setResults(resultData)
    } catch (err) {
      console.error('Calculation error:', err)
      setError('Error calculating pacing strategy: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <nav className="navbar navbar-light bg-light border-bottom">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            🏃 Pace Builder
          </span>
        </div>
      </nav>

      <main className="container-lg py-5">
        <div className="row">
          <div className="col-xl-4">
            <PacingForm
              onSubmit={handleCalculate}
              loading={loading}
              error={error}
              onErrorDismiss={() => setError(null)}
            />
          </div>
          <div className="col-xl-8">
            {results && (
              <ResultsDisplay results={results} />
            )}
            {!results && !loading && (
              <div className="alert alert-info mt-4">
                <h5>📝 Getting Started</h5>
                <p className="mb-0">
                  Load a GPX file and enter your target pace to calculate an intelligent pacing strategy
                  based on elevation and terrain. Adjust the advanced parameters for different race
                  conditions or training scenarios.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
