let pyodide;

// Initialize Pyodide
async function initPyodide() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("micropip");
    
    // Load the pacing_strategy module
    const response = await fetch('pacing_strategy.py');
    const pacingScript = await response.text();
    pyodide.runPython(pacingScript);
    
    console.log("✓ Pyodide initialized successfully");
}

// Load sample GPX file
document.getElementById('useSampleBtn').addEventListener('click', async function() {
    const response = await fetch('sangiovanni.gpx');
    const blob = await response.blob();
    const file = new File([blob], 'sangiovanni.gpx', { type: 'application/gpx+xml' });
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById('gpxFile').files = dataTransfer.files;
});

// Update slider value displays
document.getElementById('alphaUp').addEventListener('input', function() {
    document.getElementById('alphaUpValue').textContent = this.value;
});

document.getElementById('alphaDown').addEventListener('input', function() {
    document.getElementById('alphaDownValue').textContent = this.value;
});

document.getElementById('minPct').addEventListener('input', function() {
    document.getElementById('minPctValue').textContent = this.value + '%';
});

document.getElementById('maxMult').addEventListener('input', function() {
    document.getElementById('maxMultValue').textContent = (this.value) + '×';
});

// Handle form submission
document.getElementById('pacingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const gpxFile = document.getElementById('gpxFile').files[0];
    if (!gpxFile) {
        showError('Please select a GPX file');
        return;
    }
    
    const basePace = document.getElementById('basePace').value;
    if (!basePace.match(/\d{1,2}:\d{2}/)) {
        showError('Please enter pace in mm:ss format (e.g., 5:30)');
        return;
    }
    
    const alphaUp = parseFloat(document.getElementById('alphaUp').value);
    const alphaDown = parseFloat(document.getElementById('alphaDown').value);
    const minPct = parseFloat(document.getElementById('minPct').value) / 100;
    const maxMult = parseFloat(document.getElementById('maxMult').value);
    
    setLoading(true);
    
    try {
        // Read GPX file content
        const gpxContent = await gpxFile.text();
        
        // Run Python calculation
        const result = await pyodide.runPythonAsync(`
import json
from io import StringIO

# Parse GPX content
gpx_content = """${gpxContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""

# Create temp file-like object
from xml.etree import ElementTree as ET
root = ET.fromstring(gpx_content)

# Use the functions from pacing_strategy
points = parse_gpx_string(gpx_content)
segments, total_distance_km = calculate_segments(
    points,
    "${basePace}",
    alpha_up=${alphaUp},
    alpha_down=${alphaDown},
    min_pace_frac=${minPct},
    max_pace_mult=${maxMult},
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
json.dumps(result)
        `);
        
        const resultData = JSON.parse(result);
        displayResults(resultData, basePace);
        hideError();
    } catch (error) {
        showError('Error calculating pacing strategy: ' + error.message);
        console.error('Calculation error:', error);
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    btn.disabled = isLoading;
    spinner.style.display = isLoading ? 'inline-block' : 'none';
    document.getElementById('btnText').textContent = isLoading ? 'Calculating...' : 'Calculate Pacing Strategy';
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    document.getElementById('errorText').textContent = message;
    alert.style.display = 'block';
    alert.classList.add('show');
}

function hideError() {
    const alert = document.getElementById('errorAlert');
    alert.style.display = 'none';
    alert.classList.remove('show');
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatPace(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function displayResults(data, basePace) {
    const totalElev = data.segments.reduce((sum, seg) => sum + seg.elevation_gain_m, 0);
    const totalTime = data.segments.reduce((sum, seg) => sum + seg.segment_time_sec, 0);
    const avgPacePerKm = Math.round(totalTime / data.total_distance_km);
    
    // Update summary
    document.getElementById('totalDist').textContent = data.total_distance_km.toFixed(2);
    document.getElementById('totalElev').textContent = totalElev.toFixed(1);
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('avgPace').textContent = formatPace(avgPacePerKm);
    
    // Populate table
    const tbody = document.getElementById('segmentsTable');
    tbody.innerHTML = '';
    
    data.segments.forEach(seg => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${seg.segment_num}</strong></td>
            <td>${seg.distance_m.toFixed(0)}</td>
            <td>${seg.grade.toFixed(2)}%</td>
            <td>${seg.elevation_gain_m.toFixed(1)}</td>
            <td>${formatPace(seg.base_pace_sec)}</td>
            <td><strong>${seg.adjusted_pace_str}</strong></td>
            <td>${formatTime(seg.segment_time_sec)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// Download CSV
document.getElementById('downloadCsv').addEventListener('click', function() {
    const tbody = document.getElementById('segmentsTable');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    let csv = 'Segment,Distance (m),Grade (%),Elevation Gain (m),Base Pace,Adjusted Pace,Time\n';
    
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(cell => {
            const text = cell.textContent.trim();
            return `"${text}"`;
        });
        csv += cells.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pace_builder_splits.csv';
    link.click();
});

// Initialize on page load
window.addEventListener('load', initPyodide);
