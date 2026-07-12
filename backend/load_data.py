"""
load_data.py — fills the database from the two source files.

Steps:
    1. Ensure PostGIS is enabled and the tables exist (create_all from models).
    2. Read listings.csv, CLEAN each row (a few have missing values / one has an
       out-of-area coordinate), insert the good ones as spatial points.
    3. Read helsinki_areas.geojson, insert the 12 polygons.
    4. Print a summary so you can SEE what was dropped/kept and why.
"""

import csv
import json

from sqlalchemy import text

from config import AREAS_GEOJSON, LISTINGS_CSV
from db import Base, SessionLocal, engine

# Importing models registers the tables on Base so create_all knows about them.
import models  # noqa: F401


# Metro bounding box used to reject gross out-of-area coordinates. Padded a
# little around the 12 polygons' extent so a legit edge listing isn't dropped;
# only obvious errors (like L0780 at lat 61.05, ~83 km north) are removed.
METRO_MIN_LNG, METRO_MAX_LNG = 24.60, 25.20
METRO_MIN_LAT, METRO_MAX_LAT = 60.10, 60.35


def _to_float(value):
    """Parse a CSV cell to float, or None if empty/unparseable.
    """
    if value is None or value.strip() == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _to_int(value):
    """Parse a CSV cell to int, or None. Parses via float so '3.0' -> 3."""
    f = _to_float(value)
    return None if f is None else int(f)


def _coord_ok(lat, lng):
    """A listing is placeable only if it has coordinates inside the metro box."""
    if lat is None or lng is None:
        return False
    return (
        METRO_MIN_LAT <= lat <= METRO_MAX_LAT
        and METRO_MIN_LNG <= lng <= METRO_MAX_LNG
    )


def load_areas(session):
    """Insert the 12 polygons from the GeoJSON FeatureCollection."""
    with open(AREAS_GEOJSON, encoding="utf-8") as f:
        fc = json.load(f)

    session.execute(text("TRUNCATE areas;"))
    count = 0
    for feature in fc["features"]:
        props = feature["properties"]
        # ST_GeomFromGeoJSON parses the geometry; we bind the geometry as a JSON
        # STRING parameter (never string-formatted into the SQL) and force SRID
        # 4326 to match the column. :name placeholders are SQLAlchemy's bound
        # parameters — injection-safe.
        session.execute(
            text(
                """
                INSERT INTO areas (area_code, area_name, geom)
                VALUES (
                    :area_code, :area_name,
                    ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)
                )
                """
            ),
            {
                "area_code": props["area_code"],
                "area_name": props["area_name"],
                "geom": json.dumps(feature["geometry"]),
            },
        )
        count += 1
    print(f"Areas: inserted={count}")


def load_listings(session):
    """Clean and insert listings; print a per-reason breakdown."""
    session.execute(text("TRUNCATE listings;"))

    inserted = 0
    dropped_bad_coord = 0
    kept_with_null = 0

    with open(LISTINGS_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lat = _to_float(row.get("latitude"))
            lng = _to_float(row.get("longitude"))

            # Rule 1: a listing must have a usable location, else it's useless
            # to a map — drop it (and log which one and why).
            if not _coord_ok(lat, lng):
                dropped_bad_coord += 1
                print(
                    f"  DROP  {row.get('listing_id')}: bad/out-of-area coord "
                    f"lat={row.get('latitude')!r} lng={row.get('longitude')!r}"
                )
                continue

            rooms = _to_int(row.get("rooms"))
            size_m2 = _to_float(row.get("size_m2"))
            rent_eur = _to_int(row.get("rent_eur"))
            property_type = (row.get("property_type") or "").strip() or None
            listed_date = (row.get("listed_date") or "").strip() or None

            # Rule 2: missing attribute -> keep the row, store NULL (still a
            # valid map point; the NULL just excludes it from that aggregate).
            if rooms is None or size_m2 is None or rent_eur is None:
                kept_with_null += 1
                missing = [
                    n for n, v in (("rooms", rooms), ("size_m2", size_m2), ("rent_eur", rent_eur))
                    if v is None
                ]
                print(f"  KEEP  {row.get('listing_id')}: NULL {', '.join(missing)}")

            # Build the point server-side. NOTE ST_MakePoint takes (X, Y) =
            # (longitude, latitude) — NOT (lat, lng). Swapping them is the classic
            # PostGIS bug (points end up in the wrong place).
            session.execute(
                text(
                    """
                    INSERT INTO listings
                        (listing_id, rooms, size_m2, rent_eur,
                         property_type, listed_date, geom)
                    VALUES
                        (:listing_id, :rooms, :size_m2, :rent_eur,
                         :property_type, :listed_date,
                         ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                    """
                ),
                {
                    "listing_id": row["listing_id"].strip(),
                    "rooms": rooms,
                    "size_m2": size_m2,
                    "rent_eur": rent_eur,
                    "property_type": property_type,
                    "listed_date": listed_date,
                    "lng": lng,
                    "lat": lat,
                },
            )
            inserted += 1

    print(
        f"Listings: inserted={inserted}  "
        f"dropped_bad_coord={dropped_bad_coord}  kept_with_null={kept_with_null}"
    )


def main():
    print(f"Loading from:\n  CSV     = {LISTINGS_CSV}\n  GeoJSON = {AREAS_GEOJSON}\n")

    # Make sure PostGIS + the tables exist before inserting. create_all reads the
    # models and creates any table (and its GiST index) that isn't there yet.
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    Base.metadata.create_all(engine)

    # One transaction for the whole load: any failure rolls back, so we never end
    # up with a half-populated database.
    with SessionLocal() as session:
        load_areas(session)
        load_listings(session)
        session.commit()

    print("\nLoad complete.")


if __name__ == "__main__":
    main()
