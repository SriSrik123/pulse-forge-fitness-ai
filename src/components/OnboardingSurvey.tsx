import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Target, Trophy, Dumbbell, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

const SPORTS = [
  { value: "swimming", label: "Swimming", icon: "🏊‍♂️" },
  { value: "running", label: "Running", icon: "🏃‍♂️" },
  { value: "cycling", label: "Cycling", icon: "🚴‍♂️" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
  { value: "tennis", label: "Tennis", icon: "🎾" },
  { value: "weightlifting", label: "Weightlifting", icon: "🏋️‍♂️" },
  { value: "yoga", label: "Yoga", icon: "🧘‍♀️" },
]

const GOALS = [
  { value: "be_better_at_sport", label: "Be Better at Sport", icon: "🏆" },
  { value: "weight_loss", label: "Weight Loss", icon: "📉" },
  { value: "muscle_gain", label: "Muscle Gain", icon: "💪" },
  { value: "endurance", label: "Endurance", icon: "🏃" },
  { value: "strength", label: "Strength", icon: "🏋️" },
  { value: "flexibility", label: "Flexibility", icon: "🤸" },
  { value: "general_fitness", label: "General Fitness", icon: "✨" },
]

interface SurveyData {
  primarySport: string
  fitnessGoals: string[]
  experienceLevel: string
  trainingFrequency: number
  sessionDuration: number
  wantsSupplementalLifting: boolean
  currentStats: {
    height: string
    weight: string
    sportSpecificStats: string
  }
  intensityPreference: number
}

interface OnboardingSurveyProps {
  onComplete: () => void
}

export function OnboardingSurvey({ onComplete }: OnboardingSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [surveyData, setSurveyData] = useState<SurveyData>({
    primarySport: "",
    fitnessGoals: [],
    experienceLevel: "",
    trainingFrequency: 3,
    sessionDuration: 60,
    wantsSupplementalLifting: false,
    currentStats: {
      height: "",
      weight: "",
      sportSpecificStats: ""
    },
    intensityPreference: 5
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const totalSteps = 6
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleGoal = (goal: string) => {
    setSurveyData(prev => ({
      ...prev,
      fitnessGoals: prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter(g => g !== goal)
        : [...prev.fitnessGoals, goal]
    }))
  }

  const handleComplete = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // First delete existing sport profile to avoid unique constraint issues
      await supabase
        .from('user_sport_profiles')
        .delete()
        .eq('user_id', user.id)

      // Then insert the new profile
      const { error: profileError } = await supabase
        .from('user_sport_profiles')
        .insert({
          user_id: user.id,
          primary_sport: surveyData.primarySport,
          experience_level: surveyData.experienceLevel,
          competitive_level: 'recreational',
          training_frequency: surveyData.trainingFrequency,
          session_duration: surveyData.sessionDuration,
          current_goals: surveyData.fitnessGoals.join(', '),
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Save onboarding completion flag
      const { error: flagError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          preferences: {
            wantsSupplementalLifting: surveyData.wantsSupplementalLifting,
            intensityPreference: surveyData.intensityPreference,
            stats: surveyData.currentStats
          }
        })
        .eq('id', user.id)

      if (flagError) throw flagError

      toast({
        title: "Welcome to PulseTrack! 🎉",
        description: "Your preferences have been saved. Let's get started!",
      })

      onComplete()
    } catch (error) {
      console.error('Error saving survey data:', error)
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 mx-auto text-pulse-blue animate-pulse" />
              <h3 className="text-xl font-semibold">What's your primary sport?</h3>
              <p className="text-muted-foreground">This helps us create personalized workouts for you</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SPORTS.map((sport) => (
                <Button
                  key={sport.value}
                  variant={surveyData.primarySport === sport.value ? "default" : "outline"}
                  className="h-16 flex flex-col gap-1 transition-all duration-200 hover:scale-105"
                  onClick={() => setSurveyData(prev => ({ ...prev, primarySport: sport.value }))}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <span className="text-sm">{sport.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <Trophy className="h-12 w-12 mx-auto text-pulse-blue animate-bounce" />
              <h3 className="text-xl font-semibold">What are your fitness goals?</h3>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((goal) => (
                <Button
                  key={goal.value}
                  variant={surveyData.fitnessGoals.includes(goal.value) ? "default" : "outline"}
                  className="h-16 flex flex-col gap-1 transition-all duration-200 hover:scale-105"
                  onClick={() => toggleGoal(goal.value)}
                >
                  <span className="text-2xl">{goal.icon}</span>
                  <span className="text-sm text-center">{goal.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <Activity className="h-12 w-12 mx-auto text-pulse-blue animate-spin" />
              <h3 className="text-xl font-semibold">Experience & Training</h3>
              <p className="text-muted-foreground">Tell us about your current fitness level</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={surveyData.experienceLevel} onValueChange={(value) => 
                  setSurveyData(prev => ({ ...prev, experienceLevel: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="novice">Novice (1-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (5-10 years)</SelectItem>
                    <SelectItem value="expert">Expert (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Training Frequency: {surveyData.trainingFrequency} sessions/week</Label>
                <Slider
                  value={[surveyData.trainingFrequency]}
                  onValueChange={([value]) => setSurveyData(prev => ({ ...prev, trainingFrequency: value }))}
                  max={7}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Session Duration: {surveyData.sessionDuration} minutes</Label>
                <Slider
                  value={[surveyData.sessionDuration]}
                  onValueChange={([value]) => setSurveyData(prev => ({ ...prev, sessionDuration: value }))}
                  max={180}
                  min={30}
                  step={15}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <Dumbbell className="h-12 w-12 mx-auto text-pulse-blue animate-pulse" />
              <h3 className="text-xl font-semibold">Supplemental Training</h3>
              <p className="text-muted-foreground">Do you want strength training alongside your sport?</p>
            </div>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Add weightlifting sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Include strength training to complement your {SPORTS.find(s => s.value === surveyData.primarySport)?.label.toLowerCase()} training
                  </p>
                </div>
                <Switch
                  checked={surveyData.wantsSupplementalLifting}
                  onCheckedChange={(checked) => 
                    setSurveyData(prev => ({ ...prev, wantsSupplementalLifting: checked }))
                  }
                />
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Workout Intensity Preference: {surveyData.intensityPreference}/10</Label>
              <Slider
                value={[surveyData.intensityPreference]}
                onValueChange={([value]) => setSurveyData(prev => ({ ...prev, intensityPreference: value }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Light & Easy</span>
                <span>Intense & Challenging</span>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Your Stats</h3>
              <p className="text-muted-foreground">Help us customize your workouts</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Input
                    placeholder="5'8&quot; or 173cm"
                    value={surveyData.currentStats.height}
                    onChange={(e) => setSurveyData(prev => ({
                      ...prev,
                      currentStats: { ...prev.currentStats, height: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input
                    placeholder="150lbs or 68kg"
                    value={surveyData.currentStats.weight}
                    onChange={(e) => setSurveyData(prev => ({
                      ...prev,
                      currentStats: { ...prev.currentStats, weight: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sport-Specific Stats (Optional)</Label>
                <Input
                  placeholder="e.g., 100m freestyle: 1:15, 5K time: 22:30, max bench: 185lbs"
                  value={surveyData.currentStats.sportSpecificStats}
                  onChange={(e) => setSurveyData(prev => ({
                    ...prev,
                    currentStats: { ...prev.currentStats, sportSpecificStats: e.target.value }
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Share any relevant performance metrics for your sport
                </p>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <h3 className="text-xl font-semibold">All Set!</h3>
              <p className="text-muted-foreground">
                We'll use your preferences to create personalized workouts just for you
              </p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2">
              <h4 className="font-medium">Your Profile:</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>🏃‍♂️ Primary Sport: {SPORTS.find(s => s.value === surveyData.primarySport)?.label}</p>
                <p>🎯 Goals: {surveyData.fitnessGoals.map(g => GOALS.find(goal => goal.value === g)?.label).join(', ')}</p>
                <p>📅 Training: {surveyData.trainingFrequency}x/week, {surveyData.sessionDuration} min sessions</p>
                <p>💪 Supplemental Lifting: {surveyData.wantsSupplementalLifting ? 'Yes' : 'No'}</p>
                <p>⚡ Intensity: {surveyData.intensityPreference}/10</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return surveyData.primarySport !== ""
      case 1: return surveyData.fitnessGoals.length > 0
      case 2: return surveyData.experienceLevel !== ""
      case 3: return true
      case 4: return true
      case 5: return true
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md glass border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-8 w-8 text-pulse-blue" />
            <h1 className="text-2xl font-bold">PulseTrack</h1>
          </div>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-muted-foreground">Step {currentStep + 1} of {totalSteps}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStep()}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === totalSteps - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
