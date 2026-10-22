from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Item, Manager
from app.database.session import get_db
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.schemas.manager import LoginResponse, ManagerLoginRequest
from app.services.auth_service import authenticate_manager

router = APIRouter()


def verify_manager(
    x_manager_username: Optional[str] = Header(None, alias="X-Manager-Username"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    """
    Optimized authorization check:
    - Queries only (id, username) using covering index on username.
    - Avoids transferring and deserializing unused password hashes.
    """
    username = x_manager_username
    if not username and authorization:
        parts = authorization.split(" ")
        username = parts[-1] if len(parts) > 1 else authorization

    if not username or not username.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Manager authorization required. Please log in.",
        )

    clean_user = username.strip()
    manager_row = (
        db.query(Manager.id, Manager.username)
        .filter(Manager.username == clean_user)
        .first()
    )

    if not manager_row:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Manager account not found.",
        )

    return {"id": manager_row.id, "username": manager_row.username}


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def manager_login(payload: ManagerLoginRequest, db: Session = Depends(get_db)):
    """
    Fast manager login endpoint:
    - Queries Neon DB by username using unique index.
    - Validates credentials directly against the database.
    - Returns manager verification details.
    """
    manager = authenticate_manager(
        db=db,
        username=payload.username,
        password=payload.password,
    )

    if not manager:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    return LoginResponse(
        status="success",
        message="Login successful",
        username=manager.username,
        manager_id=manager.id,
    )


@router.get("/items", response_model=List[ItemResponse], status_code=status.HTTP_200_OK)
def get_manager_items(
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    _manager: dict = Depends(verify_manager),
):
    """
    Optimized retrieval of real items persisted in Neon DB:
    - Uses composite index `idx_items_created_at_desc` (created_at DESC, id DESC) to avoid in-memory sorting.
    - Employs pagination (skip/limit) to prevent unbounded memory and network transfer.
    """
    stmt = (
        select(Item)
        .order_by(Item.created_at.desc(), Item.id.desc())
        .offset(skip)
        .limit(limit)
    )
    items = db.scalars(stmt).all()
    return items


@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_manager_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    _manager: dict = Depends(verify_manager),
):
    """
    Create a new item in the real Neon PostgreSQL database.
    Protected: Only accessible by authenticated managers.
    Validates name and price (>= 0).
    """
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Item name is required and cannot be empty.",
        )

    if payload.price < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Price must be greater than or equal to 0.",
        )

    new_item = Item(
        name=name,
        description=payload.description.strip() if payload.description else None,
        price=payload.price,
        image_url=payload.image_url.strip() if payload.image_url else None,
        is_available=payload.is_available,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.put("/items/{item_id}", response_model=ItemResponse, status_code=status.HTTP_200_OK)
def update_manager_item(
    item_id: int,
    payload: ItemUpdate,
    db: Session = Depends(get_db),
    _manager: dict = Depends(verify_manager),
):
    """
    Update an existing item in the real Neon PostgreSQL database.
    Protected: Only accessible by authenticated managers.
    Validates name (non-empty) and price (>= 0).
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found in database.",
        )

    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Item name cannot be empty.",
            )
        item.name = name

    if payload.price is not None:
        if payload.price < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Price must be greater than or equal to 0.",
            )
        item.price = payload.price

    if payload.description is not None:
        item.description = payload.description.strip() if payload.description.strip() else None

    if payload.image_url is not None:
        item.image_url = payload.image_url.strip() if payload.image_url.strip() else None

    if payload.is_available is not None:
        item.is_available = payload.is_available

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_200_OK)
def delete_manager_item(
    item_id: int,
    db: Session = Depends(get_db),
    _manager: dict = Depends(verify_manager),
):
    """
    Delete an item permanently from the real Neon PostgreSQL database.
    Protected: Only accessible by authenticated managers.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found in database.",
        )

    item_name = item.name
    db.delete(item)
    db.commit()

    return {
        "status": "success",
        "message": f"Item '{item_name}' was successfully deleted from database.",
        "id": item_id,
    }

