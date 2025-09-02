"""
Simple VibeVirtuoso Database Layer
Clean, minimal FastAPI app for database operations only.
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from database import db_manager
from database.simple_db import simple_db
from database.models.user_simple import User, UserCreate
from database.models.session_simple import SessionCreate, InstrumentType
from database.models.composition_simple import CompositionCreate
from database.models.recording_simple import RecordingCreate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production"  # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup and shutdown."""
    logger.info("🚀 Starting VibeVirtuoso Database...")
    
    try:
        await db_manager.connect()
        simple_db.initialize_collections()
        logger.info("✅ Database connected")
        logger.info("🎵 Ready for operations")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    logger.info("🛑 Shutting down...")
    try:
        await db_manager.disconnect()
        logger.info("✅ Database disconnected")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")


# Create FastAPI app
app = FastAPI(
    title="VibeVirtuoso Database",
    description="Simple database operations for VibeVirtuoso app",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,  # No public docs
    redoc_url=None
)

# CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    """Hash password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    """Create JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from token."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await simple_db.get_user_by_username(username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


# ==================== REQUEST/RESPONSE MODELS ====================

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class SessionRequest(BaseModel):
    session_name: str
    instrument: str
    description: Optional[str] = None


class CompositionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    composition_data: Optional[dict] = None


class RecordingRequest(BaseModel):
    filename: str
    instrument: str
    duration_seconds: float
    file_path: str


# ==================== ENDPOINTS ====================

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# ==================== USER ENDPOINTS ====================

@app.post("/register")
async def register(request: RegisterRequest):
    """Register new user."""
    # Check if user exists
    if await simple_db.get_user_by_username(request.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if await simple_db.get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user
    user_data = UserCreate(
        username=request.username,
        email=request.email,
        password=request.password,
        full_name=request.full_name
    )
    
    hashed_password = hash_password(request.password)
    user = await simple_db.create_user(user_data, hashed_password)
    
    return {
        "success": True,
        "user_id": str(user.id),
        "message": "User created successfully"
    }


@app.post("/login")
async def login(request: LoginRequest):
    """Login user."""
    user = await simple_db.get_user_by_username(request.username)
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account disabled")
    
    # Update last login
    await simple_db.update_user_login(str(user.id))
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "username": user.username
    }


@app.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get user profile."""
    return {
        "user_id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at
    }


# ==================== SESSION ENDPOINTS ====================

@app.post("/session/start")
async def start_session(
    request: SessionRequest,
    current_user: User = Depends(get_current_user)
):
    """Start a practice session."""
    try:
        instrument = InstrumentType(request.instrument.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid instrument")
    
    session_data = SessionCreate(
        session_name=request.session_name,
        primary_instrument=instrument,
        description=request.description
    )
    
    session = await simple_db.create_session(str(current_user.id), session_data)
    
    return {
        "success": True,
        "session_id": str(session.id),
        "message": f"Started {instrument.value} session"
    }


@app.post("/session/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """End a session."""
    session = await simple_db.end_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already ended")
    
    return {
        "success": True,
        "duration_seconds": session.duration_seconds,
        "message": "Session ended"
    }


@app.get("/sessions")
async def get_sessions(current_user: User = Depends(get_current_user)):
    """Get user's sessions."""
    sessions = await simple_db.get_user_sessions(str(current_user.id))
    
    return [{
        "session_id": str(session.id),
        "name": session.session_name,
        "instrument": session.primary_instrument,
        "status": session.status,
        "duration_seconds": session.duration_seconds,
        "created_at": session.created_at
    } for session in sessions]


# ==================== COMPOSITION ENDPOINTS ====================

@app.post("/composition/save")
async def save_composition(
    request: CompositionRequest,
    current_user: User = Depends(get_current_user)
):
    """Save a composition."""
    comp_data = CompositionCreate(
        title=request.title,
        description=request.description,
        composition_data=request.composition_data
    )
    
    composition = await simple_db.save_composition(str(current_user.id), comp_data)
    
    return {
        "success": True,
        "composition_id": str(composition.id),
        "message": "Composition saved"
    }


@app.get("/compositions")
async def get_compositions(current_user: User = Depends(get_current_user)):
    """Get user's compositions."""
    compositions = await simple_db.get_user_compositions(str(current_user.id))
    
    return [{
        "composition_id": str(comp.id),
        "title": comp.title,
        "description": comp.description,
        "created_at": comp.created_at,
        "updated_at": comp.updated_at
    } for comp in compositions]


# ==================== RECORDING ENDPOINTS ====================

@app.post("/recording/save")
async def save_recording(
    request: RecordingRequest,
    current_user: User = Depends(get_current_user)
):
    """Save recording metadata."""
    try:
        instrument = InstrumentType(request.instrument.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid instrument")
    
    rec_data = RecordingCreate(
        filename=request.filename,
        instrument=instrument,
        duration_seconds=request.duration_seconds,
        file_path=request.file_path
    )
    
    recording = await simple_db.save_recording(str(current_user.id), rec_data)
    
    return {
        "success": True,
        "recording_id": str(recording.id),
        "message": "Recording saved"
    }


@app.get("/recordings")
async def get_recordings(current_user: User = Depends(get_current_user)):
    """Get user's recordings."""
    recordings = await simple_db.get_user_recordings(str(current_user.id))
    
    return [{
        "recording_id": str(rec.id),
        "filename": rec.filename,
        "instrument": rec.instrument,
        "duration_seconds": rec.duration_seconds,
        "file_path": rec.file_path,
        "created_at": rec.created_at
    } for rec in recordings]


# ==================== RUN SERVER ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )