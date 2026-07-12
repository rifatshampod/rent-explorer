"""
db.py — the SQLAlchemy engine and session, created once and shared.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL

engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)

# A factory for Session objects. Each request opens one with `with SessionLocal()`.
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

Base = declarative_base()
