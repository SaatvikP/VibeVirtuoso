import cv2
import os

print("Testing webcam access...")

# Test basic webcam access
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Error: Could not open webcam")
    exit(1)

print("✅ Webcam opened successfully!")

# Test reading a frame
ret, frame = cap.read()
if not ret:
    print("❌ Error: Could not read from webcam")
    cap.release()
    exit(1)

print(f"✅ Frame captured! Size: {frame.shape}")

# Try to display a window
print("🎥 Attempting to show webcam window...")
print("📱 IMPORTANT: Check your macOS camera permissions!")
print("⚠️  If no window appears, check System Preferences > Security & Privacy > Camera")

# Show the frame
cv2.imshow("Test Webcam", frame)
print("🎹 Press any key in the webcam window to close...")

# Wait for key press
key = cv2.waitKey(0)
print(f"✅ Key pressed: {key}")

# Cleanup
cap.release()
cv2.destroyAllWindows()
print("✅ Test completed!")