
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Zap, Clock, Target, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WorkoutGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState([30])
  const [workoutType, setWorkoutType] = useState("")
  const [fitnessLevel, setFitnessLevel] = useState("")
  const [equipment, setEquipment] = useState("")
  const [goals, setGoals] = useState("")
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null)
  const { toast } = useToast()

  const generateWorkout = async () => {
    const apiKey = localStorage.getItem('gemini-api-key')
    
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key in Settings first.",
        variant: "destructive"
      })
      return
    }

    if (!workoutType || !fitnessLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in workout type and fitness level.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const prompt = `Generate a ${duration[0]}-minute ${workoutType} workout for a ${fitnessLevel} fitness level person. 
      Equipment available: ${equipment || 'bodyweight only'}. 
      Goals: ${goals || 'general fitness'}. 
      
      Please provide a structured workout plan with:
      1. Warm-up (5 minutes)
      2. Main workout with exercises, sets, reps, and rest periods
      3. Cool-down (5 minutes)
      
      Format as JSON with this structure:
      {
        "title": "Workout Name",
        "duration": ${duration[0]},
        "warmup": [...],
        "exercises": [{"name": "", "sets": 0, "reps": "", "rest": "", "description": ""}],
        "cooldown": [...]
      }`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      const data = await response.json()
      
      if (data.candidates && data.candidates[0]) {
        const workoutText = data.candidates[0].content.parts[0].text
        // Try to extract JSON from the response
        const jsonMatch = workoutText.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          const workout = JSON.parse(jsonMatch[0])
          setGeneratedWorkout(workout)
          toast({
            title: "Workout Generated!",
            description: "Your personalized workout is ready.",
          })
        } else {
          // Fallback: create a simple workout structure
          setGeneratedWorkout({
            title: `${workoutType} Workout`,
            duration: duration[0],
            warmup: ["Light jogging", "Dynamic stretching", "Arm circles"],
            exercises: [
              { name: "Push-ups", sets: 3, reps: "8-12", rest: "60s", description: "Standard push-ups" },
              { name: "Squats", sets: 3, reps: "12-15", rest: "60s", description: "Bodyweight squats" },
              { name: "Plank", sets: 3, reps: "30s", rest: "45s", description: "Hold plank position" }
            ],
            cooldown: ["Static stretching", "Deep breathing", "Relaxation"]
          })
        }
      }
    } catch (error) {
      console.error('Error generating workout:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate workout. Please check your API key and try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full pulse-gradient-purple flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">AI Workout Generator</h2>
        <p className="text-muted-foreground">Let AI create your perfect workout</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workout Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Workout Type</Label>
              <Select value={workoutType} onValueChange={setWorkoutType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength Training</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                  <SelectItem value="full-body">Full Body</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fitness Level</Label>
              <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipment Available</Label>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bodyweight Only</SelectItem>
                <SelectItem value="dumbbells">Dumbbells</SelectItem>
                <SelectItem value="resistance-bands">Resistance Bands</SelectItem>
                <SelectItem value="full-gym">Full Gym Access</SelectItem>
                <SelectItem value="home-gym">Home Gym Setup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duration: {duration[0]} minutes</Label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={90}
              min={15}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15 min</span>
              <span>90 min</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specific Goals (Optional)</Label>
            <Textarea
              placeholder="e.g., lose weight, build muscle, improve endurance..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button 
            onClick={generateWorkout} 
            disabled={isGenerating}
            className="w-full pulse-gradient text-white font-semibold"
          >
            {isGenerating ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Workout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedWorkout && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {generatedWorkout.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Duration: {generatedWorkout.duration} minutes
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-pulse-green mb-2">Warm-up (5 min)</h4>
              <ul className="space-y-1 text-sm">
                {generatedWorkout.warmup?.map((exercise: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pulse-green" />
                    {exercise}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-pulse-blue mb-2">Main Workout</h4>
              <div className="space-y-3">
                {generatedWorkout.exercises?.map((exercise: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium">{exercise.name}</h5>
                      <span className="text-xs text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{exercise.description}</p>
                    <div className="text-xs text-pulse-cyan">Rest: {exercise.rest}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-pulse-purple mb-2">Cool-down (5 min)</h4>
              <ul className="space-y-1 text-sm">
                {generatedWorkout.cooldown?.map((exercise: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pulse-purple" />
                    {exercise}
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full" variant="outline">
              Start Workout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
