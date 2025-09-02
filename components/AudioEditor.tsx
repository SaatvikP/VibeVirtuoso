"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Square, 
  Scissors, 
  Download, 
  Upload,
  Volume2,
  SkipBack,
  SkipForward,
  RotateCcw,
  Save,
  Edit
} from "lucide-react"

interface AudioEditorProps {
  selectedRecording?: string
  onExport?: (audioBuffer: ArrayBuffer, filename: string) => void
}

export default function AudioEditor({ selectedRecording, onExport }: AudioEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [volume, setVolume] = useState([0.8])
  const [selectedRegion, setSelectedRegion] = useState<{start: number, end: number} | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [recordings, setRecordings] = useState<any[]>([])
  const [loadedRecording, setLoadedRecording] = useState<string>("")
  const [layers, setLayers] = useState<{name: string, buffer: AudioBuffer, volume: number, muted: boolean}[]>([])
  const [overdubMode, setOverdubMode] = useState(false)

  // Fetch recordings on component mount
  useEffect(() => {
    fetchRecordings()
  }, [])

  // Load selected recording
  useEffect(() => {
    if (selectedRecording) {
      loadRecording(selectedRecording)
    }
  }, [selectedRecording])

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

  const loadRecording = async (filename: string, asLayer: boolean = false) => {
    try {
      const response = await fetch(`http://localhost:8000/recording/play/${filename}`)
      const arrayBuffer = await response.arrayBuffer()
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 44100, // Set consistent sample rate
        })
      }
      
      // Decode audio with better error handling
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        arrayBuffer,
        undefined,
        (error) => {
          console.error("Audio decode error:", error)
          throw new Error("Failed to decode audio data")
        }
      )
      
      if (asLayer) {
        // Add as a new layer
        setLayers(prev => [...prev, {
          name: filename,
          buffer: audioBuffer,
          volume: 0.8,
          muted: false
        }])
      } else {
        // Replace main audio
        setAudioBuffer(audioBuffer)
        setDuration(audioBuffer.duration)
        setLoadedRecording(filename)
        drawWaveform(audioBuffer)
      }
      
    } catch (err) {
      console.error("Error loading recording:", err)
      alert("Failed to load recording: " + (err as Error).message)
    }
  }

  const addLayer = (filename: string) => {
    loadRecording(filename, true)
  }

  const removeLayer = (index: number) => {
    setLayers(prev => prev.filter((_, i) => i !== index))
  }

  const toggleLayerMute = (index: number) => {
    setLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, muted: !layer.muted } : layer
    ))
  }

  const setLayerVolume = (index: number, volume: number) => {
    setLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, volume } : layer
    ))
  }

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width = canvas.offsetWidth * 2 // High DPI
    const height = canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    // Clear canvas
    ctx.clearRect(0, 0, width / 2, height / 2)

    // Draw waveform
    const channelData = buffer.getChannelData(0)
    const samplesPerPixel = Math.floor(channelData.length / (width / 2))
    
    ctx.beginPath()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 1

    for (let i = 0; i < width / 2; i++) {
      const start = i * samplesPerPixel
      const end = start + samplesPerPixel
      let max = 0
      
      for (let j = start; j < end && j < channelData.length; j++) {
        max = Math.max(max, Math.abs(channelData[j]))
      }
      
      const barHeight = max * (height / 4)
      const x = i
      const y = height / 4 - barHeight / 2
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.stroke()

    // Draw selected region
    if (selectedRegion) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
      const startX = (selectedRegion.start / duration) * (width / 2)
      const endX = (selectedRegion.end / duration) * (width / 2)
      ctx.fillRect(startX, 0, endX - startX, height / 2)
    }

    // Draw playback position
    if (currentTime > 0) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      const playheadX = (currentTime / duration) * (width / 2)
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height / 2)
      ctx.stroke()
    }
  }

  const [layerSources, setLayerSources] = useState<AudioBufferSourceNode[]>([])

  const playAudio = async () => {
    if (!audioBuffer || !audioContextRef.current) return

    // Resume audio context if suspended (fixes audio distortion)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    // Stop all current sources
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current.disconnect()
    }
    layerSources.forEach(source => {
      try {
        source.stop()
        source.disconnect()
      } catch (e) {
        // Source might already be stopped
      }
    })
    setLayerSources([])

    const startTime = selectedRegion ? selectedRegion.start : currentTime
    const duration = selectedRegion ? selectedRegion.end - selectedRegion.start : audioBuffer.duration - currentTime
    const actualDuration = Math.min(duration, audioBuffer.duration - startTime)
    
    if (actualDuration <= 0) {
      setIsPlaying(false)
      return
    }

    const allSources: AudioBufferSourceNode[] = []

    // Play main audio
    const mainSource = audioContextRef.current.createBufferSource()
    const mainGain = audioContextRef.current.createGain()
    
    mainSource.buffer = audioBuffer
    mainGain.gain.setValueAtTime(0.01, audioContextRef.current.currentTime)
    mainGain.gain.exponentialRampToValueAtTime(volume[0], audioContextRef.current.currentTime + 0.01)
    
    mainSource.connect(mainGain)
    mainGain.connect(audioContextRef.current.destination)
    
    mainSource.start(0, startTime, actualDuration)
    allSources.push(mainSource)
    
    sourceRef.current = mainSource
    gainNodeRef.current = mainGain

    // Play all layers
    layers.forEach((layer, index) => {
      if (!layer.muted && layer.buffer) {
        const layerSource = audioContextRef.current!.createBufferSource()
        const layerGain = audioContextRef.current!.createGain()
        
        layerSource.buffer = layer.buffer
        layerGain.gain.setValueAtTime(0.01, audioContextRef.current!.currentTime)
        layerGain.gain.exponentialRampToValueAtTime(layer.volume, audioContextRef.current!.currentTime + 0.01)
        
        layerSource.connect(layerGain)
        layerGain.connect(audioContextRef.current!.destination)
        
        const layerDuration = Math.min(actualDuration, layer.buffer.duration - startTime)
        if (layerDuration > 0) {
          layerSource.start(0, Math.min(startTime, layer.buffer.duration), layerDuration)
          allSources.push(layerSource)
        }
      }
    })

    setLayerSources(allSources)
    setIsPlaying(true)

    // Handle when main source ends
    mainSource.onended = () => {
      setIsPlaying(false)
      allSources.forEach(source => {
        try {
          source.disconnect()
        } catch (e) {
          // Already disconnected
        }
      })
      setLayerSources([])
    }

    // Update current time with more accurate timing
    const startTimestamp = audioContextRef.current.currentTime
    const updateTime = () => {
      if (isPlaying && audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimestamp
        const newTime = Math.min(startTime + elapsed, audioBuffer.duration)
        setCurrentTime(newTime)
        drawWaveform(audioBuffer)
        
        if (elapsed < actualDuration && newTime < audioBuffer.duration) {
          requestAnimationFrame(updateTime)
        }
      }
    }
    requestAnimationFrame(updateTime)
  }

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
        sourceRef.current.disconnect()
      } catch (e) {
        // Already stopped
      }
      sourceRef.current = null
    }
    
    layerSources.forEach(source => {
      try {
        source.stop()
        source.disconnect()
      } catch (e) {
        // Already stopped
      }
    })
    setLayerSources([])
    setIsPlaying(false)
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !audioBuffer) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const clickTime = (x / rect.width) * duration
    
    if (event.shiftKey && selectedRegion) {
      // Extend selection
      setSelectedRegion({
        start: Math.min(selectedRegion.start, clickTime),
        end: Math.max(selectedRegion.end, clickTime)
      })
    } else if (event.ctrlKey || event.metaKey) {
      // Start new selection
      setSelectedRegion({ start: clickTime, end: clickTime })
    } else {
      // Set playhead
      setCurrentTime(clickTime)
      setSelectedRegion(null)
    }
    
    drawWaveform(audioBuffer)
  }

  const trimAudio = async () => {
    if (!audioBuffer || !selectedRegion || !audioContextRef.current) {
      alert("Please select a region to trim")
      return
    }

    const { start, end } = selectedRegion
    const startSample = Math.floor(start * audioBuffer.sampleRate)
    const endSample = Math.floor(end * audioBuffer.sampleRate)
    const newLength = endSample - startSample

    const newBuffer = audioContextRef.current.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    )

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      const newChannelData = newBuffer.getChannelData(channel)
      
      for (let i = 0; i < newLength; i++) {
        newChannelData[i] = channelData[startSample + i]
      }
    }

    setAudioBuffer(newBuffer)
    setDuration(newBuffer.duration)
    setCurrentTime(0)
    setSelectedRegion(null)
    drawWaveform(newBuffer)
  }

  const exportAudio = async () => {
    if (!audioBuffer || !audioContextRef.current) {
      alert("No audio to export")
      return
    }

    try {
      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      )

      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineContext.destination)
      source.start()

      const renderedBuffer = await offlineContext.startRendering()
      
      // Convert to WAV
      const wavArrayBuffer = audioBufferToWav(renderedBuffer)
      
      // Create download
      const blob = new Blob([wavArrayBuffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edited_${loadedRecording || 'audio'}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (onExport) {
        onExport(wavArrayBuffer, `edited_${loadedRecording || 'audio'}.wav`)
      }
    } catch (err) {
      console.error("Error exporting audio:", err)
      alert("Failed to export audio")
    }
  }

  // Simple WAV encoder
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bytesPerSample = 2
    const blockAlign = numberOfChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = length * blockAlign
    const headerSize = 44
    const totalSize = headerSize + dataSize

    const arrayBuffer = new ArrayBuffer(totalSize)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, totalSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
        offset += 2
      }
    }

    return arrayBuffer
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 shadow-xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg text-white">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Audio Editor</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Professional audio editing and layering</p>
            </div>
          </div>
          <div className="flex gap-2">
            {loadedRecording && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                🎵 {loadedRecording}
              </Badge>
            )}
            {layers.length > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                📚 {layers.length} layers
              </Badge>
            )}
          </div>
        </div>

        {/* Recording Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Main Recording:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {recordings.map((recording, index) => (
              <div key={index} className="flex gap-1">
                <Button
                  variant={loadedRecording === recording.filename ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadRecording(recording.filename, false)}
                  className="text-left justify-start flex-1"
                >
                  <div className="truncate">
                    <div className="font-medium text-xs">{recording.filename}</div>
                    <div className="text-xs opacity-60">{(recording.size / 1024).toFixed(1)}KB</div>
                  </div>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addLayer(recording.filename)}
                  className="px-2"
                  title="Add as layer"
                >
                  +
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Layers */}
        {layers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white">
                <span className="text-xs">📚</span>
              </div>
              <h3 className="text-lg font-semibold">Audio Layers ({layers.length})</h3>
            </div>
            <div className="space-y-3">
              {layers.map((layer, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></span>
                      {layer.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>⏱️</span>
                      {layer.buffer.duration.toFixed(1)}s
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={layer.muted ? "outline" : "default"}
                      onClick={() => toggleLayerMute(index)}
                      className={`px-3 ${layer.muted ? 'hover:bg-red-50 hover:text-red-600' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {layer.muted ? "🔇" : "🔊"}
                    </Button>
                    
                    <div className="flex items-center gap-2 min-w-[100px] bg-white dark:bg-gray-700 rounded-full px-3 py-1">
                      <Volume2 className="h-3 w-3 text-gray-400" />
                      <Slider
                        value={[layer.volume]}
                        onValueChange={(value) => setLayerVolume(index, value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-16"
                      />
                      <span className="text-xs text-gray-500 min-w-[25px]">{Math.round(layer.volume * 100)}%</span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeLayer(index)}
                      className="px-2 hover:bg-red-600"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200/50">
              💡 <strong>Pro tip:</strong> All layers will play simultaneously with the main audio. Use volume sliders to balance your mix, and mute buttons to isolate tracks.
            </div>
          </div>
        )}

        {/* Waveform Display */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="w-full h-32 cursor-crosshair border rounded"
              onClick={handleCanvasClick}
            />
            <div className="text-xs text-gray-500 mt-2">
              Click to set playhead | Ctrl+Click to select region | Shift+Click to extend selection
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            {selectedRegion && (
              <span className="text-blue-600">
                Selection: {formatTime(selectedRegion.end - selectedRegion.start)}
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentTime(0)}
            size="sm"
            variant="outline"
            disabled={!audioBuffer}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={isPlaying ? stopAudio : playAudio}
            disabled={!audioBuffer}
            className="px-6"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={stopAudio}
            size="sm"
            variant="outline"
            disabled={!audioBuffer}
          >
            <Square className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setCurrentTime(duration)}
            size="sm"
            variant="outline"
            disabled={!audioBuffer}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-auto">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              min={0}
              step={0.1}
              className="w-20"
            />
          </div>
        </div>

        {/* Edit Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={trimAudio}
            variant="outline"
            disabled={!selectedRegion}
          >
            <Scissors className="h-4 w-4 mr-2" />
            Trim Selection
          </Button>

          <Button
            onClick={() => {
              setCurrentTime(0)
              setSelectedRegion(null)
              if (audioBuffer) drawWaveform(audioBuffer)
            }}
            variant="outline"
            disabled={!audioBuffer}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Button
            onClick={exportAudio}
            disabled={!audioBuffer}
            className="ml-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Audio
          </Button>
        </div>

        {/* Help */}
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Quick Guide:</h4>
          <ul className="space-y-1 text-blue-700 dark:text-blue-300">
            <li>• <strong>Click</strong> on waveform to set playback position</li>
            <li>• <strong>Ctrl+Click</strong> to start selecting a region</li>
            <li>• <strong>Shift+Click</strong> to extend selection</li>
            <li>• Use <strong>Trim Selection</strong> to cut audio to selected region</li>
            <li>• <strong>Export Audio</strong> to download your edited version</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}