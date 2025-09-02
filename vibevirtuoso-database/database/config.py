"""
Database configuration for VibeVirtuoso MongoDB connection.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class DatabaseConfig(BaseSettings):
    """Database configuration settings."""
    
    # MongoDB Connection
    mongodb_url: str = Field(
        default="mongodb://localhost:27017",
        env="MONGODB_URL",
        description="MongoDB connection string"
    )
    
    database_name: str = Field(
        default="vibevirtuoso",
        env="DATABASE_NAME", 
        description="Database name"
    )
    
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


# Global config instance
db_config = DatabaseConfig()