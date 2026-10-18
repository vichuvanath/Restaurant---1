from fastapi import APIRouter
from app.endpoints import manager

api_router = APIRouter()

# Register manager endpoint with /manager prefix
# This produces the endpoint http://127.0.0.1:8000/manager/login
api_router.include_router(manager.router, prefix="/manager", tags=["Manager"])
