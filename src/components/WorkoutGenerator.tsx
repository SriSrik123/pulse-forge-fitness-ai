import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Clock, Target, Users, Dumbbell, Zap, Play, Edit3 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useToast } from "@/hooks/use-toast"
import { WorkoutCompletion } from "@/components/WorkoutCompletion"
import { WorkoutModifier } from "@/components/WorkoutModifier"

const SPORTS = [
  { value: "swimming", label: "Swimming", icon: "🏊‍♂️" },
  { value: "running", label: "Running", icon: "🏃‍♂️" },
  { value: "cycling", label: "Cycling", icon: "🚴‍♂️" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
  { value: "tennis", label: "Tennis", icon: "🎾" },
]

const WORKOUT_TYPES = [
  { value: "training", label: "Sport Training", icon: "🏃‍♂️" },
  { value: "supplement", label: "Gym Workout", icon: "💪" },
  { value: "strength", label: "Strength", icon: "🏋️‍♀️" },
  { value: "cardio", label: "Cardio", icon: "❤️" },
  { value: "yoga", label: "Yoga", icon: "🧘‍♀️" },
  { value: "hiit", label: "HIIT", icon: "🔥" },
]

export function WorkoutGenerator() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { profile, getSportInfo } = useSportProfile()
  const sportInfo = getSportInfo(profile.primarySport)
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedSport, setSelectedSport] = useState(profile.primarySport)
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("training")
	const [equipmentList, setEquipmentList] = useState<string[]>([])
  const [showCompletion, setShowCompletion] = useState(false)
  const [showModifier, setShowModifier] = useState(false)

  useEffect(() => {
    if (profile.primarySport) {
      setSelectedSport(profile.primarySport)
    }
  }, [profile.primarySport])

  const generateWorkout = async () => {
    if (!user) return

    setGenerating(true)
    try {
      // Get previous workouts for context
      const { data: previousWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('sport', selectedSport)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType: selectedWorkoutType,
          sport: selectedSport,
          sessionType: selectedWorkoutType,
          fitnessLevel: profile.experienceLevel,
          duration: profile.sessionDuration,
          equipment: equipmentList,
          sportEquipmentList: equipmentList,
          goals: `Improve ${selectedSport} performance`,
          previousWorkouts: previousWorkouts || [],
          adaptToProgress: true
        }
      })

      if (data?.workout) {
        setGeneratedWorkout(data.workout)
      } else {
        toast({
          title: "Error",
          description: "Failed to generate workout. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const getEquipmentForSport = (sport: string) => {
    const equipmentMap: Record<string, string[]> = {
      swimming: ["Kickboard", "Pull Buoy", "Fins", "Paddles", "Snorkel", "Resistance Bands", "Pool Noodle"],
      running: ["Running Shoes", "Heart Rate Monitor", "Resistance Bands", "Foam Roller", "Water Bottle", "GPS Watch"],
      cycling: ["Bike", "Helmet", "Water Bottle", "Bike Computer", "Repair Kit", "Resistance Trainer"],
      basketball: ["Basketball", "Resistance Bands", "Agility Ladder", "Cones", "Jump Rope", "Medicine Ball"],
      soccer: ["Soccer Ball", "Cones", "Agility Ladder", "Resistance Bands", "Goal", "Cleats"],
      tennis: ["Tennis Racket", "Tennis Balls", "Resistance Bands", "Agility Ladder", "Cones", "Medicine Ball"],
      weightlifting: ["Dumbbells", "Barbell", "Weight Plates", "Bench", "Squat Rack", "Resistance Bands", "Kettlebells"],
      yoga: ["Yoga Mat", "Yoga Blocks", "Yoga Strap", "Bolster", "Meditation Cushion", "Resistance Bands"],
      default: ["Resistance Bands", "Dumbbells", "Medicine Ball", "Foam Roller", "Exercise Mat", "Water Bottle"]
    }
    return equipmentMap[sport] || equipmentMap.default
  }

  const selectEquipment = (equipment: string) => {
		setEquipmentList((prevEquipment) =>
			prevEquipment.includes(equipment)
				? prevEquipment.filter((item) => item !== equipment)
				: [...prevEquipment, equipment]
		)
	}

  const handleWorkoutComplete = () => {
    setGeneratedWorkout(null)
    setShowCompletion(false)
    setShowModifier(false)
    toast({
      title: "Success!",
      description: "Workout saved to your history. Great job!",
    })
  }

  const handleWorkoutModified = (modifiedWorkout: any) => {
    setGeneratedWorkout(modifiedWorkout)
    setShowModifier(false)
  }

  if (generatedWorkout) {
    if (showCompletion) {
      return <WorkoutCompletion workout={generatedWorkout} onComplete={handleWorkoutComplete} />
    }

    if (showModifier) {
      return <WorkoutModifier originalWorkout={generatedWorkout} onModified={handleWorkoutModified} />
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-pulse-blue" />
              {generatedWorkout.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-pulse-blue/20 text-pulse-blue">
                {generatedWorkout.type}
              </Badge>
              <Badge className="bg-pulse-green/20 text-pulse-green">
                AI Generated
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {generatedWorkout.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {generatedWorkout.sport}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {generatedWorkout.exercises?.length} exercises
              </div>
            </div>

            <Separator />

            <h4 className="text-sm font-medium">Warm-up</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {generatedWorkout.warmup?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <Separator />

            <h4 className="text-sm font-medium">Workout</h4>
            <ScrollArea className="h-[200px] rounded-md">
              <ul className="space-y-2 text-sm">
                {generatedWorkout.exercises?.map((exercise: any, index: number) => (
                  <li key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7 font-medium">{exercise.name}</div>
                    <div className="col-span-2 text-muted-foreground">{exercise.sets} sets</div>
                    <div className="col-span-3 text-muted-foreground">{exercise.reps} reps</div>
                    {exercise.description && (
                      <div className="col-span-12 text-xs text-muted-foreground italic">
                        {exercise.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <Separator />

            <h4 className="text-sm font-medium">Cool-down</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {generatedWorkout.cooldown?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCompletion(true)}
            className="flex-1 pulse-gradient text-white font-semibold"
          >
            <Play className="mr-2 h-4 w-4" />
            Mark as Done
          </Button>
          
          <Button 
            onClick={() => setShowModifier(true)}
            variant="outline"
            className="flex-1"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Modify Workout
          </Button>
        </div>

        <Button 
          onClick={() => setGeneratedWorkout(null)}
          variant="ghost"
          className="w-full"
        >
          Generate New Workout
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{sportInfo.icon}</span>
          <h2 className="text-2xl font-bold">
            {sportInfo.label} Workout Generator
          </h2>
        </div>
        <p className="text-muted-foreground">
          AI-powered workout generator for {sportInfo.label}
        </p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Customize Workout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Sport</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {SPORTS.map((sport) => (
                  <Badge
                    key={sport.value}
                    variant={selectedSport === sport.value ? "default" : "outline"}
                    onClick={() => setSelectedSport(sport.value)}
                    className="cursor-pointer"
                  >
                    {sport.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Workout Type</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {WORKOUT_TYPES.map((type) => (
                  <Badge
                    key={type.value}
                    variant={selectedWorkoutType === type.value ? "default" : "outline"}
                    onClick={() => setSelectedWorkoutType(type.value)}
                    className="cursor-pointer"
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

					<div>
						<h3 className="text-sm font-medium">Equipment</h3>
						<div className="flex flex-wrap gap-2 mt-2">
							{getEquipmentForSport(selectedSport).map((equipment) => (
								<Badge
									key={equipment}
									variant={equipmentList.includes(equipment) ? "default" : "outline"}
									onClick={() => selectEquipment(equipment)}
									className="cursor-pointer"
								>
									{equipment}
								</Badge>
							))}
						</div>
					</div>

          <Button
            onClick={generateWorkout}
            className="w-full pulse-gradient text-white font-semibold"
            disabled={generating}
          >
            {generating ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Generate Workout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">AI Workout Generator</h3>
          <p className="text-muted-foreground">
            Customize your workout preferences and generate a personalized
            workout plan.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
