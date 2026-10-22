from pydantic import BaseModel, ConfigDict, Field


class ManagerLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, description="Manager username")
    password: str = Field(..., min_length=1, max_length=255, description="Manager password")

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class LoginResponse(BaseModel):
    status: str = "success"
    message: str = "Login successful"
    username: str
    manager_id: int
