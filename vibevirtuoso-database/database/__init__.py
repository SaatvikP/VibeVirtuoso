"""
Database package for VibeVirtuoso.

This package provides:
- Database connection management
- Configuration handling
- Collection access utilities
"""

from .config import db_config, DatabaseConfig
from .connection import db_manager, DatabaseManager

__all__ = [
    "db_config",
    "DatabaseConfig", 
    "db_manager",
    "DatabaseManager"
]