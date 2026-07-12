# Data Notes

Quick inspection of the two provided source files, done before writing any code.
These findings drive the schema and the loader's cleaning rules.

## listings.csv
- **850 rows** (plus header).
- Columns: `listing_id, latitude, longitude, rooms, size_m2, rent_eur,
  property_type, listed_date`.
- `property_type` values seen: **apartment, studio, townhouse**.
- Coordinate extent of valid rows: lng ~24.64–25.12, lat ~60.15–60.30
  (the Helsinki metro area).

### Messy rows (the data is "broadly clean but not perfect")
| Row | Issue | Planned handling |
|-----|-------|------------------|
| `L0452` | missing `rooms` | keep row; store `rooms = NULL` |
| `L0490` | missing `rent_eur` | keep row; excluded from rent medians (SQL skips NULL) |
| `L0687` | missing `size_m2` | keep row; excluded from €/m² (guard division with NULLIF) |
| `L0780` | `latitude = 61.05` — ~83 km north, outside the metro | **drop** (no valid map location) |

**Cleaning policy:** a listing with **no usable coordinate → drop**; a listing
**missing an attribute → keep** and exclude it from the relevant aggregate only.
Do the cleaning at load time so the database holds only clean, queryable rows.

## helsinki_areas.geojson
- **12 polygon areas** tiling the metro region.
- Properties per feature: `area_code`, `area_name`.
- Geometries are axis-aligned rectangles in **EPSG:4326** (WGS84 lat/lng).
- Bounds roughly: lng 24.64–25.12, lat 60.15–60.30.

## Consequences for the build
- Store listings as `geometry(Point, 4326)`, areas as `geometry(Polygon, 4326)`;
  add a GiST spatial index to both.
- Reject out-of-area coordinates with a metro bounding box slightly padded around
  the polygon extent (lng [24.60, 25.20], lat [60.10, 60.35]) so genuine edge
  listings aren't wrongly dropped — only gross errors like L0780.
- Area membership will be a **spatial** point-in-polygon join (`ST_Contains`), not
  a foreign key — correct even if boundaries change later.