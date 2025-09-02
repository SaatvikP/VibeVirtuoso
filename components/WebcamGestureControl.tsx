"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import InstrumentTraining from "@/components/InstrumentTraining"

interface WebcamGestureControlProps {
  onGestureDetected?: (gesture: string, instrument: string) => void
}

export default function WebcamGestureControl({ onGestureDetected }: WebcamGestureControlProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  const [isActive, setIsActive] = useState(false)
  const [currentInstrument, setCurrentInstrument] = useState("piano")
  const [isRecording, setIsRecording] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [recordings, setRecordings] = useState<any[]>([])
  const [showRecordings, setShowRecordings] = useState(false)
  const [showTraining, setShowTraining] = useState(false)
  const lastGestureRef = useRef<{gesture: string, instrument: string, timestamp: number} | null>(null)
  const lastDrawnLandmarksRef = useRef<any[] | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const instruments = [
    { id: "piano", name: "Piano", emoji: "🎹" },
    { id: "drums", name: "Drums", emoji: "🥁" },
    { id: "guitar", name: "Guitar", emoji: "🎸" },
    { id: "flute", name: "Flute", emoji: "🎵" },
    { id: "violin", name: "Violin", emoji: "🎻" },
    { id: "saxophone", name: "Saxophone", emoji: "🎷" }
  ]

  // Launch native gesture detection
  const startWebcam = async () => {
    try {
      console.log("🎥 Starting gesture detection...")
      
      const response = await fetch('http://localhost:8000/start-webcam')
      const result = await response.json()
      
      if (result.status === "started") {
        setIsActive(true)
        setConnectionStatus("connected")
        console.log("✅ Gesture detection launched!")
        
        // Show success message
        alert("Gesture detection launched! Look for the 'Gesture Controller' window on your desktop.")
        
      } else {
        console.log("ℹ️ Webcam already running")
        setIsActive(true)
        setConnectionStatus("connected")
      }
      
    } catch (err) {
      console.error("❌ Error starting gesture detection:", err)
      alert("Failed to start webcam. Make sure the backend is running.")
    }
  }

  // Stop gesture detection
  const stopWebcam = async () => {
    try {
      const response = await fetch('http://localhost:8000/stop-webcam')
      const result = await response.json()
      console.log("🛑 Gesture detection stopped:", result.message)
    } catch (err) {
      console.error("Error stopping webcam:", err)
    }
    
    setIsActive(false)
    setConnectionStatus("disconnected")
  }

  // WebSocket connection for real-time communication  
  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/gesture')
      
      wsRef.current.onopen = () => {
        setConnectionStatus("connected")
        console.log("WebSocket connected")
      }
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "gesture_detected") {
          // Simple frontend debouncing like the gesture detection system
          const now = Date.now()
          const current = {gesture: data.gesture, instrument: data.instrument, timestamp: now}
          const last = lastGestureRef.current
          
          // Only trigger if gesture changed OR 800ms have passed since last same gesture
          let shouldTrigger = false
          if (!last) {
            shouldTrigger = true  // First gesture
          } else if (current.gesture !== last.gesture || current.instrument !== last.instrument) {
            shouldTrigger = true  // Different gesture or instrument
          } else if (now - last.timestamp > 800) {
            shouldTrigger = true  // Same gesture but enough time passed
          }
          
          // Always draw hand skeleton first (for smooth visual feedback)
          if (data.landmarks && data.landmarks.length > 0) {
            drawHandSkeletonSmooth(data.landmarks, data.image_width, data.image_height)
          }
          
          // Then handle sound triggering
          if (shouldTrigger) {
            lastGestureRef.current = current
            console.log(`🖐️ Triggering: ${data.gesture} on ${data.instrument}`)
            
            onGestureDetected?.(data.gesture, data.instrument)
            
            // Trigger sound via existing API with the correct instrument from WebSocket
            fetch('http://localhost:8000/play', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gesture: data.gesture,
                instrument: data.instrument  // Use instrument from WebSocket response
              })
            }).catch(err => console.error("Error playing sound:", err))
          }
        }
      }
      
      wsRef.current.onclose = () => {
        setConnectionStatus("disconnected")
        console.log("WebSocket disconnected")
      }
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        setConnectionStatus("error")
      }
    } catch (err) {
      console.error("WebSocket connection error:", err)
      setConnectionStatus("error")
    }
  }

  // Send video frames for gesture detection
  const startGestureDetection = () => {
    const sendFrame = () => {
      if (!videoRef.current || !canvasRef.current || !wsRef.current) return
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx && wsRef.current.readyState === WebSocket.OPEN) {
        // Draw video frame to canvas
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0)
        
        // Convert to base64 and send
        const imageData = canvas.toDataURL('image/jpeg', 0.5)
        wsRef.current.send(JSON.stringify({
          type: "video_frame",
          image: imageData,
          instrument: currentInstrument,
          timestamp: Date.now()
        }))
      }
    }

    // Send frames at 8 FPS for better stability and performance
    const intervalId = setInterval(sendFrame, 125)
    
    return () => clearInterval(intervalId)
  }

  // Draw hand skeleton on canvas (anti-flicker version)
  const drawHandSkeletonSmooth = (landmarksArray: any[], imageWidth: number, imageHeight: number) => {
    // Store landmarks for smooth drawing
    lastDrawnLandmarksRef.current = landmarksArray
    
    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Use requestAnimationFrame for smooth rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      drawHandSkeletonActual(landmarksArray, imageWidth, imageHeight)
    })
  }

  const drawHandSkeletonActual = (landmarksArray: any[], imageWidth: number, imageHeight: number) => {
    if (!canvasRef.current || !videoRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to match video (only if needed to prevent constant resizing)
    const videoWidth = videoRef.current.videoWidth || imageWidth || 640
    const videoHeight = videoRef.current.videoHeight || imageHeight || 480
    
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth
      canvas.height = videoHeight
    }
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Hand connection indices (MediaPipe hand model)
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],        // Index finger
      [5, 9], [9, 10], [10, 11], [11, 12],   // Middle finger  
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring finger
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17]                                  // Palm
    ]
    
    // Draw each hand with better visibility
    landmarksArray.forEach((landmarks, handIndex) => {
      // Determine hand position for color coding
      const wrist = landmarks[0]
      const isRightHand = wrist && wrist.x > 0.5  // Right side of screen = right hand
      
      // Color coding: Green for right hand, Purple for left hand
      const connectionColor = isRightHand ? '#00ff00' : '#8000ff'
      const landmarkColor = isRightHand ? '#00dd00' : '#6000dd'
      
      // Draw connections with thicker lines for better visibility
      ctx.strokeStyle = connectionColor
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start]
        const endPoint = landmarks[end]
        
        if (startPoint && endPoint) {
          ctx.beginPath()
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height)
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height)
          ctx.stroke()
        }
      })
      
      // Draw landmarks as larger, more visible circles
      ctx.fillStyle = landmarkColor
      landmarks.forEach((landmark: any, idx: number) => {
        if (landmark) {
          ctx.beginPath()
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            idx === 0 ? 8 : 4,  // Larger circles for better visibility
            0,
            2 * Math.PI
          )
          ctx.fill()
          
          // Add white border for contrast
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
      
      // Draw hand label
      if (wrist) {
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Arial'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 3
        const label = isRightHand ? 'R' : 'L'
        const x = wrist.x * canvas.width + 20
        const y = wrist.y * canvas.height - 20
        
        // White text with black outline
        ctx.strokeText(label, x, y)
        ctx.fillText(label, x, y)
      }
    })
  }

  // Handle instrument change
  const handleInstrumentChange = async (instrumentId: string) => {
    try {
      console.log(`🎵 Switching to ${instrumentId}...`)
      
      const response = await fetch(`http://localhost:8000/launch-instrument/${instrumentId}`)
      const result = await response.json()
      
      if (result.status === "started") {
        setCurrentInstrument(instrumentId)
        console.log(`✅ ${instrumentId} launched!`)
        
        // Show brief notification
        console.log(`✅ ${result.instrument} auto-started!`)
        // Optional: Remove alert for smoother UX, or make it less intrusive
        // alert(`${result.instrument} launched! The gesture window should now respond to ${result.instrument} gestures.`)
      } else {
        console.error("Failed to launch instrument:", result.message)
        alert(`Failed to launch ${instrumentId}: ${result.message}`)
      }
    } catch (err) {
      console.error("Error switching instrument:", err)
      alert("Failed to switch instrument. Make sure the backend is running.")
    }
  }

  // Recording functions
  const startRecording = async () => {
    try {
      const response = await fetch('http://localhost:8000/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument: currentInstrument })
      })
      
      if (response.ok) {
        setIsRecording(true)
      }
    } catch (err) {
      console.error("Error starting recording:", err)
    }
  }

  const stopRecording = async () => {
    try {
      const response = await fetch('http://localhost:8000/recording/stop', {
        method: 'POST'
      })
      
      if (response.ok) {
        setIsRecording(false)
        const data = await response.json()
        alert(`Recording saved: ${data.filename}`)
        fetchRecordings() // Refresh the recordings list
      }
    } catch (err) {
      console.error("Error stopping recording:", err)
    }
  }

  // Fetch recordings list
  const fetchRecordings = async () => {
    try {
      const response = await fetch('http://localhost:8000/recording/list')
      if (response.ok) {
        const data = await response.json()
        setRecordings(data.recordings || [])
      }
    } catch (err) {
      console.error("Error fetching recordings:", err)
    }
  }

  // Play recording
  const playRecording = (filename: string) => {
    const audio = new Audio(`http://localhost:8000/recording/play/${filename}`)
    audio.play().catch(err => {
      console.error("Error playing recording:", err)
      alert("Failed to play recording. Make sure the backend is running.")
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      stopWebcam()
    }
  }, [])

  // Show training mode if active
  if (showTraining) {
    return (
      <InstrumentTraining 
        instrument={currentInstrument} 
        onClose={() => setShowTraining(false)} 
      />
    )
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Gesture Control Studio</h2>
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : 
              connectionStatus === "error" ? "bg-red-500" : "bg-gray-400"
            }`}></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === "connected" ? "Connected" : 
               connectionStatus === "error" ? "Connection Error" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Gesture Detection Status Display */}
        <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden min-h-[400px]">
          {/* Show start screen when not active */}
          {!isActive && (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg">Launch Gesture Detection</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  This will open the gesture detection window
                </p>
                <Button onClick={startWebcam} size="lg" className="bg-purple-600 hover:bg-purple-700">
                  🚀 Launch Webcam
                </Button>
              </div>
            </div>
          )}
          
          {/* Show status when active */}
          {isActive && (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Gesture Detection Active!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Look for the <strong>"Gesture Controller"</strong> window on your desktop.<br/>
                  <span className="text-sm">The detection window will automatically use your selected instrument!</span>
                </p>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-2 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                      {instruments.find(i => i.id === currentInstrument)?.emoji} {instruments.find(i => i.id === currentInstrument)?.name}
                    </span>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900 px-3 py-2 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 dark:text-red-300 text-sm font-medium">Recording</span>
                    </div>
                  )}
                </div>
                <Button onClick={stopWebcam} variant="outline">
                  Stop Webcam
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {isActive && (
          <div className="space-y-4">
            {/* Instrument Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Select Instrument:</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {instruments.map((instrument) => (
                  <Button
                    key={instrument.id}
                    onClick={() => handleInstrumentChange(instrument.id)}
                    variant={currentInstrument === instrument.id ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <span className="text-2xl">{instrument.emoji}</span>
                    <span className="text-xs">{instrument.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
                
                <Button 
                  onClick={() => setShowTraining(true)}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  🎓 Training Mode
                </Button>
                
                <Button 
                  onClick={() => {
                    setShowRecordings(!showRecordings)
                    if (!showRecordings) fetchRecordings()
                  }}
                  variant="outline"
                >
                  {showRecordings ? "Hide Recordings" : "View Recordings"}
                </Button>
                
                <Button onClick={stopWebcam} variant="outline">
                  Stop Webcam
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                Move your hands to play {instruments.find(i => i.id === currentInstrument)?.name}
              </div>
            </div>

            {/* Recordings List */}
            {showRecordings && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Recordings ({recordings.length})</h4>
                {recordings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recordings yet. Start recording to create some!</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recordings.map((recording, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded border">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{recording.filename}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(recording.created).toLocaleDateString()} - {(recording.size / 1024).toFixed(1)}KB
                          </div>
                        </div>
                        <Button
                          onClick={() => playRecording(recording.filename)}
                          size="sm"
                          className="ml-3"
                        >
                          ▶️ Play
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">How to Use:</h3>
          <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-200">
            <li>• Click "🚀 Launch Webcam" to open the gesture detection window</li>
            <li>• Select an instrument to switch gesture recognition</li>
            <li>• Use hand gestures in the detection window:</li>
            <li className="ml-4">→ <strong>Green hand (right)</strong>: Piano notes/melodies</li>
            <li className="ml-4">→ <strong>Purple hand (left)</strong>: Chords/harmony</li>
            <li>• Different finger counts = different notes</li>
            <li>• Say instrument names for voice control</li>
            <li>• Press 'Q' or ESC in detection window to close</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}