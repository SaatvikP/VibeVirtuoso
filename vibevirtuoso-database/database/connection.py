"""
MongoDB connection manager for VibeVirtuoso using Motor (async).
"""
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from .config import db_config

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages MongoDB connection using Motor for async operations."""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        self._connected = False
    
    async def connect(self) -> None:
        """Establish connection to MongoDB."""
        try:
            logger.info(f"Connecting to MongoDB: {db_config.database_name}")
            
            # Create client with simple configuration
            self.client = AsyncIOMotorClient(
                db_config.mongodb_url
            )
            
            # Get database reference
            self.database = self.client[db_config.database_name]
            
            # Test the connection
            await self.client.admin.command('ping')
            self._connected = True
            
            logger.info("✅ Successfully connected to MongoDB")
            
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
        except ServerSelectionTimeoutError as e:
            logger.error(f"❌ MongoDB server selection timeout: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("🔌 Disconnected from MongoDB")
    
    async def ping(self) -> bool:
        """Test database connectivity."""
        try:
            if not self.client:
                return False
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"❌ MongoDB ping failed: {e}")
            return False
    
    def is_connected(self) -> bool:
        """Check if database is connected."""
        return self._connected and self.client is not None
    
    def get_database(self) -> AsyncIOMotorDatabase:
        """Get database instance."""
        if self.database is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.database
    
    def get_collection(self, collection_name: str):
        """Get collection from database."""
        database = self.get_database()
        return database[collection_name]


# Global database manager instance
db_manager = DatabaseManager()


