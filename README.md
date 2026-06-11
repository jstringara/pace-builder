# 🏃 Pace Builder - React Edition

An intelligent pacing strategy calculator for runners that adjusts pace based on terrain elevation. Built with React, Vite, and Pyodide for client-side Python execution.

## ✨ Features

- 📍 **GPX File Processing** - Upload your own GPX track or use the included sample
- 🏃 **Intelligent Pacing** - Calculates terrain-adjusted pacing strategies
- 📊 **Advanced Analytics** - Visualize elevation profiles and pacing strategies with charts
- ⚙️ **Customizable Parameters** - Fine-tune pacing adjustments and presets
- 🏋️ **Negative Split Strategy** - Optional early conservation with later acceleration
- 📥 **CSV Export** - Download your splits for use in other tools
- 🎨 **Modern UI** - Bootstrap-based responsive design
- ⚡ **Fast** - Client-side processing with no server required

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Bootstrap 5
- **Charts**: Matplotlib (Python) → PNG Base64 embedded
- **Python Runtime**: Pyodide (runs Python entirely in the browser)
- **Deployment**: GitHub Pages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Testing the Build Locally

```bash
npm run preview
```

## 📦 Deployment to GitHub Pages

### Automatic Deployment (Recommended)

1. Make sure you have `gh-pages` in devDependencies (it's already there):
```bash
npm run deploy
```

This will:
- Build the project
- Push to the `gh-pages` branch automatically
- Your site will be live at `https://yourusername.github.io/san_giovanni/`

### Manual Deployment

1. Build: `npm run build`
2. In GitHub repository settings, enable GitHub Pages
3. Select `gh-pages` branch as the source
4. Wait a few moments for the site to build and deploy

## 📁 Project Structure

```
san_giovanni/
├── src/
│   ├── components/
│   │   ├── PacingForm.jsx          # Main input form
│   │   ├── ResultsDisplay.jsx       # Results container
│   │   ├── SummaryStats.jsx        # Summary statistics
│   │   ├── SegmentsTable.jsx       # 1km segments table
│   │   ├── ChartDisplay.jsx        # Chart display
│   │   └── *.css                   # Component styles
│   ├── App.jsx                      # Main app component
│   ├── App.css
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles
├── public/
│   ├── pacing_strategy.py          # Python backend (Pyodide)
│   └── sangiovanni.gpx             # Sample GPX file
├── index.html                       # HTML entry point
├── vite.config.js                   # Vite configuration
├── package.json                     # NPM dependencies
└── pacing_strategy.py              # Python source
```

## 🧮 How It Works

### Pacing Algorithm

The app processes your GPX route to calculate segment-by-segment pace:

1. **Segment Creation** - Route is split into ~1km segments
2. **Grade Calculation** - Computes average uphill/downhill % per segment
3. **Pace Adjustment** - Applies penalties for climbs, bonuses for descents
4. **Normalization** - Ensures average pace matches your target
5. **Safety Bounds** - Prevents extreme pace variations

### Key Parameters

| Parameter | Description | Range |
|-----------|-------------|-------|
| **Uphill Penalty** | Seconds added per 1% grade | 5-25 sec |
| **Downhill Bonus** | Seconds saved per 1% grade | 2-12 sec |
| **Min Pace** | Slowest allowed pace | 30-100% of base |
| **Max Pace** | Fastest allowed pace | 1.5-5.0× base |
| **Negative Split** | Run easier early, faster late | Toggle |

### Presets

Quick configuration templates:

- **Default** - Balanced for most conditions
- **Race Day** - Aggressive climbing penalties  
- **Training** - Conservative adjustments
- **Very Hilly** - Enhanced terrain sensitivity
- **Rolling** - Moderate rolling terrain
- **Ultra** - Energy conservation for long races

## 📈 Charts & Visualization

The app generates three charts automatically:

1. **Elevation Profile**
   - Visual terrain representation
   - Helps identify major climbs and descents

2. **Pacing Strategy**
   - Bar chart comparing base vs adjusted pace
   - See how elevation impacts your pace per segment

3. **Terrain Grade**
   - Color-coded uphill (red) and downhill (blue)
   - Quick assessment of course difficulty

## 🔧 Troubleshooting

### "Failed to initialize Python runtime"
- Check your internet connection (Pyodide downloads from CDN)
- Clear browser cache: `Ctrl+Shift+Delete` → Clear all
- Try a different browser
- First load takes 1-2 minutes while packages download

### GPX file won't load
- Verify file is valid XML with `<trkpt>` elements
- Must contain `lat`, `lon` attributes and `<ele>` element
- Try the sample file first to test your setup

### Charts don't appear
- Charts are generated in Pyodide (Python in browser)
- Wait for calculations to complete (spinner shows progress)
- Check browser console: `F12` → Console tab for errors
- Reload if stuck

## 💡 Tips

- **Sample File**: Click "Use Sample" to load `sangiovanni.gpx` for testing
- **Export**: Download CSV for use in other running apps
- **Advanced**: Toggle "Advanced Parameters" for granular control
- **Mobile**: Works on mobile, but desktop view is better for charts
- **Offline**: Once loaded, the app works offline (after first load)

## 📊 Output Data

Your results include:

| Item | Details |
|------|---------|
| **Summary Stats** | Total distance, elevation, time, avg pace |
| **Segment Table** | Per-km breakdown with adjustments |
| **Charts** | Elevation, pace, and grade visualization |
| **CSV Export** | Download splits for your watch/app |

## 🚧 Development Notes

- React handles UI and interactivity
- Pyodide runs Python backend in browser
- Matplotlib generates PNG charts
- Bootstrap provides responsive styling
- No server needed - everything client-side

## 🔮 Future Ideas

- Weather-based pace predictions
- Multiple race scenarios
- Nutrition/hydration planning
- Integration with Garmin/Strava data
- Mobile app version
- Climbing power curve adjustments

## 📄 License

MIT License - Use freely for personal projects

## 🙏 Credits

- Original algorithm: Elevation-based pacing research
- Built with: React, Vite, Bootstrap, Pyodide, Matplotlib
- Sample: San Giovanni trail running route

---

**Have questions or found a bug?** Check the console with `F12` for error messages or feel free to open an issue!
