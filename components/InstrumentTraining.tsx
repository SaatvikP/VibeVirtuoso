"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Hand, 
  Music,
  CheckCircle,
  ArrowRight
} from "lucide-react"

interface TrainingStep {
  title: string
  instruction: string
  gesture: string
  notes: string
  tip?: string
}

interface InstrumentTrainingProps {
  instrument: string
  onClose: () => void
}

const trainingData: Record<string, TrainingStep[]> = {
  piano: [
    {
      title: "Basic Right Hand Notes",
      instruction: "Use your right hand to play melody notes",
      gesture: "0 fingers = C4, 1 finger = D4, 2 fingers = E4",
      notes: "Try playing: 0 → 1 → 2 (C-D-E)",
      tip: "Keep your hand relaxed and fingers spread naturally"
    },
    {
      title: "Left Hand Chords",
      instruction: "Use your left hand for harmony",
      gesture: "1 finger = C Major, 2 fingers = D Minor, 3 fingers = F Major",
      notes: "Practice: Hold 1 finger (left) + play 0,1,2 (right)",
      tip: "Left hand provides the chord foundation"
    },
    {
      title: "Simple Melody",
      instruction: "Play your first melody",
      gesture: "Right hand: 0→1→2→1→0 (C-D-E-D-C)",
      notes: "This creates a simple up-and-down melody",
      tip: "Practice slowly, then increase speed"
    },
    {
      title: "Add Harmony",
      instruction: "Combine melody with chords",
      gesture: "Left: 1 finger (C chord) + Right: 0→1→2",
      notes: "Now you're playing harmony + melody together!",
      tip: "This is the foundation of piano playing"
    }
  ],
  drums: [
    {
      title: "Basic Beat Pattern",
      instruction: "Learn the fundamental drum pattern",
      gesture: "0 fingers = Kick, 1 finger = Snare",
      notes: "Pattern: Kick-Snare-Kick-Snare (0-1-0-1)",
      tip: "This is the most common drum pattern in music"
    },
    {
      title: "Add Hi-Hat",
      instruction: "Include hi-hat for rhythm texture",
      gesture: "2 fingers = Closed Hi-Hat",
      notes: "Try: 2-0-2-1-2-0-2-1 (Hi-hat on every beat)",
      tip: "Hi-hat keeps the rhythm steady"
    },
    {
      title: "Fill Patterns",
      instruction: "Learn drum fills",
      gesture: "4 fingers = Low Tom, 5 fingers = Crash",
      notes: "Fill: 4-4-1-5 (Tom-Tom-Snare-Crash)",
      tip: "Use fills to transition between song sections"
    },
    {
      title: "Complete Pattern",
      instruction: "Put it all together",
      gesture: "Combine: 2-0-2-1-2-0-2-1 with occasional fills",
      notes: "Practice the basic pattern, add fills every 8 beats",
      tip: "This creates a full drum track!"
    }
  ],
  guitar: [
    {
      title: "Basic Chord Shapes",
      instruction: "Learn fundamental guitar chords",
      gesture: "Left hand: 1 finger = E, 2 fingers = G, 3 fingers = A",
      notes: "Practice holding each chord shape clearly",
      tip: "Left hand sets the chord, right hand strums"
    },
    {
      title: "Strumming Pattern",
      instruction: "Add strumming with right hand",
      gesture: "Right hand = Strum trigger",
      notes: "Hold left chord + strum with right hand",
      tip: "Any right hand gesture triggers the current chord"
    },
    {
      title: "Chord Progression",
      instruction: "Play a classic progression",
      gesture: "Left: 1→2→3→1 (E-G-A-E)",
      notes: "Change chords every 4 strums",
      tip: "This progression appears in thousands of songs"
    },
    {
      title: "Rhythm Guitar",
      instruction: "Combine chords with rhythm",
      gesture: "Left: Set chord, Right: Strum every beat",
      notes: "Hold 1 (E) + strum 4 times, then 2 (G) + strum 4 times",
      tip: "You're now playing rhythm guitar!"
    }
  ],
  flute: [
    {
      title: "Basic Scale",
      instruction: "Learn the flute scale",
      gesture: "0 = C4, 1 = D4, 2 = E4, 3 = F4, 4 = G4, 5 = A4",
      notes: "Practice: 0→1→2→3→4→5 (ascending scale)",
      tip: "Flute is great for melodies and lead lines"
    },
    {
      title: "Simple Melody",
      instruction: "Play a beautiful melody",
      gesture: "Try: 0→2→4→3→1 (C-E-G-F-D)",
      notes: "This creates a flowing melodic line",
      tip: "Vary the timing - some notes longer than others"
    },
    {
      title: "Octave Practice",
      instruction: "Explore different ranges",
      gesture: "Same finger patterns, different octaves",
      notes: "Practice the same melody in high and low registers",
      tip: "Flute sounds beautiful in all octaves"
    },
    {
      title: "Expressive Playing",
      instruction: "Add musical expression",
      gesture: "Vary your gesture speed and intensity",
      notes: "Fast gestures = quick notes, slow = sustained",
      tip: "Expression makes the difference in musical performance"
    }
  ],
  violin: [
    {
      title: "Basic Positions",
      instruction: "Learn violin finger positions",
      gesture: "1 = A3, 2 = C4, 3 = E4, 4 = G4, 5 = G5",
      notes: "Practice each position clearly",
      tip: "Violin uses different positions for different pitches"
    },
    {
      title: "Scale Practice",
      instruction: "Play violin scales",
      gesture: "1→2→3→4→5 (A-C-E-G-G)",
      notes: "This covers nearly two octaves",
      tip: "Scales are the foundation of violin technique"
    },
    {
      title: "Simple Melody",
      instruction: "Play a classic violin melody",
      gesture: "Try: 3→4→5→4→3 (E-G-G-G-E)",
      notes: "This creates a beautiful arcing melody",
      tip: "Violin excels at expressive, singing melodies"
    },
    {
      title: "Bowing Technique",
      instruction: "Simulate bowing with gestures",
      gesture: "Slow gestures = long bows, quick = short bows",
      notes: "Practice different articulations",
      tip: "Bowing technique creates violin's unique expressiveness"
    }
  ],
  saxophone: [
    {
      title: "Sax Range Basics",
      instruction: "Learn saxophone note range",
      gesture: "1 = A3, 2 = C4, 3 = D4, 4 = E4, 5 = G4",
      notes: "Practice each note clearly",
      tip: "Saxophone has a rich, warm tone"
    },
    {
      title: "Blues Scale",
      instruction: "Play the classic blues scale",
      gesture: "1→2→3→4→5→4→3→2→1",
      notes: "This is the foundation of jazz and blues",
      tip: "The blues scale creates that classic sax sound"
    },
    {
      title: "Jazz Phrasing",
      instruction: "Add jazz-style phrasing",
      gesture: "2→4→3→1 (C-E-D-A)",
      notes: "This creates a jazzy melodic line",
      tip: "Saxophone is perfect for jazz improvisation"
    },
    {
      title: "Solo Practice",
      instruction: "Create your own saxophone solo",
      gesture: "Combine different patterns: 1→3→5→2→4",
      notes: "Mix up the patterns to create unique solos",
      tip: "Great sax playing comes from personal expression"
    }
  ]
}

