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

# Robust CORS middleware allowing any localhost / 127.0.0.1 origins
app.add_middleware(
    CORSMiddleware,
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
        "endpoint": "http://127.0.0.1:8000/manager/login",
    }
