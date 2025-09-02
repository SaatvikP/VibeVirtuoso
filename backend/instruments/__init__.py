from .base_instrument import BaseInstrument
from .piano import Piano
from .drums import Drums

# Create simple instrument classes for missing ones
class Guitar(BaseInstrument):
    def __init__(self):
        super().__init__("guitar")
    
    def load_sounds(self):
        # Generate guitar-like sounds
        self.generate_tone("C4", 261.63, 0.8)
        self.generate_tone("D4", 293.66, 0.8)
        self.generate_tone("E4", 329.63, 0.8)
        self.generate_tone("F4", 349.23, 0.8)
        self.generate_tone("G4", 392.00, 0.8)
        self.generate_tone("A4", 440.00, 0.8)
    
    def setup_parameters(self):
        self.gesture_note_mapping = {
            "fist": "C4", "point": "D4", "peace": "E4", 
            "three": "F4", "four": "G4", "open_hand": "A4"
        }
    
    def play_gesture(self, gesture: str, intensity: float = 1.0, **kwargs) -> bool:
        if gesture in self.gesture_note_mapping:
            note = self.gesture_note_mapping[gesture]
            return self.play_sound(note, intensity * 0.8)
        return False
    
    def generate_tone(self, sound_name: str, frequency: float, duration: float = 0.8):
        try:
            import numpy as np
            sample_rate = 44100
            frames = int(duration * sample_rate)
            arr = np.zeros((frames, 2))
            
            for i in range(frames):
                time_point = i / sample_rate
                # Guitar-like wave with harmonics
                wave = np.sin(2 * np.pi * frequency * time_point) * 0.3
                wave += np.sin(2 * np.pi * frequency * 2 * time_point) * 0.15
                wave += np.sin(2 * np.pi * frequency * 3 * time_point) * 0.1
                
                # Guitar-like decay envelope
                envelope = np.exp(-time_point * 2)
                arr[i] = wave * envelope
            
            arr = (arr * 32767).astype(np.int16)
            import pygame
            sound = pygame.sndarray.make_sound(arr)
            self.sounds[sound_name] = sound
        except Exception as e:
            print(f"Error generating guitar tone: {e}")

class Flute(BaseInstrument):
    def __init__(self):
        super().__init__("flute")
    
    def load_sounds(self):
        self.generate_tone("C5", 523.25, 0.6)
        self.generate_tone("D5", 587.33, 0.6)
        self.generate_tone("E5", 659.25, 0.6)
        self.generate_tone("F5", 698.46, 0.6)
        self.generate_tone("G5", 783.99, 0.6)
        self.generate_tone("A5", 880.00, 0.6)
    
    def setup_parameters(self):
        self.gesture_note_mapping = {
            "fist": "C5", "point": "D5", "peace": "E5",
            "three": "F5", "four": "G5", "open_hand": "A5"
        }
    
    def play_gesture(self, gesture: str, intensity: float = 1.0, **kwargs) -> bool:
        if gesture in self.gesture_note_mapping:
            note = self.gesture_note_mapping[gesture]
            return self.play_sound(note, intensity * 0.6)
        return False
    
    def generate_tone(self, sound_name: str, frequency: float, duration: float = 0.6):
        try:
            import numpy as np
            sample_rate = 44100
            frames = int(duration * sample_rate)
            arr = np.zeros((frames, 2))
            
            for i in range(frames):
                time_point = i / sample_rate
                # Flute-like pure tone
                wave = np.sin(2 * np.pi * frequency * time_point) * 0.4
                wave += np.sin(2 * np.pi * frequency * 2 * time_point) * 0.1
                
                # Smooth envelope
                attack = min(1.0, time_point * 10)
                release = min(1.0, (duration - time_point) * 5)
                envelope = attack * release
                arr[i] = wave * envelope
            
            arr = (arr * 32767).astype(np.int16)
            import pygame
            sound = pygame.sndarray.make_sound(arr)
            self.sounds[sound_name] = sound
        except Exception as e:
            print(f"Error generating flute tone: {e}")

# Instrument registry
AVAILABLE_INSTRUMENTS = {
    "piano": Piano,
    "drums": Drums,
    "guitar": Guitar,
    "flute": Flute,
    "violin": Piano,  # Use piano as placeholder for violin
    "saxophone": Flute,  # Use flute as placeholder for saxophone
}

def get_instrument(name: str) -> BaseInstrument:
    """Get an instrument instance by name"""
    if name in AVAILABLE_INSTRUMENTS:
        return AVAILABLE_INSTRUMENTS[name]()
    else:
        # Default to piano if instrument not found
        print(f"Unknown instrument: {name}, defaulting to piano")
        return Piano()

def list_instruments():
    """List all available instruments"""
    return list(AVAILABLE_INSTRUMENTS.keys())