#!/usr/bin/env python3
"""
Standalone startup script for VibeVirtuoso Database Layer
"""
import uvicorn
import os
import sys
from pathlib import Path

def main():
    """Start the VibeVirtuoso database server."""
    # Change to the script's directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🚀 Starting VibeVirtuoso Database Layer...")
    print(f"📁 Working directory: {script_dir}")
    print("🌐 Server will be available at: http://127.0.0.1:8001")
    print("📖 API documentation: http://127.0.0.1:8001/docs (disabled in production)")
    print("❤️  Health check: http://127.0.0.1:8001/health")
    print("-" * 60)
    
    # Check if .env file exists
    env_file = script_dir / ".env"
    if not env_file.exists():
        print("⚠️  WARNING: No .env file found!")
        print(f"   Please copy .env.example to .env and configure your MongoDB connection.")
        print(f"   Expected location: {env_file}")
        return 1
    
    try:
        uvicorn.run(
            "app:app",
            host="127.0.0.1",
            port=8001,
            reload=True,
            log_level="info",
            reload_dirs=[str(script_dir)]
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return 0
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())