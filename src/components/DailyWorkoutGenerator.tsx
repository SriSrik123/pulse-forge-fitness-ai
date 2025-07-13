import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Target, Zap, Eye, Play } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const SPORTS = [
  { value: "swimming", label: "Swimming", icon: "🏊‍♂️" },
  { value: "running", label: "Running", icon: "🏃‍♂️" },
  { value: "cycling", label: "Cycling", icon: "🚴‍♂️" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
  { value: "tennis", label: "Tennis", icon: "🎾" },
  { value: "weightlifting", label: "Weight Training", icon: "🏋️‍♀️" },
]

const WORKOUT_TYPES = [
  { value: "training", label: "Sport Training", icon: "🏃‍♂️" },
  { value: "supplement", label: "Gym Workout", icon: "💪" },
  { value: "strength", label: "Strength", icon: "🏋️‍♀️" },
  { value: "cardio", label: "Cardio", icon: "❤️" },
  { value: "yoga", label: "Yoga", icon: "🧘‍♀️" },
  { value: "hiit", label: "HIIT", icon: "🔥" },
]

export function DailyWorkoutGenerator() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { profile } = useSportProfile()
  const [generating, setGenerating] = useState(false)
  const [selectedSport, setSelectedSport] = useState(profile.primarySport || "swimming")
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("training")
  const [equipmentList, setEquipmentList] = useState<string[]>([])
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])

  useEffect(() => {
    const fetchTodayWorkouts = async () => {
      if (!user) return
      
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const { data, error } = await supabase
          .from('scheduled_workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('scheduled_date', today)
          .order('workout_type', { ascending: true })

        if (error) throw error
        setTodayWorkouts(data || [])
      } catch (error) {
        console.error('Error fetching today workouts:', error)
      }
    }

    fetchTodayWorkouts()
  }, [user])

  const getEquipmentForSport = (sport: string) => {
    const equipmentMap: Record<string, string[]> = {
      swimming: ["Kickboard", "Pull Buoy", "Fins", "Paddles", "Snorkel", "Resistance Bands"],
      running: ["Running Shoes", "Heart Rate Monitor", "Resistance Bands", "Foam Roller"],
      cycling: ["Bike", "Helmet", "Water Bottle", "Bike Computer"],
      basketball: ["Basketball", "Resistance Bands", "Agility Ladder", "Cones"],
      soccer: ["Soccer Ball", "Cones", "Agility Ladder", "Resistance Bands"],
      tennis: ["Tennis Racket", "Tennis Balls", "Resistance Bands", "Agility Ladder"],
      weightlifting: ["Dumbbells", "Barbell", "Weight Plates", "Bench", "Squat Rack"],
      default: ["Resistance Bands", "Dumbbells", "Medicine Ball", "Foam Roller"]
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
        toast({
          title: "Workout Generated!",
          description: "Your personalized workout is ready. Check the workout viewer to see it.",
        })
        
        // Dispatch event to show the workout
        window.dispatchEvent(new CustomEvent('showWorkout', { 
          detail: { workoutId: data.workout.id } 
        }))
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

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      swimming: "🏊‍♂️",
      running: "🏃‍♂️",
      cycling: "🚴‍♂️",
      basketball: "🏀",
      soccer: "⚽",
      tennis: "🎾",
      weightlifting: "🏋️‍♀️",
      strength: "💪",
      cardio: "❤️",
      yoga: "🧘‍♀️"
    }
    return icons[sport] || "💪"
  }

  const handleTodayWorkoutClick = (workout: any) => {
    if (workout.workout_id) {
      // Navigate to workouts tab and show the specific workout
      window.dispatchEvent(new CustomEvent('showWorkout', { detail: { workoutId: workout.workout_id } }))
    } else {
      toast({
        title: "Generating Workout",
        description: "Please wait while we generate your workout...",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Today's Scheduled Workouts */}
      {todayWorkouts.length > 0 && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Today's Workouts - {format(new Date(), 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayWorkouts.map((workout) => (
              <div 
                key={workout.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  workout.completed 
                    ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' 
                    : workout.workout_id
                      ? 'bg-pulse-blue/10 border-pulse-blue/20 hover:bg-pulse-blue/20'
                      : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
                }`}
                onClick={() => handleTodayWorkoutClick(workout)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSportIcon(workout.sport)}</span>
                  <div>
                    <div className="font-medium">{workout.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {workout.session_time_of_day} • {workout.workout_type}
                      {workout.workout_id ? ' • Ready to view' : ' • Click to generate'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workout.workout_id && (
                    <Eye className="h-4 w-4 text-pulse-blue" />
                  )}
                  {!workout.workout_id && (
                    <Play className="h-4 w-4 text-orange-500" />
                  )}
                  <Badge className={
                    workout.completed 
                      ? 'bg-green-500/20 text-green-500 border-green-500/30'
                      : workout.workout_id
                        ? 'bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30'
                        : 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                  }>
                    {workout.completed ? 'Completed ✓' : workout.workout_id ? 'Ready' : 'Generate'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Daily Workout Generator */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Daily Workout
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Sport</h3>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((sport) => (
                <Badge
                  key={sport.value}
                  variant={selectedSport === sport.value ? "default" : "outline"}
                  onClick={() => setSelectedSport(sport.value)}
                  className="cursor-pointer"
                >
                  {sport.icon} {sport.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Workout Type</h3>
            <div className="flex flex-wrap gap-2">
              {WORKOUT_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={selectedWorkoutType === type.value ? "default" : "outline"}
                  onClick={() => setSelectedWorkoutType(type.value)}
                  className="cursor-pointer"
                >
                  {type.icon} {type.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Equipment</h3>
          <div className="flex flex-wrap gap-2">
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
              Generating Workout...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              Generate Daily Workout
            </>
          )}
        </Button>
      </CardContent>
    </Card>
    </div>
  )
}