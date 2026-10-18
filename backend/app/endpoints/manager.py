from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.manager import LoginResponse, ManagerLoginRequest
from app.services.auth_service import authenticate_manager

router = APIRouter()


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def manager_login(payload: ManagerLoginRequest, db: Session = Depends(get_db)):
    """
    Fast manager login endpoint:
    - Queries Neon DB by username using unique index.
    - Validates plain password without hashing.
    - Returns JSON response.
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
    )
