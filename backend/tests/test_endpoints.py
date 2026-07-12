import pytest

from app import app as flask_app


@pytest.fixture(scope="module")
def client():
    # Flask's built-in test client — no server needed; it calls the app directly.
    flask_app.config.update(TESTING=True)
    with flask_app.test_client() as c:
        yield c


# --- Happy paths ------------------------------------------------------------

def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_listings_returns_data(client):
    r = client.get("/listings")
    assert r.status_code == 200
    body = r.get_json()
    assert body["count"] > 0
    sample = body["listings"][0]
    assert {"listing_id", "latitude", "longitude"} <= sample.keys()


def test_bbox_filter_narrows_results(client):
    total = client.get("/listings").get_json()["count"]
    box = client.get(
        "/listings",
        query_string={
            "min_lng": 24.90, "min_lat": 60.15,
            "max_lng": 25.00, "max_lat": 60.25,
        },
    ).get_json()["count"]
    assert 0 < box < total


def test_rent_filter_bounds_respected(client):
    r = client.get("/listings", query_string={"rent_min": 1000, "rent_max": 1500})
    assert r.status_code == 200
    for item in r.get_json()["listings"]:
        assert 1000 <= item["rent_eur"] <= 1500


def test_area_stats_is_geojson_with_medians(client):
    r = client.get("/areas/stats")
    assert r.status_code == 200
    fc = r.get_json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 12
    props = fc["features"][0]["properties"]
    assert {"area_code", "median_rent", "median_eur_per_m2"} <= props.keys()


def test_near_is_sorted_by_distance(client):
    r = client.get(
        "/listings/near",
        query_string={"lat": 60.17, "lng": 24.94, "radius_m": 2000},
    )
    assert r.status_code == 200
    # distance_m comes from a numeric() expression and may serialise as a string.
    distances = [float(item["distance_m"]) for item in r.get_json()["listings"]]
    assert distances == sorted(distances)
    assert all(d <= 2000 for d in distances)


# --- Validation (must return 400) -------------------------------------------

def test_reversed_rent_range_rejected(client):
    r = client.get("/listings", query_string={"rent_min": 2000, "rent_max": 1000})
    assert r.status_code == 400


def test_partial_bbox_rejected(client):
    r = client.get("/listings", query_string={"min_lng": 24.9, "min_lat": 60.1})
    assert r.status_code == 400


def test_negative_radius_rejected(client):
    r = client.get(
        "/listings/near", query_string={"lat": 60.17, "lng": 24.94, "radius_m": -5}
    )
    assert r.status_code == 400


def test_unknown_property_type_rejected(client):
    r = client.get("/listings", query_string={"property_type": "castle"})
    assert r.status_code == 400
