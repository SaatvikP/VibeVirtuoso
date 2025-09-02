"""
Simple Composition model - store user's musical creations.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from .base import BaseDocument


class CompositionCreate(BaseModel):
    """Composition creation model."""
    title: str
    description: Optional[str] = None
    composition_data: Optional[Dict[str, Any]] = None  # Store actual music data here


class Composition(BaseDocument):
    """Simple Composition document."""
    user_id: str
    title: str
    description: Optional[str] = None
    composition_data: Dict[str, Any] = Field(default_factory=dict)  # Music notes, chords, etc.