export const startInstrument = async () => {
    try {
      const res = await fetch("http://localhost:8000/start-webcam");
      const result = await res.json();
      
      if (result.status === "started") {
        console.log("✅ Webcam started successfully!");
        console.log("🎥 Look for the 'Gesture Controller' window on your desktop");
        console.log("🎹 Use keyboard numbers to select instruments: 1=Flute, 2=Drums, 3=Guitar, 4=Piano, 5=Sax, 6=Violin");
        console.log("🔊 You can also use voice commands to switch instruments");
        console.log("❌ Press 'Q' or ESC to stop the webcam");
      }
      
      return result;
    } catch (error) {
      console.error("Error starting instrument:", error);
      throw error;
    }
  };