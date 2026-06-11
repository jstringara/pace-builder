# Pace Builder

A Python script and web app that reads GPX files and generates an intelligent pacing strategy for running based on terrain elevation and gradient.

## 🌐 Try Online

**No installation needed!** Use the web interface: [Pace Builder Web App](https://jstringara.github.io/pace-builder/)

## Features

- 📍 Parses GPX track files
- 📈 Calculates elevation gain per 1km segment
- 🏔️ Adjusts pace based on grade/steepness
- ⏱️ Provides detailed pacing breakdown with 1km granularity
- 📊 Generates summary with total distance, time, and elevation gain
- 🌐 Web interface (no installation required)
- 🐍 CLI tool for advanced users
- 🏃 **Negative split strategy**: Run faster in the second half, conserving energy on early climbs

## Requirements

### For Web App
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required!

### For CLI Script
- Python 3.9+
- `uv` package manager (https://github.com/astral-sh/uv)

## Installation

The environment is managed with `uv`. Dependencies are minimal (only Python standard library).

## Usage

### Web App

Simply open the webapp in your browser and:
1. **Upload a GPX file** or click "Use Sample" to load the example
2. **Set your target pace** (e.g., 5:30/km)
3. **Configure advanced parameters** (optional):
   - Adjust uphill/downhill sensitivity
   - Set pace limits (min/max)
   - **Enable negative split strategy** to run faster in the second half
4. **Click "Calculate Pacing Strategy"** to generate your splits
5. **Download as CSV** to view or export your pacing plan

### CLI Script

```bash
uv run pacing_strategy.py <gpx_file> <pace>
```

#### Parameters

- `<gpx_file>`: Path to your GPX file (e.g., `sangiovanni.gpx`)
- `<pace>`: Target pace in `mm:ss` format (e.g., `5:30` for 5 minutes 30 seconds per kilometer)

### CLI tuning flags

- `--alpha-up`: Seconds added per 1% uphill grade (default `10.0`).
- `--alpha-down`: Seconds saved per 1% downhill grade (default `5.0`).
- `--min-pct`: Minimum pace as a fraction of base pace (default `0.5`).
- `--max-mult`: Maximum pace as a multiple of base pace (default `3.0`).
- `--negative-split`: Enable negative split strategy (run second half faster).
- `--negative-split-delta`: Pace adjustment for negative split in seconds/km (default `30.0`).

Example with tuning:

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 12 --alpha-down 6 --min-pct 0.6 --max-mult 2.5
```

Example with negative split strategy:

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30 --negative-split --negative-split-delta 30
```

### Example

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30
```

### More Examples

Run with the default terrain sensitivity:

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30
```

Make uphill segments more aggressive and downhill segments a bit gentler:

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 12 --alpha-down 4
```

Limit how much pace can vary from the base pace:

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30 --min-pct 0.7 --max-mult 2.0
```

Export the per-kilometer splits to CSV:

```bash
uv run pacing_strategy.py sangiovanni.gpx 5:30 --csv splits.csv
```

### Recommended Presets

Use these configurations for common running scenarios:

| Scenario | Command |
|----------|---------|
| **Race Day** (aggressive on climbs) | `uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 15 --alpha-down 3 --max-mult 2.5` |
| **Training Run** (conservative, safe effort) | `uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 8 --alpha-down 6 --min-pct 0.6 --max-mult 1.8` |
| **Very Hilly Terrain** (high sensitivity) | `uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 18 --alpha-down 8 --min-pct 0.5 --max-mult 3.5` |
| **Rolling Hills** (moderate adjustments) | `uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 10 --alpha-down 5` |
| **Long Ultra** (preserve energy) | `uv run pacing_strategy.py sangiovanni.gpx 5:30 --alpha-up 12 --alpha-down 4 --min-pct 0.7 --max-mult 2.0` |

## Output

The script produces:

1. **Segment Table**: Shows each 1km segment with:
   - Segment number and distance
   - Average grade (elevation gain %)
   - Elevation gain for that segment
   - Base and adjusted pace
   - Time to complete the segment

2. **Summary**: Displays:
   - Total distance
   - Total elevation gain
   - Total running time
   - Average adjusted pace

## Negative Split Strategy

**What is a negative split?** Running the second half of a race faster than the first half.

**How does it work?** 
- The script identifies where approximately 60% of your elevation gain occurs
- It slows you down before that point (conserving energy for climbs)
- It speeds you up after that point (allowing faster running on easier terrain)
- The `--negative-split-delta` parameter controls how much to adjust: 30 seconds/km means -30 sec/km in the first half, +30 sec/km in the second half

**When to use it?**
- **Hilly/mountainous courses**: Save energy early for the climbs
- **Trail running**: Sustainable pacing on technical terrain
- **Long races**: Proven strategy for consistent effort distribution
- **Training runs**: Practice running "the back half harder"

**Example:**
```bash
# Negative split with 25 sec/km adjustment (conservative)
uv run pacing_strategy.py sangiovanni.gpx 5:30 --negative-split --negative-split-delta 25

# Negative split with 40 sec/km adjustment (aggressive)
uv run pacing_strategy.py sangiovanni.gpx 5:30 --negative-split --negative-split-delta 40
```

## How It Works

### Pacing Adjustment

The script uses a simple linear model to adjust pace based on grade:

- **Base pace**: Your target pace on flat terrain
- **Grade penalty**: Each 1% of grade adds ~10 seconds per km
- **Adjusted pace**: Base pace + (grade × 10 seconds)

This accounts for the increased effort required on uphill segments.

Updated behavior (zero-mean adjustment):

- Per-kilometer adjustments are computed from the signed net grade of each segment.
- Separate sensitivity for uphill and downhill can be tuned (`--alpha-up` and `--alpha-down`).
- Adjustments are shifted by a weighted mean (weighted by segment length) so that the overall average pace equals your input base pace — i.e., the script redistributes effort rather than changing total target time.
- You can clamp how aggressive adjustments may be using `--min-pct` (minimum pace as fraction of base) and `--max-mult` (maximum pace as multiple of base).

### Distance Calculation

The script uses the **Haversine formula** to calculate distances between GPS coordinates, accounting for Earth's curvature for accurate distance measurements.

### Elevation Analysis

For each 1km segment, the script calculates:
- **Elevation gain**: Sum of all positive elevation changes
- **Elevation loss**: Sum of all negative elevation changes
- **Grade**: (Elevation gain / Distance) × 100%

## Example Output

```
================================================================================
                         PACING STRATEGY FOR YOUR RUN
================================================================================

Base pace: 5:30/km
Total distance: 10.85 km

  Km |  Dist(m) |  Grade% |  Elev Gain |  Base Pace |   Adjusted |     Time
────────────────────────────────────────────────────────────────────────────
   1 |     1003 |    0.60 |        6.0 | 5:30    |       5:35 | 00:05:35
   2 |     1001 |    0.90 |        9.0 | 5:30    |       5:38 | 00:05:38
   3 |     1000 |    1.45 |       14.5 | 5:30    |       5:44 | 00:05:44
   ...

================================================================================
                                    SUMMARY
================================================================================
Total distance: 10.85 km
Total elevation gain: 197.8 m
Total running time: 01:03:43
Average adjusted pace: 5:47/km
================================================================================
```

## Tips for Using This Script

1. **Choose a realistic base pace**: Your base pace should be achievable on relatively flat terrain
2. **The grade penalty is conservative**: It accounts for the physiological effort increase on climbs. Adjust if needed.
3. **Use the summary time**: The total time projection helps with training planning and splits
4. **Segment pacing**: Use the segment pace adjustments to guide your effort throughout the run

## License

This script is provided as-is for personal use.
