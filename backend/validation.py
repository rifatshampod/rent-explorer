"""
validation.py — small, explicit helpers to validate query parameters.
"""

# The only property types that exist in the dataset.
PROPERTY_TYPES = {"apartment", "studio", "townhouse"}


class ApiError(Exception):

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def opt_float(args, name):
    """Read an optional float query param. Missing -> None. Bad -> 400."""
    raw = args.get(name)
    if raw is None or raw == "":
        return None
    try:
        return float(raw)
    except ValueError:
        raise ApiError(f"{name} must be a number")


def opt_int(args, name):
    """Read an optional int query param. Missing -> None. Bad -> 400."""
    raw = args.get(name)
    if raw is None or raw == "":
        return None
    try:
        return int(raw)
    except ValueError:
        raise ApiError(f"{name} must be an integer")


def req_float(args, name):
    """Read a REQUIRED float query param. Missing/bad -> 400."""
    raw = args.get(name)
    if raw is None or raw == "":
        raise ApiError(f"{name} is required")
    try:
        return float(raw)
    except ValueError:
        raise ApiError(f"{name} must be a number")


def parse_listings_filters(args):
    
    bbox = {
        "min_lng": opt_float(args, "min_lng"),
        "min_lat": opt_float(args, "min_lat"),
        "max_lng": opt_float(args, "max_lng"),
        "max_lat": opt_float(args, "max_lat"),
    }
    provided = [v is not None for v in bbox.values()]
    if any(provided) and not all(provided):
        raise ApiError(
            "Bounding box requires all of min_lng, min_lat, max_lng, max_lat (or none)."
        )
    if all(provided):
        if bbox["min_lng"] > bbox["max_lng"]:
            raise ApiError("min_lng must be <= max_lng")
        if bbox["min_lat"] > bbox["max_lat"]:
            raise ApiError("min_lat must be <= max_lat")

    rent_min = opt_int(args, "rent_min")
    rent_max = opt_int(args, "rent_max")
    if rent_min is not None and rent_max is not None and rent_min > rent_max:
        raise ApiError("rent_min must be <= rent_max")

    rooms = opt_int(args, "rooms")
    if rooms is not None and rooms < 0:
        raise ApiError("rooms must be >= 0")

    property_type = args.get("property_type") or None
    if property_type is not None and property_type not in PROPERTY_TYPES:
        raise ApiError(
            f"property_type must be one of {sorted(PROPERTY_TYPES)}"
        )

    has_bbox = all(provided)
    return {
        **bbox,
        "has_bbox": has_bbox,
        "rent_min": rent_min,
        "rent_max": rent_max,
        "rooms": rooms,
        "property_type": property_type,
    }


def parse_near_params(args):
    """Validate and return params for GET /listings/near.

    lat, lng, radius_m are all required; radius must be > 0 and capped so one
    call can't scan an absurd area.
    """
    lat = req_float(args, "lat")
    lng = req_float(args, "lng")
    radius_m = req_float(args, "radius_m")
    if radius_m <= 0:
        raise ApiError("radius_m must be > 0")
    if radius_m > 50000:
        raise ApiError("radius_m must be <= 50000 (50 km)")
    return {"lat": lat, "lng": lng, "radius_m": radius_m}
