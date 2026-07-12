"""
app.py — the Flask application, built with an app factory.
gunicorn (see entrypoint.sh) imports the module-level `app` created at the bottom.
"""

from flask import Flask, jsonify
from sqlalchemy import text

from flask_cors import CORS
from config import CORS_ORIGINS

from db import SessionLocal
from validation import ApiError

from routes import listings, areas
from flasgger import Swagger


def create_app():
    app = Flask(__name__)

    # --- CORS -------------------------------------------------------------
    CORS(app, resources={r"/*": {"origins": CORS_ORIGINS}}, methods=["GET"])

     # --- Swagger UI -------------------------------------------------------
    Swagger(
        app,
        template={
            "info": {
                "title": "Rent Explorer API (Flask)",
                "description": "Location-intelligence backend: listings, area "
                "price stats, and radius search over the Helsinki metro rentals.",
                "version": "1.0.0",
            }
        },
    )


    # --- Routes -----------------------------------------------------------
    app.register_blueprint(listings.bp)
    app.register_blueprint(areas.bp)

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
