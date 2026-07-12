

set -e

PSQL_URL=$(echo "$DATABASE_URL" | sed 's/+psycopg2//')

echo "==> Applying schema (schema.sql)"
psql "$PSQL_URL" -v ON_ERROR_STOP=1 -f schema.sql

echo "==> Loading data (load_data.py)"
python load_data.py
