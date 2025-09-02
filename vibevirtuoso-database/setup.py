#!/usr/bin/env python3
"""
Setup script for VibeVirtuoso Database Layer
"""
import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"   stdout: {e.stdout}")
        print(f"   stderr: {e.stderr}")
        return False

def main():
    """Set up the VibeVirtuoso database layer."""
    print("🎵 VibeVirtuoso Database Layer Setup")
    print("=" * 50)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return 1
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    
    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        return 1
    
    # Check for .env file
    env_file = script_dir / ".env"
    if not env_file.exists():
        print("\n⚠️  Setting up environment configuration...")
        try:
            # Copy example to .env
            example_file = script_dir / ".env.example"
            if example_file.exists():
                import shutil
                shutil.copy(example_file, env_file)
                print(f"✅ Created .env from example")
                print(f"📝 Please edit {env_file} with your MongoDB connection details")
            else:
                print("❌ No .env.example found")
                return 1
        except Exception as e:
            print(f"❌ Failed to create .env: {e}")
            return 1
    else:
        print("✅ .env file already exists")
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Edit .env with your MongoDB connection string")
    print("2. Run: python start.py")
    print("3. Visit: http://127.0.0.1:8001/health")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())