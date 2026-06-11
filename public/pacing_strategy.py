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
    alpha_up: float = 10.0,
    alpha_down: float = 5.0,
    min_pace_frac: float = 0.5,
    max_pace_mult: float = 3.0,
    negative_split: bool = False,
    negative_split_delta: float = 30.0,
) -> Tuple[List[SegmentStats], float, bool]:
    """
    Calculate 1km segments with adjusted pacing based on gradient.
    
    Args:
        points: List of track points from GPX file
        base_pace_str: Base pace in mm:ss format
        alpha_up: Seconds added per 1% uphill grade
        alpha_down: Seconds added per 1% downhill grade
        min_pace_frac: Minimum pace as fraction of base pace
        max_pace_mult: Maximum pace as multiple of base pace
        negative_split: If True, use negative split strategy
        negative_split_delta: Seconds to slow down first half / speed up second half
    
    Returns:
        Tuple of (segments list, total distance in km, is_negative_split_active)
    """
    # Parse base pace from mm:ss format
    pace_parts = base_pace_str.split(':')
    base_pace_sec = int(pace_parts[0]) * 60 + int(pace_parts[1])

    segments = []
    current_distance = 0
    current_segment_num = 1
    segment_start_idx = 0

    i = 1
    while i < len(points):
        prev_point = points[i - 1]
        curr_point = points[i]

        # Calculate distance for this track leg
        dist = haversine_distance(
            prev_point.lat, prev_point.lon,
            curr_point.lat, curr_point.lon
        )
        current_distance += dist

        # Check if we've accumulated ~1km (or final smaller segment)
        if current_distance >= 1000:
            segment_points = points[segment_start_idx:i + 1]

            elevation_gain = 0
            elevation_loss = 0
            for j in range(1, len(segment_points)):
                ele_diff = segment_points[j].ele - segment_points[j - 1].ele
                if ele_diff > 0:
                    elevation_gain += ele_diff
                else:
                    elevation_loss += abs(ele_diff)

            # Signed grade based on net elevation change across the segment
            net_elev = segment_points[-1].ele - segment_points[0].ele
            grade_signed = (net_elev / current_distance) * 100 if current_distance > 0 else 0

            segment = SegmentStats(
                segment_num=current_segment_num,
                distance_m=current_distance,
                elevation_gain_m=elevation_gain,
                elevation_loss_m=elevation_loss,
                grade=grade_signed,
                base_pace_sec=base_pace_sec,
                adjusted_pace_sec=0,
                adjusted_pace_str="",
                segment_time_sec=0,
            )
            segments.append(segment)

            # Reset for next segment
            current_distance = 0
            current_segment_num += 1
            segment_start_idx = i

        i += 1

    # Handle remaining distance if any
    if current_distance > 0 and segment_start_idx < len(points) - 1:
        segment_points = points[segment_start_idx:]

        elevation_gain = 0
        elevation_loss = 0
        for j in range(1, len(segment_points)):
            ele_diff = segment_points[j].ele - segment_points[j - 1].ele
            if ele_diff > 0:
                elevation_gain += ele_diff
            else:
                elevation_loss += abs(ele_diff)

        net_elev = segment_points[-1].ele - segment_points[0].ele
        grade_signed = (net_elev / current_distance) * 100 if current_distance > 0 else 0

        segment = SegmentStats(
            segment_num=current_segment_num,
            distance_m=current_distance,
            elevation_gain_m=elevation_gain,
            elevation_loss_m=elevation_loss,
            grade=grade_signed,
            base_pace_sec=base_pace_sec,
            adjusted_pace_sec=0,
            adjusted_pace_str="",
            segment_time_sec=0,
        )
        segments.append(segment)

    # Total distance
    total_distance_m = sum(seg.distance_m for seg in segments)
    total_distance_km = total_distance_m / 1000 if total_distance_m > 0 else 0

    # Create per-km adjustments based on signed grade
    # alpha_up: seconds added per 1% uphill grade
    # alpha_down: seconds added per 1% downhill grade (used to speed up; applied as negative)
    # raw adjustments (seconds per km) before removing weighted mean
    raw_adj_per_km = []
    for seg in segments:
        g = seg.grade
        if g >= 0:
            raw = alpha_up * g
        else:
            raw = -alpha_down * abs(g)
        raw_adj_per_km.append(raw)

    # weight by segment distance (in km) to compute weighted mean
    segment_lengths_km = [seg.distance_m / 1000.0 for seg in segments]
    weighted_mean = 0.0
    if total_distance_km > 0:
        weighted_mean = sum(a * l for a, l in zip(raw_adj_per_km, segment_lengths_km)) / total_distance_km

    # final per-km adjustments with zero mean (weighted)
    final_adj_per_km = [a - weighted_mean for a in raw_adj_per_km]

    # Apply adjustments and compute final times
    for seg, adj in zip(segments, final_adj_per_km):
        adjusted_pace_per_km = seg.base_pace_sec + adj
        # safety clamps: keep pace within reasonable bounds relative to base pace
        min_pace = max(int(seg.base_pace_sec * min_pace_frac), 120)  # at least 2 minutes or fraction of base
        max_pace = int(seg.base_pace_sec * max_pace_mult)
        adjusted_pace_per_km = max(min_pace, min(max_pace, adjusted_pace_per_km))

        seg.adjusted_pace_sec = int(round(adjusted_pace_per_km))
        minutes = seg.adjusted_pace_sec // 60
        seconds = seg.adjusted_pace_sec % 60
        seg.adjusted_pace_str = f"{minutes}:{seconds:02d}"

        # segment time scales with actual segment distance
        seg.segment_time_sec = int(round(adjusted_pace_per_km * (seg.distance_m / 1000.0)))

    # Apply negative split strategy if enabled
    is_negative_split = False
    if negative_split and len(segments) > 1:
        # Find the transition point based on cumulative elevation gain
        # The idea: place transition after the major climbs so you conserve energy early
        total_elev_gain = sum(seg.elevation_gain_m for seg in segments)
        cumulative_elev = 0.0
        transition_idx = len(segments) // 2  # default to halfway by segment count
        
        # Find the segment after which we've completed ~60% of elevation gain
        # This allows us to tackle the hills early at a sustainable pace
        for i, seg in enumerate(segments):
            cumulative_elev += seg.elevation_gain_m
            if cumulative_elev >= total_elev_gain * 0.6:
                transition_idx = i
                break
        
        # Apply negative split adjustments
        for i, seg in enumerate(segments):
            if i < transition_idx:
                # First half: slow down by negative_split_delta seconds per km
                seg.adjusted_pace_sec = min(
                    int(seg.adjusted_pace_sec + negative_split_delta),
                    int(seg.base_pace_sec * max_pace_mult)
                )
            else:
                # Second half: speed up by negative_split_delta seconds per km
                seg.adjusted_pace_sec = max(
                    int(seg.adjusted_pace_sec - negative_split_delta),
                    max(int(seg.base_pace_sec * min_pace_frac), 120)
                )
            
            # Update string representation
            minutes = seg.adjusted_pace_sec // 60
            seconds = seg.adjusted_pace_sec % 60
            seg.adjusted_pace_str = f"{minutes}:{seconds:02d}"
            
            # Recalculate segment time with new pace
            seg.segment_time_sec = int(round(seg.adjusted_pace_sec * (seg.distance_m / 1000.0)))
        
        is_negative_split = True

    return segments, total_distance_km, is_negative_split


def format_time(seconds: int) -> str:
    """Format seconds into HH:MM:SS format."""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def print_pacing_strategy(segments: List[SegmentStats], total_distance_km: float, base_pace_str: str, is_negative_split: bool = False):
    """Print the pacing strategy in a nice table format."""
    print("\n" + "=" * 100)
    strategy_title = "PACING STRATEGY FOR YOUR RUN"
    if is_negative_split:
        strategy_title += " (NEGATIVE SPLIT)"
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
        '--alpha-up',
        type=float,
        default=10.0,
        help='Seconds added per 1%% uphill grade (default: 10)'
    )
    parser.add_argument(
        '--alpha-down',
        type=float,
        default=5.0,
        help='Seconds saved per 1%% downhill grade (default: 5)'
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
    parser.add_argument(
        '--negative-split',
        action='store_true',
        help='Use negative split strategy: start slower, finish faster'
    )
    parser.add_argument(
        '--negative-split-pace',
        type=float,
        default=30.0,
        help='Seconds to slow down first half / speed up second half (default: 30)'
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
    segments, total_distance_km, is_negative_split = calculate_segments(
        points,
        args.pace,
        alpha_up=args.alpha_up,
        alpha_down=args.alpha_down,
        min_pace_frac=args.min_pct,
        max_pace_mult=args.max_mult,
        negative_split=args.negative_split,
        negative_split_delta=args.negative_split_pace,
    )
    
    # Display results
    print_pacing_strategy(segments, total_distance_km, args.pace, is_negative_split)
    if args.csv:
        export_csv(segments, total_distance_km, args.csv)


# Only run main if executed directly from command line (not when loaded in Pyodide)
# if __name__ == '__main__':
#     main()
