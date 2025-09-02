"""
Simple Recording model - track audio files.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from .base import BaseDocument
from .session_simple import InstrumentType


class RecordingCreate(BaseModel):
    """Recording creation model."""
    filename: str
    instrument: InstrumentType
    duration_seconds: float
    file_path: str


class Recording(BaseDocument):
    """Simple Recording document."""
    user_id: str
    filename: str
    instrument: InstrumentType
    duration_seconds: float
    file_path: str