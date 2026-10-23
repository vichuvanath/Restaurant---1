from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router.api_router import api_router
from app.services.auth_service import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Neon DB table and indexes on startup
    init_db()
    yield


app = FastAPI(
    title="Restaurant Management API",
    description="FastAPI backend using Neon DB",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    "https://restaurant-1-c1qn.onrender.com",
    "https://restaurant-1-c1qn.onrender.com/",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Robust CORS middleware allowing specified origins and preview deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the router containing /manager/login
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "endpoint": "https://restaurant-1-c1qn.onrender.com/manager/login",
    }
