
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Eye, Play } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export function TodaysWorkouts() {
  const { user } = useAuth()
  const { toast } = useToast()
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

  if (todayWorkouts.length === 0) {
    return null
  }

  return (
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
  )
}
