"""
Simple Session model - track user practice sessions.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

from .base import BaseDocument


class InstrumentType(str, Enum):
    """Supported instruments."""
    PIANO = "piano"
    GUITAR = "guitar"
    VIOLIN = "violin"
    FLUTE = "flute"
    SAXOPHONE = "saxophone"
    DRUMS = "drums"


class SessionStatus(str, Enum):
    """Session status."""
    ACTIVE = "active"
    COMPLETED = "completed"


class SessionCreate(BaseModel):
    """Session creation model."""
    session_name: str
    primary_instrument: InstrumentType
    description: Optional[str] = None


class Session(BaseDocument):
    """Simple Session document."""
    user_id: str
    session_name: str
    primary_instrument: InstrumentType
    description: Optional[str] = None
    status: SessionStatus = SessionStatus.ACTIVE
    
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None