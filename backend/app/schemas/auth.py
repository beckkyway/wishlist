from typing import Annotated
from pydantic import BaseModel, AfterValidator


def _validate_email(v: str) -> str:
    from email_validator import validate_email, EmailNotValidError
    try:
        info = validate_email(v, check_deliverability=False)
        return info.normalized
    except EmailNotValidError as e:
        raise ValueError(str(e))


EmailField = Annotated[str, AfterValidator(_validate_email)]


class RegisterRequest(BaseModel):
    email: EmailField
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailField
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None

    model_config = {"from_attributes": True}
