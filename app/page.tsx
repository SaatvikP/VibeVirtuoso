"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { startInstrument } from "@/lib/startInstrument";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AudioWaveformIcon as Waveform, Moon, Sun, Music, Play, LogOut, ChevronDown, User } from "lucide-react"
import { getAuthState, clearAuthState } from "@/lib/auth"

export default function LandingPage() {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Mock user data
  const mockUser = {
    name: "Alex Johnson",
    email: "alex@example.com",
  }

  // Initialize dark mode based on user preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)

    if (prefersDark && typeof document !== "undefined") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Check authentication status but don't redirect
  useEffect(() => {
    // Check auth status directly without setTimeout
    const authStatus = getAuthState()
    setIsAuthenticated(authStatus)
    setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse flex flex-col items-center">
          <Waveform className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
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
            <Link href="/" className="text-sm font-medium text-purple-200 border-b-2 border-purple-200">
              Home
            </Link>
            <Link href="/music" className="text-sm font-medium hover:text-purple-200 transition-colors">
              Explore
            </Link>
            <Link href="/studio" className="text-sm font-medium hover:text-purple-200 transition-colors">
              🎹 Studio
            </Link>
            {isAuthenticated ? (
              <>
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
              </>
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

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
                <span className="font-medium">Music Creation Platform</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                VibeVirtuoso: Interactive Music Creation
                </h1>
                <p className="mx-auto max-w-[700px] text-xl md:text-2xl text-white/80">
                  {isAuthenticated
                    ? "Continue your musical journey with our intuitive tools and real-time visualization."
                    : "Create, visualize, and share music through an intuitive interface with real-time audio visualization."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-purple-700 hover:bg-purple-100 px-8 text-lg font-bold"
                  onClick={() => router.push(isAuthenticated ? "/studio" : "/signin")}
                >
                  {isAuthenticated ? "🎹 Go to Studio" : "Start Making Music"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900 transition-colors duration-300">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-purple-800 dark:text-purple-400">
                Create Music Like Never Before
              </h2>
              <p className="mt-4 mx-auto max-w-[700px] text-gray-700 dark:text-gray-300">
                Our intuitive interface makes music creation accessible to everyone
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                  <Waveform className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visualize</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  See your music come to life with dynamic waveform displays
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Intuitive tools for composing and mixing multi-track audio
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Export your creations or share them directly with others
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {isAuthenticated ? "Ready to Continue Your Music?" : "Ready to Make Some Music?"}
              </h2>
              <p className="mx-auto max-w-[700px] text-xl text-white/80">
                {isAuthenticated
                  ? "Jump back into the studio or start something new with gesture-controlled music creation."
                  : "Jump right in and start creating your own musical masterpieces with VibeVirtuoso."}
              </p>
              <div>
                <Button
                  size="lg"
                  className="bg-white text-purple-700 hover:bg-purple-100 px-8 text-lg font-bold"
                  onClick={() => router.push(isAuthenticated ? "/studio" : "/signin")}
                >
                  {isAuthenticated ? "🎹 Go to Studio" : "Sign In to Get Started"}
                </Button>
              </div>
              <p className="text-sm text-white/70">No musical experience required. Just bring your creativity!</p>
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
              <span className="font-bold">VibeVirtuoso</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <Link href="/" className="text-sm hover:text-white">
                Home
              </Link>
              <Link href="/music" className="text-sm hover:text-white">
                Explore
              </Link>
              <Link href="/studio" className="text-sm hover:text-white">
                🎹 Studio
              </Link>
              {!isAuthenticated && (
                <Link href="/signin" className="text-sm hover:text-white">
                  Sign In
                </Link>
              )}
              <Link href="#" className="text-sm hover:text-white">
                Contact
              </Link>
              <Link href="#" className="text-sm hover:text-white">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500"> VibeVirtuoso. All rights reserved.</p>
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
    </div>
  )
}

