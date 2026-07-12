from flask import Blueprint, jsonify, request
from sqlalchemy import text

from db import SessionLocal
from validation import parse_listings_filters, parse_near_params

# A Blueprint groups related routes; app.py registers it on the Flask app.
bp = Blueprint("listings", __name__)


def _rows_to_dicts(result):
    """Turn a SQLAlchemy Result into a list of plain dicts for jsonify."""
    return [dict(row._mapping) for row in result]


@bp.get("/listings")
def get_listings():
    """
    List listings, filtered by map viewport (bbox) and attributes.
    ---
    tags: [listings]
    parameters:
      - {in: query, name: min_lng, type: number, required: false, description: "Bounding box west edge (all four bbox params required together)"}
      - {in: query, name: min_lat, type: number, required: false, description: "Bounding box south edge"}
      - {in: query, name: max_lng, type: number, required: false, description: "Bounding box east edge"}
      - {in: query, name: max_lat, type: number, required: false, description: "Bounding box north edge"}
      - {in: query, name: rent_min, type: integer, required: false, description: "Minimum rent in EUR"}
      - {in: query, name: rent_max, type: integer, required: false, description: "Maximum rent in EUR"}
      - {in: query, name: rooms, type: integer, required: false, description: "Exact number of rooms"}
      - {in: query, name: property_type, type: string, required: false, enum: [apartment, studio, townhouse]}
    responses:
      200:
        description: Matching listings with a count.
      400:
        description: Invalid query parameters.
    """
    # Validate first — bad input becomes a 400 before we touch the DB.
    f = parse_listings_filters(request.args)

    # NULL-guarded WHERE: each filter clause is "(:param IS NULL OR <cond>)". When
    # a filter is omitted its param is NULL, so that clause is always true and
    # disappears — one static, fully-parameterized query serves every filter
    # combination, with no string concatenation.
    #
    # The bbox uses `geom && ST_MakeEnvelope(...)`: the && (bbox-overlap) operator
    # is the one the GiST index accelerates.
    #
    # The ::type casts on the NULL guards tell Postgres each parameter's type;
    # without them a param used only in ":p IS NULL" has no inferable type and
    # errors with "could not determine data type of parameter".
    sql = text(
        """
        SELECT
            listing_id, rooms, size_m2, rent_eur, property_type, listed_date,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            CASE
                WHEN rent_eur IS NOT NULL AND size_m2 IS NOT NULL
                THEN ROUND(rent_eur / NULLIF(size_m2, 0), 2)
            END AS eur_per_m2
        FROM listings
        WHERE
            (CAST(:min_lng AS float) IS NULL OR
             geom && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326))
            AND (CAST(:rent_min AS int) IS NULL OR rent_eur >= :rent_min)
            AND (CAST(:rent_max AS int) IS NULL OR rent_eur <= :rent_max)
            AND (CAST(:rooms AS int) IS NULL OR rooms = :rooms)
            AND (CAST(:property_type AS text) IS NULL OR property_type = :property_type)
        ORDER BY listing_id
        """
    )
    params = {
        "min_lng": f["min_lng"], "min_lat": f["min_lat"],
        "max_lng": f["max_lng"], "max_lat": f["max_lat"],
        "rent_min": f["rent_min"], "rent_max": f["rent_max"],
        "rooms": f["rooms"], "property_type": f["property_type"],
    }

    with SessionLocal() as session:
        rows = _rows_to_dicts(session.execute(sql, params))

    return jsonify({"count": len(rows), "listings": rows})
