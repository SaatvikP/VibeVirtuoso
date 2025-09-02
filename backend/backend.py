from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
# from db.mongo import recordings  # REMOVED: Old database import
from scripts.gesture_control import handle_gesture
from websocket_server import websocket_endpoint
import subprocess
import os
import signal
import uuid
import threading
import time

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

class Trigger(BaseModel):
    gesture: str
    instrument: str

@app.post("/play")
def play_sound(trigger: Trigger):
    result = handle_gesture(trigger.gesture, trigger.instrument)

    entry = {
        "gesture": trigger.gesture,
        "instrument": trigger.instrument,
        "timestamp": datetime.utcnow().isoformat()
    }

    # TODO: Connect to new database layer at http://127.0.0.1:8001
    # recordings.insert_one(entry)  # REMOVED: Old database operation

    return {**entry, "status": "ok", "played": result}

@app.get("/recordings")
def get_recordings():
    # TODO: Connect to new database layer at http://127.0.0.1:8001
    # return {"recordings": list(recordings.find({}, {"_id": 0}))}  # REMOVED: Old database operation
    return {
        "recordings": [],
        "message": "Connect to database layer at http://127.0.0.1:8001 for recordings"
    }

# Store the process globally
gesture_process = None
recording_process = None
current_recording_file = None

@app.get("/start-webcam")
def start_webcam():
    global gesture_process

    if gesture_process is None or gesture_process.poll() is not None:
        # Start with piano as default
        gesture_process = subprocess.Popen(
            ["python", "scripts/main.py", "piano"],
            preexec_fn=os.setsid
        )
        return {"status": "started", "message": "Python webcam launched with Piano! Look for the 'Gesture Controller' window."}
    else:
        return {"status": "already running", "message": "Webcam is already running"}

@app.get("/stop-webcam")
def stop_webcam():
    global gesture_process

    if gesture_process and gesture_process.poll() is None:
        try:
            # Send SIGTERM to the entire process group
            os.killpg(os.getpgid(gesture_process.pid), signal.SIGTERM)
            
            # Wait for graceful termination
            try:
                gesture_process.wait(timeout=3)
                print("🛑 Webcam stopped gracefully")
            except subprocess.TimeoutExpired:
                # Force kill if needed
                os.killpg(os.getpgid(gesture_process.pid), signal.SIGKILL)
                print("🛑 Webcam force-killed")
        except ProcessLookupError:
            print("⚠️ Process already terminated")
        except Exception as e:
            print(f"⚠️ Error stopping webcam: {e}")
        
        gesture_process = None
        return {"status": "stopped", "message": "All processes stopped"}
    return {"status": "not running", "message": "No webcam process running"}

@app.get("/cleanup-processes")
def cleanup_all_processes():
    """Emergency cleanup of all gesture processes"""
    try:
        # Kill all Python processes containing 'gesture' or 'main.py'
        result = subprocess.run(['pkill', '-f', 'gesture'], capture_output=True)
        result2 = subprocess.run(['pkill', '-f', 'main.py'], capture_output=True)
        
        global gesture_process
        gesture_process = None
        
        return {"status": "cleaned", "message": "All gesture processes terminated"}
    except Exception as e:
        return {"status": "error", "message": f"Cleanup failed: {str(e)}"}

@app.get("/start")
def start_main_script():
    subprocess.Popen(["python3", "scripts/main.py"])
    return {"status": "started", "message": "Gesture control activated!"}

@app.get("/launch-instrument/{instrument}")
def launch_instrument(instrument: str):
    global gesture_process
    
    # Valid instruments
    valid_instruments = ["piano", "drums", "guitar", "flute", "violin", "saxophone"]
    
    if instrument not in valid_instruments:
        return {"status": "error", "message": f"Unknown instrument: {instrument}"}
    
    # Stop current process if running with better cleanup
    if gesture_process and gesture_process.poll() is None:
        try:
            print(f"🛑 Stopping previous process (PID: {gesture_process.pid})")
            
            # First kill all child processes by killing the process group
            try:
                os.killpg(os.getpgid(gesture_process.pid), signal.SIGTERM)
                print("📡 Sent SIGTERM to process group")
            except ProcessLookupError:
                print("⚠️ Process group already gone")
            
            # Wait for graceful termination
            try:
                gesture_process.wait(timeout=5)  # Increased timeout
                print("✅ Previous process stopped gracefully")
            except subprocess.TimeoutExpired:
                print("⏰ Timeout expired, force killing...")
                # Force kill the entire process group
                try:
                    os.killpg(os.getpgid(gesture_process.pid), signal.SIGKILL)
                    print("💀 Previous process force-killed")
                except ProcessLookupError:
                    print("⚠️ Process group already terminated")
                    
        except ProcessLookupError:
            print("⚠️ Previous process already terminated")
        except Exception as e:
            print(f"❌ Error stopping previous process: {e}")
        
        # Longer delay to ensure complete cleanup
        import time
        time.sleep(1.0)
        
        # Additional cleanup - kill any lingering gesture processes
        try:
            subprocess.run(['pkill', '-f', 'gesture_'], capture_output=True)
            subprocess.run(['pkill', '-f', 'main.py'], capture_output=True) 
            print("🧹 Cleaned up any lingering gesture processes")
        except Exception as e:
            print(f"⚠️ Additional cleanup warning: {e}")
    
    # Start main.py with instrument parameter
    gesture_process = subprocess.Popen(
        ["python", "scripts/main.py", instrument],
        preexec_fn=os.setsid
    )
    
    return {
        "status": "started", 
        "instrument": instrument,
        "message": f"{instrument.title()} auto-selected! The Python window will start with {instrument} ready to play."
    }

