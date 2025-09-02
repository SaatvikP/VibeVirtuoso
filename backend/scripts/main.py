import cv2
import mediapipe as mp
import threading
import os
import signal
import subprocess
import uuid
from datetime import datetime
import speech_recognition as sr
import time

# Instrument scripts
instrument_scripts = {
    "flute": os.path.join("scripts", "gesture_flute.py"),
    "drums": os.path.join("scripts", "gesture_drums.py"),
    "guitar": os.path.join("scripts", "gesture_guitar.py"),
    "piano": os.path.join("scripts", "gesture_piano.py"),
    "saxophone": os.path.join("scripts", "gesture_sax_player.py"),
    "violin": os.path.join("scripts", "gesture_violin.py"),
}

# MediaPipe + Webcam
cap = cv2.VideoCapture(0)
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.7, max_num_hands=2)
mp_draw = mp.solutions.drawing_utils

current_instrument = None
current_process = None
recording_process = None

def initialize_camera():
    if not cap.isOpened():
        print("❌ Webcam not found")
        exit()

def stop_current_instrument():
    global current_process, recording_process
    if recording_process:
        try:
            recording_process.terminate()
            recording_process.wait(timeout=3)  # Wait up to 3 seconds
            print("🛑 Stopped recording.")
        except subprocess.TimeoutExpired:
            recording_process.kill()  # Force kill if needed
            print("🛑 Force-killed recording.")
        except:
            pass
        recording_process = None

    if current_process:
        try:
            print(f"🛑 Stopping instrument process (PID: {current_process.pid})")
            # First try graceful termination
            os.killpg(os.getpgid(current_process.pid), signal.SIGTERM)
            current_process.wait(timeout=3)  # Wait up to 3 seconds
            print("✅ Stopped current instrument gracefully.")
        except subprocess.TimeoutExpired:
            # Force kill if graceful didn't work
            try:
                os.killpg(os.getpgid(current_process.pid), signal.SIGKILL)
                print("💀 Force-killed current instrument.")
            except ProcessLookupError:
                print("⚠️ Process already terminated.")
        except ProcessLookupError:
            print("⚠️ Process already terminated.")
        current_process = None
        
    # Additional cleanup - make sure no old gesture processes are lingering
    try:
        subprocess.run(['pkill', '-f', 'gesture_piano'], capture_output=True)
        subprocess.run(['pkill', '-f', 'gesture_drums'], capture_output=True)
        subprocess.run(['pkill', '-f', 'gesture_guitar'], capture_output=True)
        subprocess.run(['pkill', '-f', 'gesture_flute'], capture_output=True)
        subprocess.run(['pkill', '-f', 'gesture_violin'], capture_output=True)
        subprocess.run(['pkill', '-f', 'gesture_sax'], capture_output=True)
        print("🧹 Additional cleanup of gesture processes completed")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")
        
    # Small delay to ensure cleanup
    time.sleep(0.5)

def start_recording(instrument):
    global recording_process
    filename = f"{instrument}_{uuid.uuid4().hex}.wav"
    filepath = os.path.join("recordings", filename)
    os.makedirs("recordings", exist_ok=True)

    try:
        recording_process = subprocess.Popen(
            ["python", "scripts/record_audio.py", filepath],
            preexec_fn=os.setsid
        )
        print(f"🔴 Started recording {instrument} to {filepath}")
    except Exception as e:
        print(f"❌ Failed to start recording: {e}")

def switch_instrument(instrument_name):
    global current_instrument, current_process

    if instrument_name not in instrument_scripts:
        print("❌ Invalid instrument name.")
        return

    if instrument_name == current_instrument:
        print(f"ℹ️ Already on {instrument_name}, skipping.")
        return

    stop_current_instrument()

    print(f"🎼 Switching to {instrument_name}")
    current_instrument = instrument_name

    try:
        current_process = subprocess.Popen(
            ["python", instrument_scripts[instrument_name]],
            preexec_fn=os.setsid
        )
        print(f"✅ Launched {instrument_name} script (PID: {current_process.pid})")
        # NOTE: Recording removed - only record when explicitly requested via API
    except Exception as e:
        print(f"🚫 Failed to launch {instrument_name}: {e}")

