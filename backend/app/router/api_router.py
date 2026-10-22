from fastapi import APIRouter
from app.endpoints import customer, manager

api_router = APIRouter()

# Register manager endpoints with /manager prefix (/manager/login, /manager/items)
api_router.include_router(manager.router, prefix="/manager", tags=["Manager"])

# Register public customer endpoints (/items, /orders, /orders/{id})
api_router.include_router(customer.router, tags=["Customer"])
