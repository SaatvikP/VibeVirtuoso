#!/usr/bin/env python3

import subprocess
import sys

def check_python_processes():
    """Check for running Python gesture processes"""
    try:
        # Get all Python processes
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        print("🔍 Checking for active Python processes...")
        print("=" * 60)
        
        gesture_processes = []
        for line in lines:
            if 'python' in line and ('gesture' in line or 'main.py' in line):
                gesture_processes.append(line.strip())
        
        if gesture_processes:
            print(f"Found {len(gesture_processes)} gesture-related processes:")
            for i, proc in enumerate(gesture_processes, 1):
                parts = proc.split()
                pid = parts[1]
                command = ' '.join(parts[10:])  # Command part
                print(f"{i}. PID: {pid} - {command}")
        else:
            print("✅ No gesture processes found")
        
        print("=" * 60)
        return gesture_processes
        
    except Exception as e:
        print(f"❌ Error checking processes: {e}")
        return []

def kill_all_gesture_processes():
    """Kill all gesture-related Python processes"""
    processes = check_python_processes()
    
    if not processes:
        print("No processes to kill")
        return
    
    killed = 0
    for proc in processes:
        try:
            parts = proc.split()
            pid = parts[1]
            print(f"🛑 Killing process {pid}...")
            subprocess.run(['kill', '-TERM', pid])
            killed += 1
        except Exception as e:
            print(f"❌ Failed to kill process: {e}")
    
    print(f"✅ Attempted to kill {killed} processes")
    print("Checking again in 2 seconds...")
    
    import time
    time.sleep(2)
    check_python_processes()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "kill":
        kill_all_gesture_processes()
    else:
        check_python_processes()
        print("\nUsage:")
        print("  python check_processes.py       # Check processes")
        print("  python check_processes.py kill  # Kill all gesture processes")