export default function InstrumentTraining({ instrument, onClose }: InstrumentTrainingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  
  const steps = trainingData[instrument] || []
  const currentStepData = steps[currentStep]

  if (!currentStepData) {
    return (
      <Card className="p-6">
        <p>Training not available for {instrument}</p>
        <Button onClick={onClose}>Close</Button>
      </Card>
    )
  }

  const markStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep])
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100
  const completionRate = (completedSteps.length / steps.length) * 100

  return (
    <Card className="p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 shadow-xl max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold capitalize">{instrument} Training</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step-by-step learning guide
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Step {currentStep + 1}/{steps.length}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {Math.round(completionRate)}% Complete
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200/50">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              {completedSteps.includes(currentStep) ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Hand className="h-6 w-6 text-green-600" />
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  {currentStepData.instruction}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Gesture
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentStepData.gesture}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Practice
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentStepData.notes}
                  </p>
                </div>
              </div>

              {currentStepData.tip && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Tip:</strong> {currentStepData.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {!completedSteps.includes(currentStep) && (
              <Button
                onClick={markStepComplete}
                className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Complete
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex items-center gap-2"
              >
                Complete Training
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Step Overview */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">All Steps:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  index === currentStep 
                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-300' 
                    : completedSteps.includes(index)
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex-shrink-0">
                  {completedSteps.includes(index) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : index === currentStep ? (
                    <ArrowRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${index === currentStep ? 'font-semibold' : ''}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} variant="outline">
            Close Training
          </Button>
        </div>
      </div>
    </Card>
  )
}