"""
Simple database models package for VibeVirtuoso.

This package contains basic Pydantic models for MongoDB collections:
- User: Simple authentication and user profiles
- Session: Basic practice session tracking
- Composition: Simple musical compositions storage
- Recording: Basic audio file metadata
"""

from .base import BaseDocument, PyObjectId

from .user_simple import User, UserCreate
from .session_simple import Session, SessionCreate, InstrumentType
from .composition_simple import Composition, CompositionCreate
from .recording_simple import Recording, RecordingCreate

__all__ = [
    "BaseDocument",
    "PyObjectId",
    "InstrumentType",
    "User",
    "UserCreate", 
    "Session",
    "SessionCreate",
    "Composition",
    "CompositionCreate",
    "Recording",
    "RecordingCreate"
]