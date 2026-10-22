from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class Manager(Base):
    __tablename__ = "managers"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    __table_args__ = (
        Index("idx_managers_auth_fast", "username", "password"),
    )


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(1024), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_items_created_at_desc", created_at.desc(), id.desc()),
        Index("idx_items_availability", "is_available"),
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    order_status = Column(String(50), default="placed", nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="SET NULL"), nullable=True, index=True)
    item_name = Column(String(255), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
