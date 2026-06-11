"""
Main calculator module for pace strategy.
Orchestrates GPX parsing, segment calculation, and chart generation.
"""

import json


def calculate_pacing_strategy(gpx_content, base_pace, alpha_up, alpha_down, min_pace_frac, 
                             max_pace_mult, negative_split, negative_split_delta):
    """
    Main function to calculate pacing strategy and generate charts.
    
    Args:
        gpx_content: GPX file content as string
        base_pace: Base pace in mm:ss format
        alpha_up: Seconds added per 1% uphill grade
        alpha_down: Seconds added per 1% downhill grade
        min_pace_frac: Minimum pace as fraction of base pace
        max_pace_mult: Maximum pace as multiple of base pace
        negative_split: Whether to use negative split strategy
        negative_split_delta: Seconds to adjust for negative split
    
    Returns:
        JSON string containing results and charts
    """
    # Parse GPX and calculate segments
    # These functions are defined in pacing_strategy.py which is loaded first
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

    # Build results dictionary
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

    # Generate all charts using functions defined in chart_generator.py
    # which is loaded before this module
    charts = generate_all_charts(segments, points, haversine_distance)
    result['charts'] = charts

    return json.dumps(result)