# WebSocket endpoint
@app.websocket("/ws/gesture")
async def gesture_websocket(websocket: WebSocket):
    await websocket_endpoint(websocket)

# Recording endpoints
class RecordingStart(BaseModel):
    instrument: str

@app.post("/recording/start")
def start_recording(data: RecordingStart):
    global recording_process, current_recording_file
    
    # Stop any existing recording
    if recording_process and recording_process.poll() is None:
        recording_process.terminate()
    
    # Create recordings directory
    os.makedirs("recordings", exist_ok=True)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"recording_{data.instrument}_{timestamp}_{uuid.uuid4().hex[:8]}.wav"
    filepath = os.path.join("recordings", filename)
    current_recording_file = filepath
    
    try:
        # Start recording using system audio recording
        recording_process = subprocess.Popen([
            "ffmpeg", "-f", "avfoundation", "-i", ":0", 
            "-t", "300",  # Max 5 minutes
            filepath
        ])
        
        return {
            "status": "started",
            "filename": filename,
            "filepath": filepath,
            "instrument": data.instrument
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to start recording: {str(e)}"
        }

@app.post("/recording/stop")
def stop_recording():
    global recording_process, current_recording_file
    
    if recording_process and recording_process.poll() is None:
        recording_process.terminate()
        recording_process.wait()  # Wait for process to finish
        
        return {
            "status": "stopped",
            "filename": os.path.basename(current_recording_file) if current_recording_file else None,
            "filepath": current_recording_file
        }
    else:
        return {
            "status": "not_recording",
            "message": "No active recording found"
        }

@app.get("/recording/list")
def list_recordings():
    try:
        recordings_dir = "recordings"
        if not os.path.exists(recordings_dir):
            return {"recordings": []}
        
        files = []
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.wav'):
                filepath = os.path.join(recordings_dir, filename)
                stat = os.stat(filepath)
                files.append({
                    "filename": filename,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort by creation time (newest first)
        files.sort(key=lambda x: x['created'], reverse=True)
        
        return {"recordings": files}
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to list recordings: {str(e)}",
            "recordings": []
        }

@app.get("/recording/play/{filename}")
def play_recording(filename: str):
    """Serve recording file for playback"""
    try:
        filepath = os.path.join("recordings", filename)
        if os.path.exists(filepath):
            return FileResponse(
                path=filepath,
                media_type="audio/wav",
                headers={"Content-Disposition": f"inline; filename={filename}"}
            )
        else:
            return {"status": "error", "message": "Recording not found"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to serve recording: {str(e)}"}

@app.delete("/recording/delete/{filename}")
def delete_recording(filename: str):
    """Delete a recording file"""
    try:
        filepath = os.path.join("recordings", filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return {"status": "success", "message": f"Recording {filename} deleted"}
        else:
            return {"status": "error", "message": "Recording not found"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to delete recording: {str(e)}"}

class MixRecordings(BaseModel):
    recordings: list[str]
    output_filename: str

@app.post("/recording/mix")
def mix_recordings(data: MixRecordings):
    """Mix multiple recordings together"""
    try:
        import numpy as np
        from scipy.io import wavfile
        
        mixed_audio = None
        sample_rate = None
        
        for filename in data.recordings:
            filepath = os.path.join("recordings", filename)
            if not os.path.exists(filepath):
                return {"status": "error", "message": f"Recording {filename} not found"}
            
            rate, audio = wavfile.read(filepath)
            
            if sample_rate is None:
                sample_rate = rate
                mixed_audio = audio.astype(np.float32)
            else:
                if rate != sample_rate:
                    return {"status": "error", "message": "Sample rates don't match"}
                
                # Pad shorter audio with zeros
                if len(audio) > len(mixed_audio):
                    mixed_audio = np.pad(mixed_audio, (0, len(audio) - len(mixed_audio)), 'constant')
                elif len(mixed_audio) > len(audio):
                    audio = np.pad(audio, (0, len(mixed_audio) - len(audio)), 'constant')
                
                mixed_audio += audio.astype(np.float32)
        
        # Normalize to prevent clipping
        if mixed_audio is not None:
            mixed_audio = mixed_audio / len(data.recordings)
            mixed_audio = np.clip(mixed_audio, -32768, 32767).astype(np.int16)
            
            output_path = os.path.join("recordings", data.output_filename)
            wavfile.write(output_path, sample_rate, mixed_audio)
            
            return {
                "status": "success",
                "filename": data.output_filename,
                "message": f"Mixed {len(data.recordings)} recordings"
            }
        
        return {"status": "error", "message": "No audio to mix"}
        
    except Exception as e:
        return {"status": "error", "message": f"Failed to mix recordings: {str(e)}"}