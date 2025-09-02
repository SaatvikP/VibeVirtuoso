from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import pygame
import os
import logging

logger = logging.getLogger(__name__)

class BaseInstrument(ABC):
    """Base class for all virtual instruments"""
    
    def __init__(self, name: str, sound_dir: str = None):
        self.name = name
        self.sound_dir = sound_dir or f"sounds/{name}"
        self.sounds = {}
        self.is_initialized = False
        
        # Initialize pygame mixer if not already done
        if not pygame.mixer.get_init():
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
        
        self.initialize()
    
    def initialize(self):
        """Initialize the instrument - load sounds, set up parameters"""
        try:
            self.load_sounds()
            self.setup_parameters()
            self.is_initialized = True
            logger.info(f"Initialized {self.name} instrument")
        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            self.is_initialized = False
    
    @abstractmethod
    def load_sounds(self):
        """Load sound samples for this instrument"""
        pass
    
    @abstractmethod  
    def setup_parameters(self):
        """Set up instrument-specific parameters"""
        pass
    
    @abstractmethod
    def play_gesture(self, gesture: str, intensity: float = 1.0, **kwargs) -> bool:
        """Play sound based on gesture input"""
        pass
    
    def load_sound_file(self, sound_name: str, filename: str) -> bool:
        """Helper method to load a sound file"""
        try:
            filepath = os.path.join(self.sound_dir, filename)
            if os.path.exists(filepath):
                sound = pygame.mixer.Sound(filepath)
                self.sounds[sound_name] = sound
                return True
            else:
                logger.warning(f"Sound file not found: {filepath}")
                return False
        except Exception as e:
            logger.error(f"Error loading sound {filename}: {e}")
            return False
    
    def play_sound(self, sound_name: str, volume: float = 1.0) -> bool:
        """Play a loaded sound by name"""
        try:
            if sound_name in self.sounds:
                sound = self.sounds[sound_name]
                sound.set_volume(min(max(volume, 0.0), 1.0))  # Clamp volume 0-1
                sound.play()
                return True
            else:
                logger.warning(f"Sound not found: {sound_name}")
                return False
        except Exception as e:
            logger.error(f"Error playing sound {sound_name}: {e}")
            return False
    
    def stop_all_sounds(self):
        """Stop all currently playing sounds"""
        try:
            pygame.mixer.stop()
        except Exception as e:
            logger.error(f"Error stopping sounds: {e}")
    
    def get_available_gestures(self) -> List[str]:
        """Return list of gestures this instrument responds to"""
        return ["fist", "point", "peace", "three", "four", "open_hand"]
    
    def get_info(self) -> Dict[str, Any]:
        """Return instrument information"""
        return {
            "name": self.name,
            "initialized": self.is_initialized,
            "sounds_loaded": len(self.sounds),
            "available_gestures": self.get_available_gestures()
        }