def auto_start_instrument(instrument_name):
    """Auto-start with specific instrument (called from web frontend)"""
    if instrument_name in instrument_scripts:
        switch_instrument(instrument_name)
    else:
        print(f"❌ Unknown instrument: {instrument_name}")
        print(f"Available: {list(instrument_scripts.keys())}")

def extract_instrument_name(command):
    for instrument in instrument_scripts:
        if instrument in command:
            return instrument
    return None

# ==== Voice Command Thread ====

def listen_for_voice_commands():
    recognizer = sr.Recognizer()
    mic = sr.Microphone()
    while True:
        with mic as source:
            recognizer.adjust_for_ambient_noise(source)
            print("🎙️ Say an instrument (flute, guitar, etc.)")
            try:
                audio = recognizer.listen(source, timeout=5)
                command = recognizer.recognize_google(audio).lower()
                print(f"🗣️ Heard: {command}")
                instrument = extract_instrument_name(command)
                if instrument:
                    threading.Thread(target=switch_instrument, args=(instrument,), daemon=True).start()
                else:
                    print("⚠️ No valid instrument found in voice command.")
            except sr.UnknownValueError:
                print("❓ Could not understand audio.")
            except sr.WaitTimeoutError:
                print("⌛ Listening timed out.")
            except sr.RequestError as e:
                print(f"⚠️ Speech service error: {e}")

# ==== Main Gesture + Keyboard Loop ====

def process_gestures():
    while True:
        success, img = cap.read()
        if not success:
            continue

        img = cv2.flip(img, 1)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        result = hands.process(img_rgb)

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                # Determine if it's left or right hand for color coding
                wrist_x = hand_landmarks.landmark[0].x * img.shape[1]
                is_right = wrist_x > img.shape[1] / 2
                
                # Color code: Green for right hand, Purple for left hand
                hand_color = (0, 255, 0) if is_right else (128, 0, 128)
                connection_color = (0, 200, 0) if is_right else (100, 0, 100)
                
                mp_draw.draw_landmarks(
                    img, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                    landmark_drawing_spec=mp_draw.DrawingSpec(color=hand_color, thickness=2, circle_radius=2),
                    connection_drawing_spec=mp_draw.DrawingSpec(color=connection_color, thickness=2)
                )

        if current_instrument:
            cv2.putText(
                img, f"🎹 Instrument: {current_instrument.upper()}",
                (10, img.shape[0] - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2
            )

        cv2.putText(
            img, "[1] Flute [2] Drums [3] Guitar [4] Piano [5] Sax [6] Violin [Q] Quit",
            (10, img.shape[0] - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 255, 150), 1
        )
        
        cv2.putText(
            img, "Green = Right Hand | Purple = Left Hand",
            (10, img.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1
        )

        
        cv2.imshow("Gesture Controller", img)


        key = cv2.waitKey(1) & 0xFF
        if key == 27 or key == ord('q'):
            break
        elif key == ord('1'):
            threading.Thread(target=switch_instrument, args=("flute",), daemon=True).start()
        elif key == ord('2'):
            threading.Thread(target=switch_instrument, args=("drums",), daemon=True).start()
        elif key == ord('3'):
            threading.Thread(target=switch_instrument, args=("guitar",), daemon=True).start()
        elif key == ord('4'):
            threading.Thread(target=switch_instrument, args=("piano",), daemon=True).start()
        elif key == ord('5'):
            threading.Thread(target=switch_instrument, args=("saxophone",), daemon=True).start()
        elif key == ord('6'):
            threading.Thread(target=switch_instrument, args=("violin",), daemon=True).start()

    cap.release()
    stop_current_instrument()
    cv2.destroyAllWindows()

# ==== Entry Point ====

def main():
    import sys
    
    # Check if instrument was passed as command line argument
    if len(sys.argv) > 1:
        requested_instrument = sys.argv[1].lower()
        print(f"🎵 Starting with instrument: {requested_instrument}")
        initialize_camera()
        
        # Auto-start the requested instrument
        auto_start_instrument(requested_instrument)
        
        # Start voice commands in background
        threading.Thread(target=listen_for_voice_commands, daemon=True).start()
        
        # Process gestures
        process_gestures()
    else:
        # Default behavior - let user choose manually
        print("🎵 Starting with manual instrument selection")
        initialize_camera()
        threading.Thread(target=listen_for_voice_commands, daemon=True).start()
        process_gestures()

if __name__ == "__main__":
    main()
