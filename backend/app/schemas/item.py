from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Item name (required)")
    description: Optional[str] = Field(None, max_length=2000, description="Optional description")
    price: Decimal = Field(..., ge=0, decimal_places=2, max_digits=10, description="Price in INR (>= 0)")
    image_url: Optional[str] = Field(None, max_length=1024, description="Optional image URL")
    is_available: bool = Field(True, description="Item availability status")

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class ItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Updated item name")
    description: Optional[str] = Field(None, max_length=2000, description="Updated description")
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, max_digits=10, description="Updated price in INR (>= 0)")
    image_url: Optional[str] = Field(None, max_length=1024, description="Updated image URL")
    is_available: Optional[bool] = Field(None, description="Updated availability status")

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )
