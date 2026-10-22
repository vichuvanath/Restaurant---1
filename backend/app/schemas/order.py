from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    item_id: int = Field(..., description="ID of the menu item")
    quantity: int = Field(..., ge=1, le=100, description="Quantity must be at least 1")

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class OrderCreateRequest(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one item")

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class OrderItemResponse(BaseModel):
    id: int
    item_id: Optional[int] = None
    item_name: str
    unit_price: float
    quantity: int
    subtotal: float

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrderResponse(BaseModel):
    id: int
    order_status: str
    total_amount: float
    created_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
    )
