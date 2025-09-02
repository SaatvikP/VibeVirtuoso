"""
Base models and common types for VibeVirtuoso database.
"""
from datetime import datetime
from typing import Optional, Any, Dict, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId


def validate_object_id(v: Any) -> ObjectId:
    """Validate ObjectId for Pydantic v2."""
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


# Custom ObjectId type for Pydantic v2
PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class BaseDocument(BaseModel):
    """Base class for all MongoDB documents."""
    
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
        
    def model_dump(self, **kwargs) -> Dict[str, Any]:
        """Override model_dump method to handle ObjectId serialization."""
        d = super().model_dump(**kwargs)
        if "_id" in d and d["_id"]:
            d["_id"] = str(d["_id"])
        return d
    


