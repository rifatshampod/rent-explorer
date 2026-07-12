"""
app.py — the Flask application, built with an app factory.
"""

from flask import Flask


def create_app():
    app = Flask(__name__)

    return app


# gunicorn / flask run look for this module-level `app`.
app = create_app()
