"""
models.py — the two database tables, as SQLAlchemy ORM models.
"""

from geoalchemy2 import Geometry
from sqlalchemy import Column, Date, Integer, Numeric, String

from db import Base


class Area(Base):
    """One of the 12 polygon neighbourhoods from helsinki_areas.geojson."""

    __tablename__ = "areas"

    area_code = Column(String, primary_key=True)          # e.g. "A01"
    area_name = Column(String, nullable=False)            # e.g. "Lansi-A"
    geom = Column(Geometry("POLYGON", srid=4326, spatial_index=True), nullable=False)


class Listing(Base):
    """A rental listing from listings.csv.

    A few source rows are missing one of these. We keep the row (it still has a valid location) and
    store NULL; SQL aggregates skip NULL, so a missing value never pollutes a
    median. Only rows with a bad/missing COORDINATE are dropped by the loader.
    """

    __tablename__ = "listings"

    listing_id = Column(String, primary_key=True)         # e.g. "L0001"
    rooms = Column(Integer)                               # nullable
    size_m2 = Column(Numeric)                             # nullable
    rent_eur = Column(Integer)                            # nullable
    property_type = Column(String)                        # apartment|studio|townhouse
    listed_date = Column(Date)
    # Point geometry in SRID 4326; every listing MUST have a location.
    geom = Column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
