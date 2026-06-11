"""
Chart generation module for pace strategy visualization.
Generates Strava-style charts to visualize elevation, pace, and terrain data.
"""

import io
import base64
from matplotlib import pyplot as plt
import numpy as np


def interpolate_elevation_at_distance(points, target_distance_km, haversine_distance):
    """
    Interpolate elevation at a specific distance along the route.
    """
    cumulative_dist = 0
    target_dist_m = target_distance_km * 1000
    
    for i in range(1, len(points)):
        seg_dist = haversine_distance(points[i-1].lat, points[i-1].lon, 
                                      points[i].lat, points[i].lon)
        if cumulative_dist + seg_dist >= target_dist_m:
            frac = (target_dist_m - cumulative_dist) / seg_dist if seg_dist > 0 else 0
            ele = points[i-1].ele + frac * (points[i].ele - points[i-1].ele)
            return ele
        cumulative_dist += seg_dist
    
    return points[-1].ele


def get_smooth_elevation_profile(points, haversine_distance, num_samples=150):
    """
    Get smooth elevation profile for visualization.
    """
    distances = []
    elevations = []
    cumulative = 0
    
    # Calculate total distance first to ensure we span the full route
    total_distance = 0
    for i in range(1, len(points)):
        seg_dist = haversine_distance(points[i-1].lat, points[i-1].lon, 
                                      points[i].lat, points[i].lon)
        total_distance += seg_dist
    
    # Always add first point
    distances.append(0)
    elevations.append(points[0].ele)
    
    # Sample points throughout the route
    cumulative = 0
    for i in range(1, len(points)):
        seg_dist = haversine_distance(points[i-1].lat, points[i-1].lon, 
                                      points[i].lat, points[i].lon)
        cumulative += seg_dist / 1000  # Convert to km
        
        # Sample based on distance interval
        target_interval = total_distance / 1000 / num_samples  # km between samples
        
        if i > 1 and (len(distances) < num_samples or 
                     (cumulative - distances[-1]) >= target_interval * 0.9):
            distances.append(cumulative)
            elevations.append(points[i].ele)
    
    # Always add final point to ensure we reach the end
    if distances[-1] < cumulative - 0.01:
        distances.append(cumulative)
        elevations.append(points[-1].ele)
    
    return distances, elevations


def generate_elevation_profile_chart(segments, points, haversine_distance):
    """
    Generate elevation profile chart.
    """
    fig, ax = plt.subplots(figsize=(12, 5), dpi=80)
    
    all_distances, all_elevations = get_smooth_elevation_profile(points, haversine_distance)

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
    chart_image = base64.b64encode(buf.read()).decode()
    plt.close()
    
    return chart_image


