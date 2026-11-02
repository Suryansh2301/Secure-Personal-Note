from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

USERNAME_PATTERN = r"^[A-Za-z0-9_.-]+$"
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UserCreate(BaseModel):

    username: str = Field(min_length=3, max_length=50, pattern=USERNAME_PATTERN)
    email: str = Field(max_length=100, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=6, max_length=72)

    @field_validator("username", mode="before")
    @classmethod
    def _strip_username(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("email", mode="before")
    @classmethod
    def _clean_email(cls, v):
        return v.strip().lower() if isinstance(v, str) else v


class UserResponse(BaseModel):
    
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str


class NoteBase(BaseModel):

    title: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1)

    @field_validator("title", "content", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class NoteCreate(NoteBase):
    pass


class NoteResponse(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    user_id: int


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None