from .base_instrument import BaseInstrument
import pygame
import logging

logger = logging.getLogger(__name__)

class Drums(BaseInstrument):
    """Virtual Drum Kit Instrument"""
    
    def __init__(self):
        super().__init__("drums", "sounds/drums")
        
    def load_sounds(self):
        """Load drum sound samples"""
        # Standard drum kit sounds
        drum_sounds = {
            "kick": "kick.wav",
            "snare": "snare.wav", 
            "hihat": "hihat.wav",
            "crash": "crash.wav",
            "tom": "tom.wav",
            "ride": "ride.wav"
        }
        
        # Load drum samples
        for sound_name, filename in drum_sounds.items():
            if not self.load_sound_file(sound_name, filename):
                # Generate fallback percussion sounds if samples not found
                self.generate_drum_sound(sound_name)
    
    def setup_parameters(self):
        """Set up drums-specific parameters"""
        self.gesture_drum_mapping = {
            "fist": "kick",
            "point": "snare",
            "peace": "hihat", 
            "three": "crash",
            "four": "tom",
            "open_hand": "ride"
        }
        
        self.volume_mapping = {
            "fist": 1.0,    # Kick - loud
            "point": 0.9,   # Snare - loud
            "peace": 0.6,   # Hi-hat - medium
            "three": 0.8,   # Crash - loud
            "four": 0.7,    # Tom - medium-loud  
            "open_hand": 0.6 # Ride - medium
        }
    
    def play_gesture(self, gesture: str, intensity: float = 1.0, **kwargs) -> bool:
        """Play drum sound based on gesture"""
        try:
            if gesture in self.gesture_drum_mapping:
                drum = self.gesture_drum_mapping[gesture]
                volume = self.volume_mapping.get(gesture, 0.7) * intensity
                
                logger.info(f"Playing drum {drum} for gesture {gesture}")
                return self.play_sound(drum, volume)
            else:
                logger.warning(f"Unknown gesture for drums: {gesture}")
                return False
                
        except Exception as e:
            logger.error(f"Error playing drums gesture {gesture}: {e}")
            return False
    
    def generate_drum_sound(self, drum_type: str):
        """Generate synthetic drum sounds"""
        try:
            import numpy as np
            import random
            
            sample_rate = 44100
            
            if drum_type == "kick":
                # Low frequency sine wave with quick decay
                duration = 0.3
                frequency = 60
                frames = int(duration * sample_rate)
                arr = np.zeros((frames, 2))
                
                for i in range(frames):
                    time_point = i / sample_rate
                    # Exponential decay envelope
                    envelope = np.exp(-time_point * 15)
                    wave = np.sin(2 * np.pi * frequency * time_point) * envelope
                    arr[i] = wave * 0.8
                    
            elif drum_type == "snare":
                # White noise with band-pass filtering
                duration = 0.15
                frames = int(duration * sample_rate)
                arr = np.random.normal(0, 0.1, (frames, 2))
                
                # Apply envelope
                for i in range(frames):
                    envelope = np.exp(-(i / sample_rate) * 20)
                    arr[i] *= envelope * 0.6
                    
            elif drum_type == "hihat":
                # High frequency noise
                duration = 0.1
                frames = int(duration * sample_rate)
                arr = np.random.normal(0, 0.05, (frames, 2))
                
                # High-pass filter effect (simplified)
                for i in range(frames):
                    envelope = np.exp(-(i / sample_rate) * 50)
                    arr[i] *= envelope * 0.4
                    
            else:
                # Generic percussive sound
                duration = 0.2
                frequency = 200 + random.randint(0, 300)
                frames = int(duration * sample_rate)
                arr = np.zeros((frames, 2))
                
                for i in range(frames):
                    time_point = i / sample_rate
                    envelope = np.exp(-time_point * 10)
                    wave = np.sin(2 * np.pi * frequency * time_point) * envelope
                    # Add some noise
                    wave += np.random.normal(0, 0.1) * envelope * 0.3
                    arr[i] = wave * 0.5
            
            # Convert to pygame sound
            arr = np.clip(arr * 32767, -32767, 32767).astype(np.int16)
            sound = pygame.sndarray.make_sound(arr)
            self.sounds[drum_type] = sound
            
            logger.info(f"Generated synthetic drum sound: {drum_type}")
            
        except ImportError:
            logger.warning("NumPy not available, cannot generate synthetic drum sounds")
        except Exception as e:
            logger.error(f"Error generating drum sound {drum_type}: {e}")
    
    def get_available_gestures(self) -> list:
        """Return list of gestures this drum kit responds to"""
        return list(self.gesture_drum_mapping.keys())