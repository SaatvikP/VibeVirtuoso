#!/usr/bin/env python3

import subprocess
import sys
import os

def test_camera_permissions():
    """Test if camera permissions are granted."""
    print("🔍 Testing camera permissions...")
    
    # Try to use system_profiler to check camera
    try:
        result = subprocess.run(
            ["system_profiler", "SPCameraDataType"], 
            capture_output=True, 
            text=True
        )
        
        if "Camera" in result.stdout:
            print("✅ Camera hardware detected")
        else:
            print("❌ No camera hardware found")
            
    except Exception as e:
        print(f"⚠️ Could not check camera hardware: {e}")

def test_python_camera_access():
    """Test Python camera access without OpenCV."""
    print("\n🐍 Testing Python camera access...")
    
    # Try to access camera with basic approach
    try:
        import platform
        system = platform.system()
        
        if system == "Darwin":  # macOS
            # Check if Terminal/Python has camera permissions
            print("📱 On macOS, make sure to grant camera permissions to:")
            print("   - Terminal.app (if running from terminal)")
            print("   - Python (in System Preferences > Security & Privacy > Camera)")
            print("   - PyCharm, VS Code, or your IDE (if running from there)")
            
        print("💡 To grant permissions:")
        print("   1. Go to System Preferences > Security & Privacy > Camera")
        print("   2. Check the app you're using to run Python")
        print("   3. Restart your terminal/IDE after granting permissions")
            
    except Exception as e:
        print(f"⚠️ Error in camera test: {e}")

def main():
    print("🎥 VibeVirtuoso Camera Test")
    print("=" * 50)
    
    test_camera_permissions()
    test_python_camera_access()
    
    print("\n" + "=" * 50)
    print("📋 Next Steps:")
    print("1. Check macOS camera permissions in System Preferences")
    print("2. Restart your terminal/IDE after granting permissions")
    print("3. Try clicking 'Begin Making Music' in the web app again")
    print("4. Look for a 'Gesture Controller' window on your desktop")

if __name__ == "__main__":
    main()