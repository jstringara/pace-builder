#!/usr/bin/env python3
"""
GPX-based pacing strategy calculator.
Adjusts running pace based on terrain elevation/gradient.
"""

import argparse
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from math import radians, sin, cos, sqrt, atan2
from typing import List, Tuple
import csv


@dataclass
class TrackPoint:
    """A single point in the track."""
    lat: float
    lon: float
    ele: float  # elevation in meters
    time: str


@dataclass
class MicroSector:
    """A point-to-point segment with raw and normalized effort."""
    distance_m: float
    elevation_diff_m: float
    grade: float  # gradient as fraction (e.g., 0.05 for 5%)
    raw_time_sec: float  # time before normalization
    final_time_sec: float  # time after normalization


@dataclass
class SegmentStats:
    """Statistics for a 1km segment."""
    segment_num: int
    distance_m: float
    elevation_gain_m: float
    elevation_loss_m: float
    grade: float  # average gradient as percentage
    base_pace_sec: int  # pace in seconds per km
    adjusted_pace_sec: int  # adjusted for gradient
    adjusted_pace_str: str  # formatted as mm:ss
    segment_time_sec: int  # time to complete segment


def parse_gpx(file_path: str) -> List[TrackPoint]:
    """Parse GPX file and extract track points."""
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Handle namespace
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}
    
    points = []
    for trkpt in root.findall('.//gpx:trkpt', ns):
        lat = float(trkpt.get('lat'))
        lon = float(trkpt.get('lon'))
        
        ele_elem = trkpt.find('gpx:ele', ns)
        time_elem = trkpt.find('gpx:time', ns)
        
        ele = float(ele_elem.text) if ele_elem is not None else 0
        time = time_elem.text if time_elem is not None else ""
        
        points.append(TrackPoint(lat=lat, lon=lon, ele=ele, time=time))
    
    return points


