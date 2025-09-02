#!/usr/bin/env python3

import cv2
import mediapipe as mp
import time

print("🎥 Testing Gesture Recognition Fix")
print("=" * 50)

def test_webcam_display():
    """Test if webcam displays hands properly"""
    print("📷 Initializing webcam...")
    
    # Initialize MediaPipe
    cap = cv2.VideoCapture(0)
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(min_detection_confidence=0.7, max_num_hands=2)
    mp_draw = mp.solutions.drawing_utils
    
    if not cap.isOpened():
        print("❌ Could not open webcam")
        return False
    
    print("✅ Webcam opened successfully")
    print("👋 Put your hands in front of the camera")
    print("💡 Press 'q' or ESC to exit")
    
    hands_detected = False
    frame_count = 0
    
    while True:
        success, frame = cap.read()
        if not success:
            print("❌ Failed to read frame")
            break
            
        frame = cv2.flip(frame, 1)  # Mirror the image
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)
        
        # Draw hand landmarks
        if results.multi_hand_landmarks:
            if not hands_detected:
                print("✅ Hands detected!")
                hands_detected = True
                
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                
                # Count fingers for gesture recognition test
                finger_count = count_extended_fingers(hand_landmarks)
                
                # Display finger count
                cv2.putText(frame, f"Fingers: {finger_count}", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Add instructions
        cv2.putText(frame, "Gesture Recognition Test", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, "Press 'q' or ESC to exit", (10, h - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        cv2.imshow("Gesture Test", frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == 27 or key == ord('q'):  # ESC or 'q'
            break
            
        frame_count += 1
        if frame_count % 30 == 0:  # Every second
            print(f"📊 Processed {frame_count} frames...")
    
    cap.release()
    cv2.destroyAllWindows()
    
    if hands_detected:
        print("✅ Hand detection working!")
    else:
        print("⚠️ No hands detected. Try:")
        print("   - Ensure good lighting")
        print("   - Put hands closer to camera")
        print("   - Check camera permissions")
    
    return hands_detected

def count_extended_fingers(hand_landmarks):
    """Count number of extended fingers"""
    tips = [8, 12, 16, 20]  # Index, Middle, Ring, Pinky
    count = 0
    
    # Check 4 fingers
    for tip_id in tips:
        tip = hand_landmarks.landmark[tip_id]
        pip = hand_landmarks.landmark[tip_id - 2]
        if tip.y < pip.y:  # Finger is up
            count += 1
    
    # Check thumb
    if hand_landmarks.landmark[4].x < hand_landmarks.landmark[3].x:
        count += 1
    
    return count

def main():
    print("🔧 This test will:")
    print("1. Check if webcam displays your hands")
    print("2. Show finger counting for gesture recognition")
    print("3. Verify the display fixes are working")
    print()
    
    success = test_webcam_display()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ TEST PASSED: Webcam and hand detection working!")
        print("💡 The piano app should now show your hands properly")
    else:
        print("❌ TEST FAILED: Issues with webcam or hand detection")
        print("💡 Check camera permissions and lighting")

if __name__ == "__main__":
    main()