#!/bin/sh
# ---------------------------------------------------------------------------
# entrypoint.sh — runs each time the API container starts.
#
# Order:
#   1. Apply schema.sql (enable PostGIS). Idempotent.
#   2. Run the loader (creates tables via the models, cleans + inserts data).
#      Idempotent (TRUNCATE + insert).
#   3. Start gunicorn serving the Flask app.
#
# compose makes this container wait for the DB healthcheck, so Postgres is ready.
# `set -e` aborts on the first failure so a broken step surfaces immediately.
# ---------------------------------------------------------------------------
set -e

# schema.sql needs a raw psql URL (postgresql://...), but our app URL is a
# SQLAlchemy URL (postgresql+psycopg2://...). Strip the +psycopg2 for psql.
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/+psycopg2//')

echo "==> Applying schema (schema.sql)"
psql "$PSQL_URL" -v ON_ERROR_STOP=1 -f schema.sql

echo "==> Loading data (load_data.py)"
python load_data.py

echo "==> Starting gunicorn"
# app:app  = the `app` object in app.py. One worker is plenty for this dataset;
# 60s timeout is generous headroom for the aggregate query.
exec gunicorn --bind 0.0.0.0:8000 --workers 1 --timeout 60 app:app