def parse_gpx_string(gpx_content: str) -> List[TrackPoint]:
    """Parse GPX content from a string and extract track points."""
    root = ET.fromstring(gpx_content)
    # Handle namespace
    ns = {'gpx': 'http://www.topografix.com/GPX/1/1'}

    points = []
    for trkpt in root.findall('.//gpx:trkpt', ns):
        lat = float(trkpt.get('lat'))
        lon = float(trkpt.get('lon'))

        ele_elem = trkpt.find('gpx:ele', ns)
        time_elem = trkpt.find('gpx:time', ns)

        ele = float(ele_elem.text) if ele_elem is not None else 0
        time = time_elem.text if time_elem is not None else ""

        points.append(TrackPoint(lat=lat, lon=lon, ele=ele, time=time))

    return points


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates in meters.
    Uses haversine formula.
    """
    R = 6371000  # Earth radius in meters
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c


def calculate_segments(
    points: List[TrackPoint],
    base_pace_str: str,
    c1: float = 1.5,
    c2: float = 6.5,
    split_variance: float = 0.05,
    min_pace_frac: float = 0.5,
    max_pace_mult: float = 3.0,
) -> Tuple[List[SegmentStats], float]:
    """
    Calculate 1km segments using micro-sector architecture with 4-pass algorithm.
    
    Args:
        points: List of track points from GPX file
        base_pace_str: Base pace in mm:ss format
        c1: Effort coefficient for linear grade term (default: 1.5)
        c2: Effort coefficient for quadratic grade term (default: 6.5)
        split_variance: Strategy multiplier variance for negative/positive split (default: 0.05)
        min_pace_frac: Minimum pace as fraction of base pace
        max_pace_mult: Maximum pace as multiple of base pace
    
    Returns:
        Tuple of (segments list, total distance in km)
    """
    # Parse base pace from mm:ss format
    pace_parts = base_pace_str.split(':')
    base_pace_sec = int(pace_parts[0]) * 60 + int(pace_parts[1])
    
    # === PASS 1: Prep ===
    # Calculate total distance and create micro-sectors
    micro_sectors = []
    total_distance_m = 0.0
    
    for i in range(1, len(points)):
        prev_point = points[i - 1]
        curr_point = points[i]
        
        # Calculate distance for this point-to-point segment
        dist_m = haversine_distance(
            prev_point.lat, prev_point.lon,
            curr_point.lat, curr_point.lon
        )
        
        # Calculate elevation difference
        elev_diff = curr_point.ele - prev_point.ele
        
        # Calculate grade as fraction (e.g., 0.05 for 5% uphill)
        grade = (elev_diff / dist_m) if dist_m > 0 else 0.0
        
        total_distance_m += dist_m
        
        micro_sectors.append(MicroSector(
            distance_m=dist_m,
            elevation_diff_m=elev_diff,
            grade=grade,
            raw_time_sec=0.0,
            final_time_sec=0.0,
        ))
    
    if not micro_sectors:
        return [], 0.0
    
    # Target total time based on base pace
    base_pace_sec_per_m = base_pace_sec / 1000.0  # seconds per meter
    target_total_time_sec = total_distance_m * base_pace_sec_per_m
    
    # === PASS 2: Physics & Strategy ===
    # Calculate raw time for each micro-sector with effort and strategy multipliers
    cumulative_distance = 0.0
    sum_raw_times = 0.0
    
    for sector in micro_sectors:
        # Effort Multiplier: E(g) = 1 + (c1 * g) + (c2 * g^2)
        # where g is grade as fraction
        effort_mult = 1.0 + (c1 * sector.grade) + (c2 * sector.grade ** 2)
        
        # Strategy Multiplier: S(x) = 1 + (split_variance * (0.5 - fraction_of_race))
        # This implements negative split: slower at start (when x < 0.5), faster at end
        fraction_complete = cumulative_distance / total_distance_m if total_distance_m > 0 else 0.5
        strategy_mult = 1.0 + (split_variance * (0.5 - fraction_complete))
        
        # Raw time: dist * base_pace_per_meter * effort * strategy
        sector.raw_time_sec = sector.distance_m * base_pace_sec_per_m * effort_mult * strategy_mult
        sum_raw_times += sector.raw_time_sec
        
        cumulative_distance += sector.distance_m
    
    # === PASS 3: Normalize ===
    # Calculate normalization factor to hit exact target time
    normalization_factor = target_total_time_sec / sum_raw_times if sum_raw_times > 0 else 1.0
    
    for sector in micro_sectors:
        sector.final_time_sec = sector.raw_time_sec * normalization_factor
    
    # === PASS 4: Aggregate ===
    # Group micro-sectors into 1km segments
    segments = []
    current_segment_num = 1
    current_distance = 0.0
    segment_start_idx = 0
    
    for i, sector in enumerate(micro_sectors):
        current_distance += sector.distance_m
        
        # Check if we've accumulated ~1km or if this is the last sector
        if current_distance >= 1000 or i == len(micro_sectors) - 1:
            # Aggregate micro-sectors for this 1km segment
            segment_sectors = micro_sectors[segment_start_idx:i+1]
            
            total_segment_distance = sum(s.distance_m for s in segment_sectors)
            total_segment_elevation_gain = sum(max(0, s.elevation_diff_m) for s in segment_sectors)
            total_segment_elevation_loss = sum(max(0, -s.elevation_diff_m) for s in segment_sectors)
            total_segment_time = sum(s.final_time_sec for s in segment_sectors)
            
            # Average grade for this segment
            net_elev = sum(s.elevation_diff_m for s in segment_sectors)
            avg_grade = (net_elev / total_segment_distance * 100) if total_segment_distance > 0 else 0.0
            
            # Calculate adjusted pace (seconds per km)
            adjusted_pace_sec_per_km = (total_segment_time / (total_segment_distance / 1000.0)) if total_segment_distance > 0 else base_pace_sec
            
            # Apply safety clamps
            min_pace = max(int(base_pace_sec * min_pace_frac), 120)  # at least 2 minutes
            max_pace = int(base_pace_sec * max_pace_mult)
            adjusted_pace_sec_per_km = max(min_pace, min(max_pace, adjusted_pace_sec_per_km))
            
            minutes = int(adjusted_pace_sec_per_km) // 60
            seconds = int(adjusted_pace_sec_per_km) % 60
            adjusted_pace_str = f"{minutes}:{seconds:02d}"
            
            segment = SegmentStats(
                segment_num=current_segment_num,
                distance_m=total_segment_distance,
                elevation_gain_m=total_segment_elevation_gain,
                elevation_loss_m=total_segment_elevation_loss,
                grade=avg_grade,
                base_pace_sec=base_pace_sec,
                adjusted_pace_sec=int(round(adjusted_pace_sec_per_km)),
                adjusted_pace_str=adjusted_pace_str,
                segment_time_sec=int(round(total_segment_time)),
            )
            segments.append(segment)
            
            # Reset for next segment
            current_distance = 0.0
            current_segment_num += 1
            segment_start_idx = i + 1
    
    total_distance_km = total_distance_m / 1000.0 if total_distance_m > 0 else 0.0
    return segments, total_distance_km


def format_time(seconds: int) -> str:
    """Format seconds into HH:MM:SS format."""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def print_pacing_strategy(segments: List[SegmentStats], total_distance_km: float, base_pace_str: str):
    """Print the pacing strategy in a nice table format."""
    print("\n" + "=" * 100)
    strategy_title = "PACING STRATEGY FOR YOUR RUN"
    print(strategy_title.center(100))
    print("=" * 100)
    
    print(f"\nBase pace: {base_pace_str}/km")
    print(f"Total distance: {total_distance_km:.2f} km\n")
    
    print(f"{'Km':>4} | {'Dist(m)':>8} | {'Grade%':>7} | {'Elev Gain':>10} | {'Base Pace':>10} | {'Adjusted':>10} | {'Time':>8}")
    print("-" * 100)
    
    total_time_sec = 0
    total_elevation_gain = 0
    
    for seg in segments:
        total_time_sec += seg.segment_time_sec
        total_elevation_gain += seg.elevation_gain_m
        
        print(
            f"{seg.segment_num:>4} | {seg.distance_m:>8.0f} | {seg.grade:>7.2f} | "
            f"{seg.elevation_gain_m:>10.1f} | {seg.base_pace_sec//60}:{seg.base_pace_sec%60:02d}    | "
            f"{seg.adjusted_pace_str:>10} | {format_time(seg.segment_time_sec):>8}"
        )
    
    print("-" * 100)
    
    print("\n" + "=" * 100)
    print("SUMMARY".center(100))
    print("=" * 100)
    print(f"Total distance: {total_distance_km:.2f} km")
    print(f"Total elevation gain: {total_elevation_gain:.1f} m")
    print(f"Total running time: {format_time(total_time_sec)}")
    # Average adjusted pace (seconds per km)
    avg_pace_sec_per_km = int(round(total_time_sec / total_distance_km)) if total_distance_km > 0 else 0
    print(f"Average adjusted pace: {avg_pace_sec_per_km // 60}:{avg_pace_sec_per_km % 60:02d}/km")
    print("=" * 100 + "\n")


def export_csv(segments: List[SegmentStats], total_distance_km: float, csv_path: str):
    """Export per-segment splits and summary to CSV."""
    fieldnames = [
        'segment', 'distance_m', 'elevation_gain_m', 'elevation_loss_m', 'grade_pct',
        'base_pace_sec', 'adjusted_pace_sec', 'adjusted_pace_str', 'segment_time_sec'
    ]
    try:
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for seg in segments:
                writer.writerow({
                    'segment': seg.segment_num,
                    'distance_m': f"{seg.distance_m:.1f}",
                    'elevation_gain_m': f"{seg.elevation_gain_m:.2f}",
                    'elevation_loss_m': f"{seg.elevation_loss_m:.2f}",
                    'grade_pct': f"{seg.grade:.4f}",
                    'base_pace_sec': seg.base_pace_sec,
                    'adjusted_pace_sec': seg.adjusted_pace_sec,
                    'adjusted_pace_str': seg.adjusted_pace_str,
                    'segment_time_sec': seg.segment_time_sec,
                })

            # write summary row
            writer.writerow({
                'segment': 'TOTAL',
                'distance_m': f"{total_distance_km * 1000:.1f}",
                'elevation_gain_m': '',
                'elevation_loss_m': '',
                'grade_pct': '',
                'base_pace_sec': '',
                'adjusted_pace_sec': '',
                'adjusted_pace_str': '',
                'segment_time_sec': sum(s.segment_time_sec for s in segments),
            })
        print(f"✓ Exported splits to {csv_path}")
    except Exception as e:
        print(f"Error exporting CSV: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Calculate pacing strategy for a run based on GPX file and terrain elevation."
    )
    parser.add_argument(
        'gpx_file',
        help='Path to the GPX file'
    )
    parser.add_argument(
        'pace',
        help='Target pace in mm:ss/km format (e.g., 5:30)'
    )
    parser.add_argument(
        '--c1',
        type=float,
        default=1.5,
        help='Effort coefficient for linear grade term (default: 1.5)'
    )
    parser.add_argument(
        '--c2',
        type=float,
        default=6.5,
        help='Effort coefficient for quadratic grade term (default: 6.5)'
    )
    parser.add_argument(
        '--split-variance',
        type=float,
        default=0.05,
        help='Strategy multiplier variance for negative/positive split (default: 0.05)'
    )
    parser.add_argument(
        '--min-pct',
        type=float,
        default=0.5,
        help='Minimum pace as fraction of base pace (default: 0.5)'
    )
    parser.add_argument(
        '--max-mult',
        type=float,
        default=3.0,
        help='Maximum pace as multiple of base pace (default: 3.0)'
    )
    parser.add_argument(
        '--csv',
        dest='csv',
        help='Path to CSV output file to write per-km splits',
        default=None,
    )
    
    args = parser.parse_args()
    
    # Validate pace format
    try:
        pace_parts = args.pace.split(':')
        if len(pace_parts) != 2:
            raise ValueError
        int(pace_parts[0])
        int(pace_parts[1])
    except (ValueError, IndexError):
        print("Error: Pace must be in mm:ss format (e.g., 5:30)")
        return
    
    # Parse GPX file
    try:
        points = parse_gpx(args.gpx_file)
        if not points:
            print("Error: No track points found in GPX file")
            return
        print(f"✓ Loaded {len(points)} track points from {args.gpx_file}")
    except FileNotFoundError:
        print(f"Error: File '{args.gpx_file}' not found")
        return
    except Exception as e:
        print(f"Error parsing GPX file: {e}")
        return
    
    # Calculate segments and pacing
    segments, total_distance_km = calculate_segments(
        points,
        args.pace,
        c1=args.c1,
        c2=args.c2,
        split_variance=args.split_variance,
        min_pace_frac=args.min_pct,
        max_pace_mult=args.max_mult,
    )
    
    # Display results
    print_pacing_strategy(segments, total_distance_km, args.pace)
    if args.csv:
        export_csv(segments, total_distance_km, args.csv)


# Only run main if executed directly from command line (not when loaded in Pyodide)
# if __name__ == '__main__':
#     main()
