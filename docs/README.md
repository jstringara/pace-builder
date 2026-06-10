# Pace Builder Web App

A web interface for the Pace Builder pacing strategy calculator.

## Usage

1. **Upload a GPX file** or click "Use Sample" to load the example route
2. **Set your target pace** (default: 5:30/km)
3. **Adjust parameters** (optional):
   - **Uphill Penalty**: How much slower you go uphill (seconds per 1% grade)
   - **Downhill Bonus**: How much faster you go downhill (seconds per 1% grade)
   - **Minimum/Maximum Pace**: Bounds to keep your pace realistic
4. **Calculate** to see your personalized pacing strategy
5. **Download CSV** to export your splits

## How It Works

The web app uses:
- **Pyodide** to run your Python pacing strategy code directly in the browser
- **Bootstrap** for responsive, clean UI
- **JavaScript** for the interactive interface

No server is needed — all calculations happen locally on your device!

## Running Locally

For development, you can serve the docs folder locally:

```bash
# Using Python's built-in server
cd docs
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

## Deploying to GitHub Pages

GitHub Pages is automatically configured to serve the `docs/` folder. Simply push changes to the repository:

```bash
git add docs/
git commit -m "Update web app"
git push origin main
```

Visit `https://YOUR_USERNAME.github.io/pace-builder` to see your live app.

## Files

- `index.html` - Main web interface
- `app.js` - JavaScript app logic and Pyodide integration
- `styles.css` - Styling
- `pacing_strategy.py` - Python calculator (runs in browser via Pyodide)
- `sangiovanni.gpx` - Sample GPX file for testing
