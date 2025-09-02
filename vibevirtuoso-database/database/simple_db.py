"""
Simple database operations for VibeVirtuoso.
Just basic CRUD - no complex features.
"""
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from .connection import db_manager
from .models.user_simple import User, UserCreate, UserUpdate
from .models.session_simple import Session, SessionCreate
from .models.composition_simple import Composition, CompositionCreate
from .models.recording_simple import Recording, RecordingCreate


class SimpleDB:
    """Simple database operations."""
    
    def __init__(self):
        self.users = None
        self.sessions = None
        self.compositions = None
        self.recordings = None
    
    def _to_object_id(self, id_str: str) -> Optional[ObjectId]:
        """Convert string to ObjectId, return None if invalid."""
        try:
            return ObjectId(id_str)
        except InvalidId:
            return None
    
    def initialize_collections(self):
        """Initialize collections after database connection."""
        self.users = db_manager.get_collection("users")
        self.sessions = db_manager.get_collection("sessions")
        self.compositions = db_manager.get_collection("compositions")
        self.recordings = db_manager.get_collection("recordings")
    
    # ==================== USER OPERATIONS ====================
    
    async def create_user(self, user_data: UserCreate, hashed_password: str) -> User:
        """Create a new user."""
        doc_data = {
            "username": user_data.username.lower(),
            "email": user_data.email.lower(),
            "hashed_password": hashed_password,
            "full_name": user_data.full_name,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login_at": None
        }
        
        result = await self.users.insert_one(doc_data)
        doc_data["_id"] = result.inserted_id
        
        return User(**doc_data)
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        doc = await self.users.find_one({"username": username.lower()})
        return User(**doc) if doc else None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        doc = await self.users.find_one({"email": email.lower()})
        return User(**doc) if doc else None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        obj_id = self._to_object_id(user_id)
        if not obj_id:
            return None
        doc = await self.users.find_one({"_id": obj_id})
        return User(**doc) if doc else None
    
    async def update_user_login(self, user_id: str):
        """Update user's last login time."""
        obj_id = self._to_object_id(user_id)
        if obj_id:
            await self.users.update_one(
                {"_id": obj_id},
                {"$set": {"last_login_at": datetime.utcnow()}}
            )
    
    # ==================== SESSION OPERATIONS ====================
    
    async def create_session(self, user_id: str, session_data: SessionCreate) -> Session:
        """Create a new session."""
        doc_data = {
            "user_id": user_id,
            "session_name": session_data.session_name,
            "primary_instrument": session_data.primary_instrument.value,
            "description": session_data.description,
            "status": "active",
            "created_at": datetime.utcnow(),
            "started_at": datetime.utcnow(),
            "ended_at": None,
            "duration_seconds": None
        }
        
        result = await self.sessions.insert_one(doc_data)
        doc_data["_id"] = result.inserted_id
        
        return Session(**doc_data)
    
    async def end_session(self, session_id: str) -> Optional[Session]:
        """End a session."""
        obj_id = self._to_object_id(session_id)
        if not obj_id:
            return None
        
        session_doc = await self.sessions.find_one({"_id": obj_id})
        
        if not session_doc or session_doc["status"] != "active":
            return None
        
        now = datetime.utcnow()
        started_at = session_doc["started_at"]
        duration = (now - started_at).total_seconds()
        
        await self.sessions.update_one(
            {"_id": obj_id},
            {"$set": {
                "status": "completed",
                "ended_at": now,
                "duration_seconds": duration
            }}
        )
        
        updated_doc = await self.sessions.find_one({"_id": obj_id})
        return Session(**updated_doc)
    
    async def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Session]:
        """Get user's recent sessions."""
        cursor = self.sessions.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        docs = await cursor.to_list(length=limit)
        return [Session(**doc) for doc in docs]
    
    # ==================== COMPOSITION OPERATIONS ====================
    
    async def save_composition(self, user_id: str, comp_data: CompositionCreate) -> Composition:
        """Save a composition."""
        doc_data = {
            "user_id": user_id,
            "title": comp_data.title,
            "description": comp_data.description,
            "composition_data": comp_data.composition_data or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.compositions.insert_one(doc_data)
        doc_data["_id"] = result.inserted_id
        
        return Composition(**doc_data)
    
    async def get_user_compositions(self, user_id: str, limit: int = 20) -> List[Composition]:
        """Get user's compositions."""
        cursor = self.compositions.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(limit)
        
        docs = await cursor.to_list(length=limit)
        return [Composition(**doc) for doc in docs]
    
    async def get_composition(self, composition_id: str, user_id: str) -> Optional[Composition]:
        """Get a specific composition (user must own it)."""
        obj_id = self._to_object_id(composition_id)
        if not obj_id:
            return None
        
        doc = await self.compositions.find_one({
            "_id": obj_id,
            "user_id": user_id
        })
        return Composition(**doc) if doc else None
    
    # ==================== RECORDING OPERATIONS ====================
    
    async def save_recording(self, user_id: str, rec_data: RecordingCreate) -> Recording:
        """Save recording metadata."""
        doc_data = {
            "user_id": user_id,
            "filename": rec_data.filename,
            "instrument": rec_data.instrument.value,
            "duration_seconds": rec_data.duration_seconds,
            "file_path": rec_data.file_path,
            "created_at": datetime.utcnow()
        }
        
        result = await self.recordings.insert_one(doc_data)
        doc_data["_id"] = result.inserted_id
        
        return Recording(**doc_data)
    
    async def get_user_recordings(self, user_id: str, limit: int = 20) -> List[Recording]:
        """Get user's recordings."""
        cursor = self.recordings.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        docs = await cursor.to_list(length=limit)
        return [Recording(**doc) for doc in docs]


# Global database instance
simple_db = SimpleDB()