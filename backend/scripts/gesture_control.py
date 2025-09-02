import fluidsynth
import os

print("🎹 Initializing FluidSynth audio system...")

# Load SoundFont path
SF2_PATH = os.path.join("sounds", "FluidR3_GM.sf2")

# Global synth instances
piano_synth = None
strings_synth = None

def initialize_synths():
    """Initialize FluidSynth synthesizers"""
    global piano_synth, strings_synth
    
    try:
        # Piano synth
        piano_synth = fluidsynth.Synth()
        piano_synth.start(driver="coreaudio")
        
        if os.path.exists(SF2_PATH):
            piano_sf2 = piano_synth.sfload(SF2_PATH)
            piano_synth.program_select(0, piano_sf2, 0, 0)  # Acoustic Grand Piano
            print("✅ Piano synth initialized with soundfont")
        else:
            print(f"⚠️ Soundfont not found at {SF2_PATH}, using default")
        
        # Strings synth for chords
        strings_synth = fluidsynth.Synth()
        strings_synth.start(driver="coreaudio")
        
        if os.path.exists(SF2_PATH):
            strings_sf2 = strings_synth.sfload(SF2_PATH)
            strings_synth.program_select(1, strings_sf2, 0, 48)  # Strings
            print("✅ Strings synth initialized with soundfont")
        
        return True
    except Exception as e:
        print(f"❌ Failed to initialize FluidSynth: {e}")
        return False

# Initialize on module load
synths_initialized = initialize_synths()

# Piano melody mapping (right hand)
MELODY_MAP = {
    "fist": 60,      # C4
    "point": 62,     # D4
    "peace": 64,     # E4
    "three": 65,     # F4
    "four": 67,      # G4
    "open_hand": 69  # A4
}

# Chord mapping (left hand)
CHORD_MAP = {
    "point": [60, 64, 67],   # C Major
    "peace": [62, 65, 69],   # D Minor
    "three": [65, 69, 72],   # F Major
    "four": [67, 71, 74],    # G Major
    "open_hand": [69, 72, 76]  # A Minor
}

# Drums mapping
DRUM_MAP = {
    "fist": 36,      # Kick
    "point": 38,     # Snare
    "peace": 42,     # Hi-hat
    "three": 49,     # Crash
    "four": 47,      # Tom
    "open_hand": 51  # Ride
}

# Instrument programs for FluidSynth
INSTRUMENT_PROGRAMS = {
    "piano": 0,      # Acoustic Grand Piano
    "guitar": 24,    # Acoustic Guitar
    "flute": 73,     # Flute
    "violin": 40,    # Violin
    "saxophone": 64  # Soprano Sax
}

last_notes = {}  # Track last played notes per instrument

def handle_gesture(gesture: str, instrument: str, intensity: float = 1.0) -> str:
    """Handle gesture with ORIGINAL FluidSynth system"""
    
    if not synths_initialized:
        return "Synths not initialized"
    
    try:
        if instrument == "piano":
            return handle_piano_gesture(gesture, intensity)
        elif instrument == "drums":
            return handle_drums_gesture(gesture, intensity)
        else:
            return handle_melodic_gesture(gesture, instrument, intensity)
            
    except Exception as e:
        error_msg = f"Error playing {gesture} on {instrument}: {e}"
        print(error_msg)
        return error_msg

def handle_piano_gesture(gesture: str, intensity: float) -> str:
    """Handle piano with melody + chords like original"""
    global last_notes
    
    # Stop previous notes
    if "piano_melody" in last_notes:
        piano_synth.noteoff(0, last_notes["piano_melody"])
    if "piano_chord" in last_notes:
        for note in last_notes["piano_chord"]:
            strings_synth.noteoff(1, note)
    
    # Play melody note
    if gesture in MELODY_MAP:
        note = MELODY_MAP[gesture]
        velocity = int(120 * intensity)
        piano_synth.noteon(0, note, velocity)
        last_notes["piano_melody"] = note
        
        # Auto turn off melody note after short duration
        import threading
        def turn_off_melody():
            import time
            time.sleep(0.5)  # Shorter piano notes
            try:
                piano_synth.noteoff(0, note)
            except:
                pass  # Ignore if synth is already stopped
        
        threading.Thread(target=turn_off_melody, daemon=True).start()
        print(f"🎹 Piano note: {note}")
    
    # Play chord if applicable  
    if gesture in CHORD_MAP:
        chord = CHORD_MAP[gesture]
        velocity = int(90 * intensity)
        for note in chord:
            strings_synth.noteon(1, note, velocity)
        last_notes["piano_chord"] = chord
        
        # Auto turn off chord notes after longer duration
        import threading
        def turn_off_chord():
            import time
            time.sleep(1.5)  # Shorter chord duration
            try:
                for note in chord:
                    strings_synth.noteoff(1, note)
            except:
                pass  # Ignore if synth is already stopped
        
        threading.Thread(target=turn_off_chord, daemon=True).start()
        print(f"🎻 Piano chord: {chord}")
    
    return f"Played {gesture} on piano"

def handle_drums_gesture(gesture: str, intensity: float) -> str:
    """Handle drums with proper drum sounds"""
    if gesture in DRUM_MAP:
        drum_note = DRUM_MAP[gesture]
        velocity = int(127 * intensity)
        
        # Use piano synth for drums (channel 9 is drums in GM)
        piano_synth.program_select(9, 0, 128, 0)  # Drum kit
        piano_synth.noteon(9, drum_note, velocity)
        
        # Add a small delay then turn off for percussive effect
        import threading
        def turn_off_drum():
            import time
            time.sleep(0.1)
            piano_synth.noteoff(9, drum_note)
        
        threading.Thread(target=turn_off_drum, daemon=True).start()
        
        print(f"🥁 Drum: {drum_note}")
        return f"Played {gesture} on drums"
    
    return f"Unknown drum gesture: {gesture}"

def handle_melodic_gesture(gesture: str, instrument: str, intensity: float) -> str:
    """Handle other melodic instruments"""
    global last_notes
    
    # Use different channels for different instruments to avoid conflicts
    channel_map = {
        "guitar": 2,
        "flute": 3, 
        "violin": 4,
        "saxophone": 5
    }
    
    channel = channel_map.get(instrument, 2)
    
    # Stop previous note for this instrument
    if instrument in last_notes:
        piano_synth.noteoff(channel, last_notes[instrument])
    
    if gesture in MELODY_MAP:
        note = MELODY_MAP[gesture]
        velocity = int(120 * intensity)
        
        # Set instrument program on the correct channel
        if instrument in INSTRUMENT_PROGRAMS:
            program = INSTRUMENT_PROGRAMS[instrument]
            piano_synth.program_select(channel, 0, 0, program)
            print(f"🎼 Set {instrument} program {program} on channel {channel}")
        
        piano_synth.noteon(channel, note, velocity)
        last_notes[instrument] = note
        
        # Auto turn off note after short duration for cleaner playback
        import threading
        def turn_off_note():
            import time
            time.sleep(1.5)  # Let note play for 1.5 seconds
            piano_synth.noteoff(channel, note)
        
        threading.Thread(target=turn_off_note, daemon=True).start()
        
        print(f"🎵 {instrument}: note {note} on channel {channel}")
        return f"Played {gesture} on {instrument}"
    
    return f"Unknown gesture for {instrument}: {gesture}"
