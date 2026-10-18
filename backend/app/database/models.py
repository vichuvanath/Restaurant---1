from sqlalchemy import Column, Index, Integer, String
from app.database.session import Base


class Manager(Base):
    __tablename__ = "managers"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    # Covering B-Tree Index for rapid index-only query response:
    # SELECT id, username FROM managers WHERE username = :u AND password = :p
    __table_args__ = (
        Index("idx_managers_auth_fast", "username", "password"),
    )