def generate_elevation_pace_profile_chart(segments, points, haversine_distance):
    """
    Generate combined elevation and pace profile chart (Strava-style).
    """
    fig, ax1 = plt.subplots(figsize=(14, 6), dpi=80)

    # Calculate cumulative distance for segments
    cumulative_distances = [0]
    for seg in segments:
        cumulative_distances.append(cumulative_distances[-1] + seg.distance_m / 1000)

    # Get smooth elevation profile for background
    all_distances, all_elevations = get_smooth_elevation_profile(points, haversine_distance)

    # Plot smooth elevation on left y-axis
    color_elev = '#3b82f6'
    ax1.fill_between(all_distances, all_elevations, alpha=0.2, color=color_elev)
    ax1.plot(all_distances, all_elevations, linewidth=2.5, color=color_elev, label='Elevation', zorder=3)
    ax1.set_xlabel('Distance (km)', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Elevation (m)', fontsize=12, fontweight='bold', color=color_elev)
    ax1.tick_params(axis='y', labelcolor=color_elev)
    ax1.grid(True, alpha=0.2, zorder=1)
    ax1.set_facecolor('#f8f9fa')

    # Create right y-axis for pace
    ax2 = ax1.twinx()
    adjusted_paces = [seg.adjusted_pace_sec / 60 for seg in segments]
    base_pace_min = segments[0].base_pace_sec / 60 if segments else 5.5
    
    # Calculate bar positions and widths
    bar_positions = cumulative_distances[:-1]  # Start positions of bars
    bar_widths = [cumulative_distances[i+1] - cumulative_distances[i] for i in range(len(segments))]
    
    # Calculate pace deviation from base pace (positive = faster, negative = slower)
    pace_deviations = [base_pace_min - pace for pace in adjusted_paces]
    
    # Plot pace as bar chart with bars inverted (faster above the base line, slower below)
    ax2.bar(bar_positions, pace_deviations, width=bar_widths, bottom=base_pace_min,
            color='#f59e0b', label='Adjusted Pace', alpha=0.6, edgecolor='#d97706', linewidth=1.5, zorder=4, align='edge')
    
    # Add horizontal dotted line for base pace
    ax2.axhline(y=base_pace_min, color='#666666', linestyle='--', linewidth=2, label='Base Pace', zorder=3)
    
    ax2.set_ylabel('Pace (min/km)', fontsize=12, fontweight='bold', color='#f59e0b')
    ax2.tick_params(axis='y', labelcolor='#f59e0b')

    # Combine legends
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', framealpha=0.95, fontsize=11)

    ax1.set_title('Elevation Profile & Pace Strategy', fontsize=14, fontweight='bold', pad=15)
    fig.patch.set_facecolor('white')
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    chart_image = base64.b64encode(buf.read()).decode()
    plt.close()
    
    return chart_image


def generate_grade_distribution_chart(segments):
    """
    Generate terrain grade distribution chart.
    """
    fig, ax = plt.subplots(figsize=(12, 5), dpi=80)
    
    segment_nums = [seg.segment_num for seg in segments]
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
    chart_image = base64.b64encode(buf.read()).decode()
    plt.close()
    
    return chart_image


def generate_pace_vs_terrain_chart(segments):
    """
    Generate pace vs terrain grade analysis chart (Strava-style insights).
    """
    fig, ax = plt.subplots(figsize=(12, 6), dpi=80)

    grades = [seg.grade for seg in segments]
    adjusted_paces = [seg.adjusted_pace_sec / 60 for seg in segments]
    elevation_gains = [seg.elevation_gain_m for seg in segments]

    # Color points by elevation gain
    scatter = ax.scatter(grades, adjusted_paces, s=np.array(elevation_gains) * 3 + 100, 
                        c=elevation_gains, cmap='YlOrRd', alpha=0.7, edgecolors='black', linewidth=1.5)

    # Add trend line
    z = np.polyfit(grades, adjusted_paces, 2)
    p = np.poly1d(z)
    grades_sorted = np.linspace(min(grades), max(grades), 100)
    ax.plot(grades_sorted, p(grades_sorted), "r--", linewidth=2, alpha=0.8, label='Trend')

    ax.set_xlabel('Grade (%)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Adjusted Pace (min/km)', fontsize=12, fontweight='bold')
    ax.set_title('Pace vs Terrain Grade (Bubble size = Elevation Gain)', fontsize=13, fontweight='bold', pad=15)
    ax.grid(True, alpha=0.3)
    ax.set_facecolor('#f8f9fa')

    # Add colorbar
    cbar = plt.colorbar(scatter, ax=ax)
    cbar.set_label('Elevation Gain (m)', fontsize=11, fontweight='bold')

    ax.legend(loc='upper left', framealpha=0.9)
    fig.patch.set_facecolor('white')
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    chart_image = base64.b64encode(buf.read()).decode()
    plt.close()
    
    return chart_image


def generate_all_charts(segments, points, haversine_distance):
    """
    Generate all charts for pacing strategy visualization.
    """
    return {
        'elevation': generate_elevation_profile_chart(segments, points, haversine_distance),
        'pace': generate_elevation_pace_profile_chart(segments, points, haversine_distance),
        'grade': generate_grade_distribution_chart(segments),
        'terrain_pace': generate_pace_vs_terrain_chart(segments),
    }

