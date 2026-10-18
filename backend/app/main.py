# Re-export FastAPI app so `uvicorn app.main:app --reload` works directly
from main import app

__all__ = ["app"]
