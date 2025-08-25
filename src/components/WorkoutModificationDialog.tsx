import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Clock, Target, Zap, RefreshCw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { useSportProfile } from "@/hooks/useSportProfile"

interface WorkoutModificationDialogProps {
  isOpen: boolean
  onClose: () => void
  onWorkoutGenerated: (workout: any) => void
  currentWorkout?: any
  mode: 'ask-ai' | 'regenerate'
}

const QUICK_MODIFICATIONS = [
  { text: "Make it more intense", icon: "🔥" },
  { text: "Focus on upper body", icon: "💪" },
  { text: "Add more cardio", icon: "❤️" },
  { text: "Make it beginner-friendly", icon: "🌱" },
  { text: "Include core exercises", icon: "🎯" },
  { text: "Reduce rest time", icon: "⏱️" },
  { text: "Add flexibility work", icon: "🧘‍♀️" },
  { text: "Focus on technique", icon: "🎯" },
]

export function WorkoutModificationDialog({ 
  isOpen, 
  onClose, 
  onWorkoutGenerated, 
  currentWorkout,
  mode 
}: WorkoutModificationDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { profile } = useSportProfile()
  const [modifications, setModifications] = useState("")
  const [duration, setDuration] = useState([currentWorkout?.duration || profile.sessionDuration || 60])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedQuickMods, setSelectedQuickMods] = useState<string[]>([])

  const handleQuickModSelection = (modText: string) => {
    if (selectedQuickMods.includes(modText)) {
      setSelectedQuickMods(prev => prev.filter(m => m !== modText))
      setModifications(prev => prev.replace(modText + ". ", "").replace(modText, ""))
    } else {
      setSelectedQuickMods(prev => [...prev, modText])
      setModifications(prev => prev ? `${prev}. ${modText}` : modText)
    }
  }

  const handleGenerate = async () => {
    if (!user) return

    setIsGenerating(true)
    
    try {
      // Get previous workouts for context
      const { data: previousWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('sport', currentWorkout?.sport || profile.primarySport)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get user goals for better workout generation
      const { data: userGoals } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)

      const goalsContext = userGoals && userGoals.length > 0 
        ? `Current goals: ${userGoals.map(g => `${g.name} (${g.current_value}/${g.target_value} ${g.unit})`).join(', ')}`
        : ''

      let prompt = ""
      if (mode === 'ask-ai') {
        prompt = `Please modify the current workout based on this request: ${modifications}`
        if (currentWorkout) {
          prompt += `\n\nCurrent workout: ${currentWorkout.title}\nExercises: ${JSON.stringify(currentWorkout.exercises)}`
        }
      } else {
        prompt = modifications ? `Generate a new workout with these requirements: ${modifications}` : `Generate a fresh workout`
      }

      if (goalsContext) {
        prompt += `\n\n${goalsContext}. Please design the workout to help progress towards these goals.`
      }

      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType: currentWorkout?.workout_type || 'training',
          sport: currentWorkout?.sport || profile.primarySport,
          sessionType: currentWorkout?.workout_type || 'training',
          fitnessLevel: profile.experienceLevel,
          duration: duration[0],
          equipment: profile.availableEquipment || [],
          sportEquipmentList: profile.availableEquipment || [],
          goals: prompt,
          previousWorkouts: previousWorkouts || [],
          adaptToProgress: true,
          coachSuggestions: modifications,
          isModification: mode === 'ask-ai'
        }
      })

      if (error) {
        throw error
      }

      if (data?.workout) {
        onWorkoutGenerated(data.workout)
        toast({
          title: mode === 'ask-ai' ? "Workout Modified! ✨" : "New Workout Generated! 🎯",
          description: "Your personalized workout is ready.",
        })
        onClose()
        setModifications("")
        setSelectedQuickMods([])
      }
    } catch (error: any) {
      console.error('Error generating workout:', error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate workout. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'ask-ai' ? (
              <>
                <Sparkles className="h-5 w-5 text-pulse-purple" />
                Ask AI Coach
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-pulse-blue" />
                Regenerate Workout
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Duration Slider */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label>Duration: {duration[0]} minutes</Label>
                </div>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  max={120}
                  min={15}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Modifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Label>Quick Modifications</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_MODIFICATIONS.map((mod) => (
                <Badge
                  key={mod.text}
                  variant={selectedQuickMods.includes(mod.text) ? "default" : "outline"}
                  onClick={() => handleQuickModSelection(mod.text)}
                  className="cursor-pointer justify-start p-2 h-auto"
                >
                  <span className="mr-2">{mod.icon}</span>
                  {mod.text}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Request */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="modifications">
                {mode === 'ask-ai' 
                  ? "What would you like to change about this workout?" 
                  : "Any specific requirements for the new workout?"
                }
              </Label>
            </div>
            <Textarea
              id="modifications"
              placeholder={mode === 'ask-ai' 
                ? "e.g., make it more challenging, focus on legs, add swimming drills, reduce intensity..."
                : "e.g., focus on endurance, include specific exercises, target certain muscle groups..."
              }
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full pulse-gradient text-white font-semibold"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                {mode === 'ask-ai' ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Modify Workout
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate New Workout
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}