# VibeVirtuoso Database Layer

A standalone database microservice for the VibeVirtuoso gesture-controlled virtual instrument system.

## Overview

This is a simple, clean FastAPI-based database layer that provides:
- User authentication and management
- Session tracking for practice sessions
- Composition storage for user creations
- Recording metadata management
- JWT-based authentication
- MongoDB integration

## Features

- **Simple API**: Clean, minimal FastAPI endpoints for database operations only
- **Security**: JWT authentication with bcrypt password hashing
- **MongoDB**: Async MongoDB operations using Motor driver
- **CORS**: Configured for frontend integration
- **Private**: Not a public API - designed for internal app use only

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
MONGODB_URL=your_mongodb_connection_string
DATABASE_NAME=vibevirtuoso
```

3. Run the server:
```bash
python app.py
```

The API will be available at `http://127.0.0.1:8001`

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login user and get JWT token
- `GET /profile` - Get user profile (authenticated)

### Sessions
- `POST /session/start` - Start a practice session
- `POST /session/{session_id}/end` - End a practice session
- `GET /sessions` - Get user's sessions

### Compositions
- `POST /composition/save` - Save a composition
- `GET /compositions` - Get user's compositions

### Recordings
- `POST /recording/save` - Save recording metadata
- `GET /recordings` - Get user's recordings

### System
- `GET /health` - Health check endpoint

## Database Collections

- `users` - User accounts and profiles
- `sessions` - Practice session tracking
- `compositions` - Musical compositions and projects
- `recordings` - Audio file metadata

## Architecture

```
vibevirtuoso-database/
├── app.py                 # Main FastAPI application
├── database/
│   ├── __init__.py
│   ├── config.py          # Database configuration
│   ├── connection.py      # MongoDB connection manager
│   ├── simple_db.py       # Database operations
│   └── models/            # Pydantic models
│       ├── __init__.py
│       ├── base.py
│       ├── user_simple.py
│       ├── session_simple.py
│       ├── composition_simple.py
│       └── recording_simple.py
├── requirements.txt
└── README.md
```

## Development

This database layer is designed to be:
- **Simple**: Minimal complexity, easy to understand
- **Focused**: Only handles database operations
- **Secure**: Proper authentication and security practices
- **Scalable**: Can be deployed independently
- **Maintainable**: Clean code structure and documentation