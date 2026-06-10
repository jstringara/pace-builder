#!/usr/bin/env python3
"""
GPX-based pacing strategy calculator - Web Module
Adjusts running pace based on terrain elevation/gradient.
"""

import xml.etree.ElementTree as ET
from dataclasses import dataclass
from math import radians, sin, cos, sqrt, atan2
from typing import List, Tuple


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
    """Parse GPX content from string and extract track points."""
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
) -> Tuple[List[SegmentStats], float]:
    """
    Calculate 1km segments with adjusted pacing based on gradient.
    
    Returns:
        Tuple of (segments list, total distance in km)
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

    return segments, total_distance_km
