from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import DATABASE_URL

# Neon serverless PostgreSQL connection pooler optimizations:
# - pool_pre_ping: validates active connection health before usage
# - pool_recycle: prevents stale pooled connections before Neon compute scales to zero
# - pool_size & max_overflow: sized for PgBouncer transaction pooling
# - pool_timeout: prevents client threads blocking indefinitely
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    pool_timeout=15,
    connect_args={"connect_timeout": 10},
    echo=False,
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for obtaining a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
