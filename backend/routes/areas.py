"""
routes/areas.py — GET /areas/stats.
"""

from flask import Blueprint, jsonify
from sqlalchemy import text

from db import SessionLocal

bp = Blueprint("areas", __name__)


@bp.get("/areas/stats")
def get_area_stats():
    """
    Per-area median rent and median €/m² as GeoJSON.
    ---
    tags: [areas]
    responses:
      200:
        description: A GeoJSON FeatureCollection, one Feature per area polygon.
    """
    sql = text(
        """
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(jsonb_agg(feature), '[]'::jsonb)
        ) AS geojson
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(a.geom)::jsonb,
                'properties', jsonb_build_object(
                    'area_code', a.area_code,
                    'area_name', a.area_name,
                    'listing_count', count(l.listing_id),
                    'median_rent',
                        percentile_cont(0.5) WITHIN GROUP (ORDER BY l.rent_eur),
                    'median_eur_per_m2',
                        percentile_cont(0.5) WITHIN GROUP (
                            ORDER BY l.rent_eur / NULLIF(l.size_m2, 0)
                        )
                )
            ) AS feature
            FROM areas a
            LEFT JOIN listings l
                ON ST_Contains(a.geom, l.geom)
            GROUP BY a.area_code, a.area_name, a.geom
            ORDER BY a.area_code
        ) features
        """
    )

    with SessionLocal() as session:
        row = session.execute(sql).first()

    # row.geojson is the assembled FeatureCollection (or a fallback empty one).
    geojson = row.geojson if row and row.geojson else {"type": "FeatureCollection", "features": []}
    return jsonify(geojson)
