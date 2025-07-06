import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Clock, Target, Sparkles, Waves, Dumbbell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const sportEquipment = {
  swimming: [
    { id: "pool", label: "Swimming Pool" },
    { id: "kickboard", label: "Kickboard" },
    { id: "pull-buoy", label: "Pull Buoy" },
    { id: "fins", label: "Swim Fins" },
    { id: "paddles", label: "Hand Paddles" },
    { id: "snorkel", label: "Swimming Snorkel" }
  ],
  running: [
    { id: "treadmill", label: "Treadmill" },
    { id: "track", label: "Running Track" },
    { id: "trails", label: "Trail Access" },
    { id: "hills", label: "Hills/Inclines" },
    { id: "resistance-bands", label: "Resistance Bands" }
  ],
  cycling: [
    { id: "road-bike", label: "Road Bike" },
    { id: "mountain-bike", label: "Mountain Bike" },
    { id: "trainer", label: "Indoor Trainer" },
    { id: "power-meter", label: "Power Meter" },
    { id: "heart-rate", label: "Heart Rate Monitor" }
  ],
  basketball: [
    { id: "court", label: "Basketball Court" },
    { id: "hoop", label: "Basketball Hoop" },
    { id: "agility-ladder", label: "Agility Ladder" },
    { id: "cones", label: "Training Cones" },
    { id: "plyometric-box", label: "Plyometric Box" }
  ],
  soccer: [
    { id: "field", label: "Soccer Field" },
    { id: "goals", label: "Soccer Goals" },
    { id: "cones", label: "Training Cones" },
    { id: "agility-ladder", label: "Agility Ladder" },
    { id: "ball", label: "Soccer Ball" }
  ],
  tennis: [
    { id: "court", label: "Tennis Court" },
    { id: "racket", label: "Tennis Racket" },
    { id: "ball-machine", label: "Ball Machine" },
    { id: "agility-ladder", label: "Agility Ladder" },
    { id: "resistance-bands", label: "Resistance Bands" }
  ]
}

export function WorkoutGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState([30])
  const [workoutType, setWorkoutType] = useState("")
  const [sport, setSport] = useState("")
  const [fitnessLevel, setFitnessLevel] = useState("")
  const [equipment, setEquipment] = useState("")
  const [sportEquipmentList, setSportEquipmentList] = useState<string[]>([])
  const [goals, setGoals] = useState("")
  const [sessionType, setSessionType] = useState("")
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null)
  const { toast } = useToast()

  const handleSportEquipmentChange = (equipmentId: string, checked: boolean) => {
    if (checked) {
      setSportEquipmentList([...sportEquipmentList, equipmentId])
    } else {
      setSportEquipmentList(sportEquipmentList.filter(id => id !== equipmentId))
    }
  }

  const generateWorkout = async () => {
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
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType,
          sport,
          sessionType,
          fitnessLevel,
          duration: duration[0],
          equipment,
          sportEquipmentList,
          goals
        }
      })

      if (error) {
        throw error
      }

      if (data?.workout) {
        setGeneratedWorkout(data.workout)
        toast({
          title: "Workout Generated!",
          description: "Your personalized workout is ready and saved.",
        })
      }
    } catch (error) {
      console.error('Error generating workout:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate workout. Please try again.",
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
        <p className="text-muted-foreground">Sport-specific training & gym sessions</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Training Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Training Type</Label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger>
                <SelectValue placeholder="Select training type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Fitness</SelectItem>
                <SelectItem value="sport-specific">Sport-Specific Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {workoutType === "sport-specific" && (
            <>
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={sport} onValueChange={(value) => {
                  setSport(value)
                  setSportEquipmentList([])
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="soccer">Soccer</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sport && (
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Sport Training Session</SelectItem>
                      <SelectItem value="supplement">Supplementary Gym Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {sport && sportEquipment[sport as keyof typeof sportEquipment] && (
                <div className="space-y-2">
                  <Label>Available Equipment</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {sportEquipment[sport as keyof typeof sportEquipment].map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={sportEquipmentList.includes(item.id)}
                          onCheckedChange={(checked) => handleSportEquipmentChange(item.id, checked as boolean)}
                        />
                        <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {workoutType === "general" && (
            <>
              <div className="space-y-2">
                <Label>Workout Type</Label>
                <Select value={equipment} onValueChange={setEquipment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout type" />
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
            </>
          )}

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

          <div className="space-y-2">
            <Label>Duration: {duration[0]} minutes</Label>
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

          <div className="space-y-2">
            <Label>Specific Goals (Optional)</Label>
            <Textarea
              placeholder={sport ? `e.g., improve ${sport} technique, build endurance...` : "e.g., lose weight, build muscle, improve endurance..."}
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
                Generate {sport ? `${sport} ` : ''}Workout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedWorkout && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {generatedWorkout.sport ? <Waves className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              {generatedWorkout.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Duration: {generatedWorkout.duration} minutes</span>
              {generatedWorkout.sport && (
                <span className="text-pulse-blue">Sport: {generatedWorkout.sport}</span>
              )}
              {generatedWorkout.type && (
                <span className="text-pulse-green">Type: {generatedWorkout.type}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-pulse-green mb-2">Warm-up</h4>
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
              <h4 className="font-semibold text-pulse-blue mb-2">
                {generatedWorkout.type === 'supplement' ? 'Gym Exercises' : 'Main Training'}
              </h4>
              <div className="space-y-3">
                {generatedWorkout.exercises?.map((exercise: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{exercise.name}</h5>
                        {exercise.sportSpecific && (
                          <span className="text-xs bg-pulse-blue/20 text-pulse-blue px-2 py-1 rounded">
                            Sport-Specific
                          </span>
                        )}
                      </div>
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
              <h4 className="font-semibold text-pulse-purple mb-2">Cool-down</h4>
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
              <Dumbbell className="mr-2 h-4 w-4" />
              Start {generatedWorkout.sport ? `${generatedWorkout.sport} ` : ''}Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
