from pydantic import BaseModel, Field, ConfigDict


class ManagerLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, description="Manager username")
    password: str = Field(..., min_length=1, max_length=255, description="Manager password")

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "username": "admin",
                "password": "password123",
            }
        },
    )


class LoginResponse(BaseModel):
    status: str = "success"
    message: str = "Login successful"
    username: str
