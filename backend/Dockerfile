# ---------------------------------------------------------------------------
# Flask API image.
#
# python:3.12-slim — small Debian base with a real package manager (we need the
# postgresql-client for the psql call in entrypoint.sh). Avoids the musl/wheel
# quirks of alpine.
# ---------------------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# postgresql-client gives us `psql` (used by entrypoint.sh). Clean the apt cache
# in the same layer to keep the image small.
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install deps first (own layer) so code edits don't reinstall on every build.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code.
COPY . .

# Normalise line endings (this repo is authored on Windows) and make the
# entrypoint executable, so /bin/sh doesn't choke on '\r'.
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]
