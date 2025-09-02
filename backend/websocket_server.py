import asyncio
import json
import base64
import cv2
import numpy as np
import mediapipe as mp
from fastapi import WebSocket, WebSocketDisconnect
import logging
from typing import Dict, List, Optional
from datetime import datetime
import io
from PIL import Image

logger = logging.getLogger(__name__)

class GestureDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,  # Higher for more stable detection
            min_tracking_confidence=0.7,   # Higher for smoother tracking
            model_complexity=1             # Better accuracy
        )
        self.mp_draw = mp.solutions.drawing_utils
        
    def detect_gesture_with_landmarks(self, image_array):
        """Detect hand gestures and return landmarks for visualization"""
        try:
            # Convert to RGB
            rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_image)
            
            gestures = []
            landmarks_data = []
            
            if results.multi_hand_landmarks:
                for i, hand_landmarks in enumerate(results.multi_hand_landmarks):
                    # Convert landmarks to serializable format
                    landmarks_list = []
                    for landmark in hand_landmarks.landmark:
                        landmarks_list.append({
                            "x": landmark.x,
                            "y": landmark.y,
                            "z": landmark.z
                        })
                    
                    landmarks_data.append(landmarks_list)
                    
                    # Classify gesture with confidence
                    gesture = self._classify_gesture_improved(hand_landmarks)
                    if gesture and gesture["confidence"] > 0.4:  # Lower threshold for more responsive detection
                        gestures.append(gesture)
            
            return {
                "gestures": gestures,
                "landmarks": landmarks_data
            }
        except Exception as e:
            logger.error(f"Gesture detection error: {e}")
            return {"gestures": [], "landmarks": []}
    
    def _classify_gesture_improved(self, landmarks):
        """Improved gesture classification with better confidence"""
        try:
            # Get landmark positions
            points = []
            for lm in landmarks.landmark:
                points.append([lm.x, lm.y])
            
            # Finger tip and base indices
            FINGER_TIPS = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
            FINGER_BASES = [3, 6, 10, 14, 18]  # Base joints for comparison
            
            extended_fingers = []
            confidence = 0.0
            
            # Check each finger
            for i, (tip_idx, base_idx) in enumerate(zip(FINGER_TIPS, FINGER_BASES)):
                tip = points[tip_idx]
                base = points[base_idx]
                
                # Different logic for thumb vs fingers
                if i == 0:  # Thumb
                    # Thumb extended if tip is further right than base (for right hand)
                    wrist = points[0]
                    if abs(tip[0] - wrist[0]) > abs(base[0] - wrist[0]) * 1.2:
                        extended_fingers.append(i)
                        confidence += 0.15
                else:  # Other fingers
                    # Finger extended if tip is above base (more lenient)
                    if tip[1] < base[1] - 0.02:  # Less strict threshold
                        extended_fingers.append(i)
                        confidence += 0.2
            
            finger_count = len(extended_fingers)
            
            # Only return gesture if confidence is high enough (lowered threshold)
            if confidence < 0.2:
                return None
                
            # Map to gesture names with improved logic
            if finger_count == 0:
                gesture_name = "fist"
                confidence = min(confidence + 0.3, 1.0)
            elif finger_count == 1:
                if 1 in extended_fingers:  # Index finger
                    gesture_name = "point"
                else:
                    gesture_name = "point"  # Default for single finger
            elif finger_count == 2:
                if 1 in extended_fingers and 2 in extended_fingers:  # Index + Middle
                    gesture_name = "peace"
                else:
                    gesture_name = "peace"  # Default for two fingers
            elif finger_count == 3:
                gesture_name = "three"
            elif finger_count == 4:
                gesture_name = "four"
            else:  # 5 fingers
                gesture_name = "open_hand"
                confidence = min(confidence + 0.2, 1.0)
            
            gesture_result = {
                "name": gesture_name,
                "fingers": extended_fingers,
                "count": finger_count,
                "confidence": min(confidence, 1.0)
            }
            
            # Only log high-confidence gestures to reduce spam
            if confidence > 0.7:
                logger.debug(f"High confidence gesture: {gesture_name} ({confidence:.2f})")
            
            return gesture_result
            
        except Exception as e:
            logger.error(f"Gesture classification error: {e}")
            return None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.gesture_detector = GestureDetector()
        self.last_gesture_state = {}  # Track last gesture per connection
        self.gesture_debounce_time = 1.0  # Minimum time between same gesture (seconds)
        self.connection_instruments = {}  # Track current instrument per connection
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        connection_id = id(websocket)
        # Clean up gesture state for this connection
        if connection_id in self.last_gesture_state:
            del self.last_gesture_state[connection_id]
        # Clean up instrument state
        if connection_id in self.connection_instruments:
            del self.connection_instruments[connection_id]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
        
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)
            
    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def process_video_frame(self, websocket: WebSocket, data: dict):
        """Process incoming video frame for gesture detection"""
        try:
            # Decode base64 image
            image_data = data.get("image", "").split(",")[1]  # Remove data:image/jpeg;base64,
            image_bytes = base64.b64decode(image_data)
            
            # Convert to OpenCV format
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return
                
            # Detect gestures with hand landmarks
            results = self.gesture_detector.detect_gesture_with_landmarks(image)
            
            # Send results back with hand skeleton data (simplified - no debouncing)
            if results and len(results["gestures"]) > 0:
                connection_id = id(websocket)
                current_gesture = results["gestures"][0]["name"]
                
                # Get current instrument for this connection
                current_instrument = self.connection_instruments.get(connection_id, "piano")
                
                response = {
                    "type": "gesture_detected", 
                    "gestures": results["gestures"],
                    "landmarks": results["landmarks"],  # Hand skeleton data
                    "image_width": image.shape[1],
                    "image_height": image.shape[0],
                    "instrument": current_instrument,
                    "timestamp": data.get("timestamp", datetime.now().isoformat()),
                    "gesture": current_gesture
                }
                
                await self.send_personal_message(json.dumps(response), websocket)
                # Only log occasionally to reduce spam
                if datetime.now().timestamp() % 2 < 0.1:  # Log roughly every 2 seconds
                    logger.info(f"Gesture: {current_gesture} on {current_instrument}")
                
        except Exception as e:
            logger.error(f"Error processing video frame: {e}")

# Global connection manager
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for gesture detection"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "video_frame":
                # Process video frame for gesture detection
                await manager.process_video_frame(websocket, message)
                
            elif message_type == "instrument_change":
                # Handle instrument change
                instrument = message.get("instrument")
                connection_id = id(websocket)
                
                # Store the instrument for this connection
                manager.connection_instruments[connection_id] = instrument
                logger.info(f"Instrument changed to: {instrument}")
                
                # Send confirmation
                response = {
                    "type": "instrument_changed",
                    "instrument": instrument,
                    "timestamp": datetime.now().isoformat()
                }
                await manager.send_personal_message(json.dumps(response), websocket)
                
            elif message_type == "ping":
                # Handle ping/pong for connection health
                response = {"type": "pong", "timestamp": datetime.now().isoformat()}
                await manager.send_personal_message(json.dumps(response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)