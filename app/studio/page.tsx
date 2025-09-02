"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import WebcamGestureControl from "@/components/WebcamGestureControl"
import AudioEditor from "@/components/AudioEditor"
import { Music, ArrowLeft, Settings, Download, Play, Edit, Mic, AudioWaveformIcon as Waveform, Moon, Sun, LogOut, ChevronDown, User } from "lucide-react"
import { getAuthState, clearAuthState } from "@/lib/auth"

export default function StudioPage() {
  const router = useRouter()
  const [recordings, setRecordings] = useState([])
  const [currentGesture, setCurrentGesture] = useState("")
  const [currentInstrument, setCurrentInstrument] = useState("")
  const [selectedRecordingForEdit, setSelectedRecordingForEdit] = useState<string>("")
  const [activeTab, setActiveTab] = useState("record")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Mock user data
  const mockUser = {
    name: "Alex Johnson",
    email: "alex@example.com",
  }

  // Initialize dark mode and auth state
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)
    if (prefersDark && typeof document !== "undefined") {
      document.documentElement.classList.add("dark")
    }

    const authStatus = getAuthState()
    setIsAuthenticated(authStatus)
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark")
    }
  }

  // Handle logout
  const handleLogout = () => {
    clearAuthState()
    setIsAuthenticated(false)
    router.push("/")
  }

  const handleGestureDetected = (gesture: string, instrument: string) => {
    setCurrentGesture(gesture)
    setCurrentInstrument(instrument)
    
    // You could add more UI feedback here
    console.log(`Gesture detected: ${gesture} on ${instrument}`)
  }

  const loadRecordings = async () => {
    try {
      const response = await fetch('http://localhost:8000/recording/list')
      const data = await response.json()
      setRecordings(data.recordings || [])
    } catch (error) {
      console.error("Error loading recordings:", error)
    }
  }

  const playRecording = (filename: string) => {
    const audio = new Audio(`http://localhost:8000/recording/play/${filename}`)
    audio.play().catch(err => {
      console.error("Error playing recording:", err)
      alert("Failed to play recording. Make sure the backend is running.")
    })
  }

  const editRecording = (filename: string) => {
    setSelectedRecordingForEdit(filename)
    setActiveTab("edit")
  }

  const handleExport = (audioBuffer: ArrayBuffer, filename: string) => {
    console.log(`Exported: ${filename}`)
    // Could add more export handling here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-950/20 dark:to-indigo-950/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
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
            <Link href="/music" className="text-sm font-medium hover:text-purple-200 transition-colors">
              Explore
            </Link>
            <Link href="/studio" className="text-sm font-medium text-purple-200 border-b-2 border-purple-200">
              🎹 Studio
            </Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 hover:bg-white/10">
                    {mockUser.name}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{mockUser.name}</p>
                      <p className="text-xs text-muted-foreground">{mockUser.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/studio")}>🎹 Music Studio</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/studio")}>Create New Composition</DropdownMenuItem>
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
            {currentGesture && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-3 py-1">
                <span className="animate-pulse">🎵</span>
                {currentInstrument}: {currentGesture}
              </Badge>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm border border-violet-500/20 rounded-full">
            <div className="w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse"></div>
            <span className="text-violet-700 dark:text-violet-300 font-medium text-sm">AI-Powered Music Studio</span>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Experience the future of music creation through AI-powered gesture recognition and advanced audio editing tools.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Centered Tab Buttons */}
          <div className="flex justify-center items-center gap-8 mb-12">
            <button
              onClick={() => setActiveTab("record")}
              className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 ${
                activeTab === "record" 
                  ? "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white shadow-2xl shadow-purple-500/30 scale-105" 
                  : "bg-gradient-to-br from-white/90 via-purple-50/80 to-violet-100/70 dark:from-gray-800/90 dark:via-purple-950/30 dark:to-violet-950/20 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-700/30 shadow-xl hover:shadow-2xl"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${activeTab === "record" ? "bg-white/20" : "bg-gradient-to-br from-violet-500 to-purple-600"} shadow-lg`}>
                  <Mic className={`h-8 w-8 ${activeTab === "record" ? "text-white" : "text-white"}`} />
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold ${activeTab === "record" ? "text-white drop-shadow-lg" : "text-gray-800 dark:text-white"}`}>
                    Record & Play
                  </h3>
                  <p className={`text-sm ${activeTab === "record" ? "text-white drop-shadow-md" : "text-gray-600 dark:text-gray-300"}`}>
                    Gesture-based music creation
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("edit")}
              className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 transform hover:scale-105 hover:rotate-1 ${
                activeTab === "edit" 
                  ? "bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 text-white shadow-2xl shadow-blue-500/30 scale-105" 
                  : "bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-100/70 dark:from-gray-800/90 dark:via-blue-950/30 dark:to-indigo-950/20 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${activeTab === "edit" ? "bg-white/20" : "bg-gradient-to-br from-indigo-500 to-blue-600"} shadow-lg`}>
                  <Edit className={`h-8 w-8 ${activeTab === "edit" ? "text-white" : "text-white"}`} />
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold ${activeTab === "edit" ? "text-white drop-shadow-lg" : "text-gray-800 dark:text-white"}`}>
                    Audio Editor
                  </h3>
                  <p className={`text-sm ${activeTab === "edit" ? "text-white drop-shadow-md" : "text-gray-600 dark:text-gray-300"}`}>
                    Edit and enhance tracks
                  </p>
                </div>
              </div>
            </button>
          </div>

          <TabsContent value="record" className="space-y-8">
            {/* Main Gesture Control */}
            <WebcamGestureControl onGestureDetected={handleGestureDetected} />
          </TabsContent>

          <TabsContent value="edit" className="space-y-8">
            {/* Audio Editor */}
            <AudioEditor 
              selectedRecording={selectedRecordingForEdit}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>

        {/* Recordings Section */}
        <Card className="p-8 bg-gradient-to-br from-white/80 via-white/70 to-purple-50/50 dark:from-gray-800/80 dark:via-gray-800/70 dark:to-purple-950/50 backdrop-blur-xl border-2 border-white/30 dark:border-gray-700/30 shadow-2xl rounded-3xl mt-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl text-white shadow-lg shadow-purple-500/25">
                    <Play className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Your Recordings</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and play your musical creations</p>
                  </div>
                </div>
                <Button 
                  onClick={loadRecordings} 
                  className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-purple-500/25 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Refresh List
                  </div>
                </Button>
              </div>
              
              {recordings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-bounce">🎵</div>
                  <p className="text-gray-600 mb-4 text-lg font-semibold">No recordings yet</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Start playing and recording to see your musical sessions here. Use gesture controls or voice commands to create amazing music!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordings.map((recording, index) => (
                    <Card key={index} className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-200 border border-gray-200/50 hover:border-violet-300">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                          <span className="w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></span>
                          {recording.filename}
                        </h3>
                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                          {(recording.size / 1024 / 1024).toFixed(1)}MB
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <span>📅</span>
                        {new Date(recording.created).toLocaleString()}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                          onClick={() => playRecording(recording.filename)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          onClick={() => editRecording(recording.filename)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = `http://localhost:8000/recording/play/${recording.filename}`
                            link.download = recording.filename
                            link.click()
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
        </Card>
        
        {/* Help Section */}
        <Card className="p-8 bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-700/30 shadow-2xl rounded-3xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl text-white shadow-lg shadow-blue-500/25">
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-purple-800 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent">How to Play Music</h3>
              <p className="text-blue-700 dark:text-blue-300">Master the art of gesture-based music creation</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white/60 to-blue-50/60 dark:from-gray-800/60 dark:to-blue-950/60 p-6 rounded-2xl border border-blue-200/30 dark:border-blue-700/30 shadow-lg">
              <h4 className="font-bold mb-4 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span className="text-lg">⌨️</span>
                Keyboard Controls
              </h4>
              <ul className="space-y-3 text-blue-700 dark:text-blue-300">
                <li className="flex items-center gap-3">
                  <kbd className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-blue-800 dark:text-blue-300 shadow-sm">1</kbd> 
                  <span>Fist (Bass)</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-blue-800 dark:text-blue-300 shadow-sm">2</kbd> 
                  <span>Point (Mid)</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-blue-800 dark:text-blue-300 shadow-sm">3</kbd> 
                  <span>Peace (High)</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-blue-800 dark:text-blue-300 shadow-sm">4-6</kbd> 
                  <span>More gestures</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-white/60 to-indigo-50/60 dark:from-gray-800/60 dark:to-indigo-950/60 p-6 rounded-2xl border border-indigo-200/30 dark:border-indigo-700/30 shadow-lg">
              <h4 className="font-bold mb-4 text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <span className="text-lg">🖱️</span>
                Click to Play
              </h4>
              <ul className="space-y-3 text-indigo-700 dark:text-indigo-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Click anywhere on video!
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Left side → Bass notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Right side → High notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Different areas = different sounds
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-white/60 to-purple-50/60 dark:from-gray-800/60 dark:to-purple-950/60 p-6 rounded-2xl border border-purple-200/30 dark:border-purple-700/30 shadow-lg">
              <h4 className="font-bold mb-4 text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <span className="text-lg">🎵</span>
                Auto-Playing
              </h4>
              <ul className="space-y-3 text-purple-700 dark:text-purple-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  Random melodies every 3s
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  🎹 Switch instruments above
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  🎵 Piano • 🥁 Drums • 🎸 Guitar
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-600 dark:text-green-400 font-bold">🔊 Listen now!</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}