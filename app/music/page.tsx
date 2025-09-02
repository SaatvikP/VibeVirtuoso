"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  AudioWaveformIcon as Waveform,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Home,
  LogIn,
} from "lucide-react"
import { getAuthState, clearAuthState } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, User, LogOut } from "lucide-react"

export default function MusicPage() {
  const router = useRouter()
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Initialize dark mode based on user preference
  useEffect(() => {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)

    // Apply dark mode class if needed
    if (prefersDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = () => {
    clearAuthState()
    router.push("/")
  }

  // Sample tracks data
  const tracks = [
    { id: 1, title: "Electronic Fusion", artist: "DJ Codewave", duration: "3:45", genre: "Electronic" },
    { id: 2, title: "Neural Beats", artist: "AI Composer", duration: "2:58", genre: "Experimental" },
    { id: 3, title: "Hackathon Groove", artist: "The Developers", duration: "4:12", genre: "Tech House" },
    { id: 4, title: "Algorithm Rhythm", artist: "Binary Beats", duration: "3:21", genre: "EDM" },
    { id: 5, title: "Code Symphony", artist: "Syntax Error", duration: "5:07", genre: "Ambient" },
  ]

  // Animation for waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    const drawSmoothWaves = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
      gradient.addColorStop(0, "#f472b6") // pink-400
      gradient.addColorStop(0.5, "#a855f7") // purple-500
      gradient.addColorStop(1, "#6366f1") // indigo-500

      const centerY = rect.height / 2

      // Draw the center line
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(rect.width, centerY)
      ctx.strokeStyle = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
      ctx.stroke()

      // Parameters for wave complexity
      const frequency1 = 0.02
      const frequency2 = 0.01
      const frequency3 = 0.005

      const amplitude1 = rect.height * 0.15
      const amplitude2 = rect.height * 0.1
      const amplitude3 = rect.height * 0.05

      // Add more complexity when playing
      const playingMultiplier = isPlaying ? 1.5 : 1

      // Use requestAnimationFrame timestamp for smoother animation
      const now = Date.now() / 1000
      const animationSpeed = isPlaying ? 2.0 : 0.5
      const animationPhase = now * animationSpeed

      // Draw the primary smooth wave (top)
      ctx.beginPath()
      ctx.moveTo(0, centerY)

      for (let x = 0; x <= rect.width; x += 1) {
        // Combine multiple sine waves for a more interesting but still smooth pattern
        // Use animationPhase for smoother animation
        const y1 = Math.sin(x * frequency1 + animationPhase) * amplitude1 * playingMultiplier
        const y2 = Math.sin(x * frequency2 + animationPhase * 0.7) * amplitude2 * playingMultiplier
        const y3 = Math.sin(x * frequency3 + animationPhase * 1.3) * amplitude3 * playingMultiplier

        const y = centerY - (y1 + y2 + y3) // Negative to go above center line

        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw the mirrored smooth wave (bottom)
      ctx.beginPath()
      ctx.moveTo(0, centerY)

      for (let x = 0; x <= rect.width; x += 1) {
        // Same waves but inverted to go below center line
        const y1 = Math.sin(x * frequency1 + animationPhase) * amplitude1 * playingMultiplier
        const y2 = Math.sin(x * frequency2 + animationPhase * 0.7) * amplitude2 * playingMultiplier
        const y3 = Math.sin(x * frequency3 + animationPhase * 1.3) * amplitude3 * playingMultiplier

        const y = centerY + (y1 + y2 + y3) // Positive to go below center line

        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = "rgba(164, 94, 229, 0.5)" // Semi-transparent purple
      ctx.lineWidth = 3
      ctx.stroke()

      // Continue the animation loop
      animationRef.current = requestAnimationFrame(drawSmoothWaves)
    }

    drawSmoothWaves()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, progress, isDarkMode])

  // Simulate progress when playing - using requestAnimationFrame for smoother updates
  useEffect(() => {
    let lastTime = 0
    let animationFrameId: number

    const updateProgress = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp

      // Calculate time elapsed since last frame
      const elapsed = timestamp - lastTime

      // Update progress based on elapsed time (smoother than fixed increments)
      if (isPlaying) {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next track when current one finishes
            if (currentTrack < tracks.length - 1) {
              setCurrentTrack(currentTrack + 1)
              return 0
            } else {
              setIsPlaying(false)
              return 0
            }
          }
          // Calculate smooth increment based on elapsed time
          // 3 minutes (180 seconds) should take 100% progress
          // So we increment by elapsed/1000 * (100/180) percent
          return prev + (elapsed / 1000) * (100 / 180)
        })
      }

      lastTime = timestamp
      animationFrameId = requestAnimationFrame(updateProgress)
    }

    if (isPlaying) {
      lastTime = 0
      animationFrameId = requestAnimationFrame(updateProgress)
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isPlaying, currentTrack, tracks.length])

  const togglePlay = () => setIsPlaying(!isPlaying)
  const toggleMute = () => setIsMuted(!isMuted)

  const playTrack = (index: number) => {
    setCurrentTrack(index)
    setProgress(0)
    setIsPlaying(true)
  }

  const nextTrack = () => {
    if (currentTrack < tracks.length - 1) {
      setCurrentTrack(currentTrack + 1)
      setProgress(0)
    }
  }

  const prevTrack = () => {
    if (currentTrack > 0) {
      setCurrentTrack(currentTrack - 1)
      setProgress(0)
    } else {
      setProgress(0)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Navigation Ribbon */}
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Waveform className="h-6 w-6" />
            <span className="font-bold text-xl">VibeVirtuoso</span>
          </Link>
          <nav className="flex gap-8 items-center">
            <Link href="/" className="text-sm font-medium hover:text-purple-200 transition-colors">
              Home
            </Link>
            <Link href="/music" className="text-sm font-medium text-purple-200 border-b-2 border-purple-200">
              Explore
            </Link>
            <Link href="/studio" className="text-sm font-medium hover:text-purple-200 transition-colors">
              🎹 Studio
            </Link>
            {getAuthState() ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 hover:bg-white/10">
                    Alex Johnson
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">Alex Johnson</p>
                      <p className="text-xs text-muted-foreground">alex@example.com</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/studio")}>🎹 Music Studio</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/create")}>Create New Composition</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/signin" className="text-sm font-medium hover:text-purple-200 transition-colors">
                Sign In
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-white hover:bg-white/10 rounded-full h-8 w-8"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Music Player Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Featured Music</h1>
                <p className="max-w-[600px] md:text-xl">Listen to tracks and get inspired for your own creations.</p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-black/30 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                <CardContent className="p-6">
                  {/* Waveform Visualization */}
                  <div className="h-48 mb-4">
                    <canvas ref={canvasRef} className="w-full h-full rounded-md" />
                  </div>

                  {/* Track Info */}
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold">{tracks[currentTrack].title}</h2>
                    <p className="text-white/80">{tracks[currentTrack].artist}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm">{formatTime(progress)}</span>
                    <Slider
                      value={[progress]}
                      max={100}
                      step={0.1}
                      onValueChange={(value) => setProgress(value[0])}
                      className="flex-1"
                    />
                    <span className="text-sm">{tracks[currentTrack].duration}</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                      onClick={prevTrack}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white text-purple-700 hover:bg-white/90 rounded-full h-14 w-14 flex items-center justify-center"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                      onClick={nextTrack}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      step={1}
                      onValueChange={(value) => {
                        setVolume(value[0])
                        if (value[0] > 0 && isMuted) setIsMuted(false)
                      }}
                      className="w-32"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Link href="/">
                <Button className="bg-white text-purple-700 hover:bg-purple-100 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
              <Link href="/signin">
                <Button className="bg-white text-purple-700 hover:bg-purple-100 flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Playlist Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-purple-800 dark:text-purple-400">Playlist</h2>
                <p className="max-w-[600px] text-gray-700 dark:text-gray-300">Explore music created with SoundCraft</p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <Card
                    key={track.id}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      currentTrack === index ? "border-purple-500 dark:border-purple-400" : ""
                    }`}
                    onClick={() => playTrack(index)}
                  >
                    <CardContent className="p-4 flex items-center">
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white mr-4">
                        {currentTrack === index && isPlaying ? (
                          <div className="flex items-end justify-center h-4 space-x-0.5">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-white rounded-t-sm"
                                style={{
                                  height: `${6 + i * 2}px`,
                                  animation: `equalizer ${0.5 + i * 0.2}s ease-in-out infinite alternate`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-medium">{track.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{track.artist}</p>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">{track.genre}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{track.duration}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-gray-900 text-gray-300">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Waveform className="h-6 w-6" />
              <span className="font-bold">SoundCraft</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <Link href="/" className="text-sm hover:text-white">
                Home
              </Link>
              <Link href="/music" className="text-sm hover:text-white">
                Explore
              </Link>
              <Link href="/signin" className="text-sm hover:text-white">
                Sign In
              </Link>
              <Link href="#" className="text-sm hover:text-white">
                Contact
              </Link>
              <Link href="#" className="text-sm hover:text-white">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 SoundCraft. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-500 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes equalizer {
          0% { height: 3px; }
          100% { height: 12px; }
        }
        
        @keyframes formatTime {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Helper function to format time from percentage to MM:SS
function formatTime(percentage: number) {
  // Assuming a 3-minute track for simplicity
  const totalSeconds = 180 * (percentage / 100)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

