"""
app.py — the Flask application, built with an app factory.
gunicorn (see entrypoint.sh) imports the module-level `app` created at the bottom.
"""

from flask import Flask, jsonify
from sqlalchemy import text

from db import SessionLocal
from validation import ApiError


def create_app():
    app = Flask(__name__)

    # --- Error handling ---------------------------------------------------
    # Any ApiError raised during validation becomes a JSON error with its status
    # (400 by default), instead of a 500 stack trace. This is what makes invalid
    # input return a clean, predictable response.
    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify({"error": err.message}), err.status

    # --- Health check -----------------------------------------------------
    @app.get("/health")
    def health():
        """
        Liveness + database check.
        ---
        tags: [meta]
        responses:
          200: {description: Service and database are up.}
        """
        # A trivial query confirms the DB connection is usable, so the
        # docker-compose healthcheck can rely on this endpoint.
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        return jsonify({"status": "ok"})

    return app


# gunicorn / flask run look for this module-level `app`.
app = create_app()
