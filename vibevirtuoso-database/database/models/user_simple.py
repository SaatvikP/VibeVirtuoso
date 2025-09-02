"""
Simple User model - only essential fields for VibeVirtuoso app.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from .base import BaseDocument


class UserCreate(BaseModel):
    """User creation model."""
    username: str = Field(..., min_length=3, max_length=30, pattern="^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    """User update model."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class User(BaseDocument):
    """Simple User document."""
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    last_login_at: Optional[datetime] = None