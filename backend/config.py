"""
config.py — all configuration, read from environment variables in one place.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Database connection string SQLAlchemy uses.
#   Format: postgresql+psycopg2://user:password@host:port/dbname
#   In docker-compose this points at the "db" service; locally at localhost.
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://rent:rent@localhost:5432/rent"
)

# Where the loader reads the source data files (mounted into the container).
LISTINGS_CSV = os.environ.get("LISTINGS_CSV", "../data/listings.csv")
AREAS_GEOJSON = os.environ.get("AREAS_GEOJSON", "../data/helsinki_areas.geojson")
