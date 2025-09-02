from .base_instrument import BaseInstrument
import pygame
import logging

logger = logging.getLogger(__name__)

class Piano(BaseInstrument):
    """Virtual Piano Instrument"""
    
    def __init__(self):
        super().__init__("piano", "sounds/piano")
        
    def load_sounds(self):
        """Load piano sound samples"""
        # Try to load piano samples, fall back to generated tones
        notes = ["C", "D", "E", "F", "G", "A", "B"]
        octaves = [4, 5, 6]
        
        for octave in octaves:
            for note in notes:
                sound_name = f"{note}{octave}"
                filename = f"{sound_name}.wav"
                
                # Try to load file, if not found, generate tone
                if not self.load_sound_file(sound_name, filename):
                    self.generate_tone(sound_name, self.note_to_frequency(note, octave))
    
    def setup_parameters(self):
        """Set up piano-specific parameters"""
        self.gesture_note_mapping = {
            "fist": "C4",
            "point": "D4", 
            "peace": "E4",
            "three": "F4",
            "four": "G4",
            "open_hand": "A4"
        }
        
        self.volume_mapping = {
            "fist": 0.8,
            "point": 0.6,
            "peace": 0.7, 
            "three": 0.8,
            "four": 0.9,
            "open_hand": 1.0
        }
    
    def play_gesture(self, gesture: str, intensity: float = 1.0, **kwargs) -> bool:
        """Play piano note based on gesture"""
        try:
            if gesture in self.gesture_note_mapping:
                note = self.gesture_note_mapping[gesture]
                volume = self.volume_mapping.get(gesture, 0.7) * intensity
                
                logger.info(f"Playing piano note {note} for gesture {gesture}")
                return self.play_sound(note, volume)
            else:
                logger.warning(f"Unknown gesture for piano: {gesture}")
                return False
                
        except Exception as e:
            logger.error(f"Error playing piano gesture {gesture}: {e}")
            return False
    
    def note_to_frequency(self, note: str, octave: int) -> float:
        """Convert note name to frequency"""
        note_frequencies = {
            "C": 261.63, "D": 293.66, "E": 329.63, "F": 349.23,
            "G": 392.00, "A": 440.00, "B": 493.88
        }
        
        base_freq = note_frequencies.get(note, 440.0)
        # Adjust for octave (each octave doubles/halves frequency)
        return base_freq * (2 ** (octave - 4))
    
    def generate_tone(self, sound_name: str, frequency: float, duration: float = 0.5):
        """Generate a synthetic tone for missing sound files"""
        try:
            import numpy as np
            
            # Generate sine wave
            sample_rate = 44100
            frames = int(duration * sample_rate)
            arr = np.zeros((frames, 2))
            
            for i in range(frames):
                time_point = i / sample_rate
                # Add some harmonics for richer sound
                wave = np.sin(2 * np.pi * frequency * time_point) * 0.3
                wave += np.sin(2 * np.pi * frequency * 2 * time_point) * 0.1  # Octave
                wave += np.sin(2 * np.pi * frequency * 3 * time_point) * 0.05  # Fifth
                
                # Apply envelope (attack, decay, sustain, release)
                envelope = 1.0
                if i < sample_rate * 0.01:  # Attack
                    envelope = i / (sample_rate * 0.01)
                elif i > frames - sample_rate * 0.1:  # Release
                    envelope = (frames - i) / (sample_rate * 0.1)
                
                arr[i] = wave * envelope
            
            # Convert to pygame sound
            arr = (arr * 32767).astype(np.int16)
            sound = pygame.sndarray.make_sound(arr)
            self.sounds[sound_name] = sound
            
            logger.info(f"Generated synthetic tone for {sound_name} at {frequency:.2f}Hz")
            
        except ImportError:
            logger.warning("NumPy not available, cannot generate synthetic tones")
        except Exception as e:
            logger.error(f"Error generating tone for {sound_name}: {e}")
    
    def get_available_gestures(self) -> list:
        """Return list of gestures this piano responds to"""
        return list(self.gesture_note_mapping.keys())