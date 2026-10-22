from sqlalchemy.orm import Session
from app.database.models import Item, Manager, Order, OrderItem
from app.database.session import Base, engine


def init_db():
    """Ensure managers table and indexes are created in Neon DB."""
    Base.metadata.create_all(bind=engine)


def authenticate_manager(db: Session, username: str, password: str) -> Manager | None:
    """
    Direct indexed query on Neon DB matching username and plain password.
    Performs an index scan using idx_managers_auth_fast for immediate response.
    """
    clean_username = username.strip()

    manager = (
        db.query(Manager)
        .filter(
            Manager.username == clean_username,
            Manager.password == password,
        )
        .first()
    )

    return manager
