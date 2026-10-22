from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Item, Order, OrderItem
from app.database.session import get_db
from app.schemas.item import ItemResponse
from app.schemas.order import OrderCreateRequest, OrderResponse

router = APIRouter()


@router.get("/items", response_model=List[ItemResponse], status_code=status.HTTP_200_OK)
def get_available_items(db: Session = Depends(get_db)):
    """
    Public customer endpoint:
    Retrieve all food items marked as available from Neon DB.
    Uses index idx_items_availability for rapid scan.
    """
    stmt = (
        select(Item)
        .where(Item.is_available.is_(True))
        .order_by(Item.name.asc())
    )
    items = db.scalars(stmt).all()
    return items


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_customer_order(payload: OrderCreateRequest, db: Session = Depends(get_db)):
    """
    Customer order placement:
    1. Validates that payload has at least 1 item.
    2. Retrieves current trusted prices directly from Neon DB.
    3. Revalidates availability.
    4. Calculates final totals strictly on the backend.
    5. Saves Order and OrderItems in an atomic transaction.
    """
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    # Consolidate duplicate item entries by aggregating quantities
    item_quantities = {}
    for entry in payload.items:
        if entry.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid quantity {entry.quantity} for item ID {entry.item_id}. Must be >= 1.",
            )
        item_quantities[entry.item_id] = item_quantities.get(entry.item_id, 0) + entry.quantity

    item_ids = list(item_quantities.keys())

    # Fetch real items from Neon DB
    stmt = select(Item).where(Item.id.in_(item_ids))
    db_items = db.scalars(stmt).all()
    db_item_map = {item.id: item for item in db_items}

    # Verify all requested items exist and are available
    for item_id, qty in item_quantities.items():
        db_item = db_item_map.get(item_id)
        if not db_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} no longer exists in menu.",
            )
        if not db_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{db_item.name}' is currently unavailable for ordering.",
            )

    # Calculate authoritative server-side totals
    total_amount = Decimal("0.00")
    order_items_to_create = []

    for item_id, qty in item_quantities.items():
        db_item = db_item_map[item_id]
        unit_price = Decimal(str(db_item.price))
        subtotal = unit_price * Decimal(qty)
        total_amount += subtotal

        order_items_to_create.append(
            OrderItem(
                item_id=db_item.id,
                item_name=db_item.name,
                unit_price=unit_price,
                quantity=qty,
                subtotal=subtotal,
            )
        )

    # Create Order and OrderItems within atomic transaction
    new_order = Order(
        order_status="confirmed",
        total_amount=total_amount,
        items=order_items_to_create,
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/orders/{order_id}", response_model=OrderResponse, status_code=status.HTTP_200_OK)
def get_order_details(order_id: int, db: Session = Depends(get_db)):
    """
    Retrieve real order details and item snapshot by order ID.
    """
    stmt = select(Order).where(Order.id == order_id)
    order = db.scalars(stmt).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found.",
        )

    return order
