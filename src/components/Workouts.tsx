
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Activity, Clock, Zap, Calendar as CalendarIcon } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { format, isSameDay } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface WorkoutDay {
  date: Date
  workouts: any[]
  hasWeights: boolean
  hasSport: boolean
}

export function Workouts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWorkouts = async () => {
    if (!user) return

    try {
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group workouts by date
      const workoutsByDate = new Map<string, any[]>()
      
      workouts?.forEach(workout => {
        const date = format(new Date(workout.created_at), 'yyyy-MM-dd')
        if (!workoutsByDate.has(date)) {
          workoutsByDate.set(date, [])
        }
        workoutsByDate.get(date)?.push(workout)
      })

      // Create workout days with indicators
      const days: WorkoutDay[] = []
      workoutsByDate.forEach((dayWorkouts, dateStr) => {
        const date = new Date(dateStr + 'T00:00:00')
        const hasWeights = dayWorkouts.some(w => 
          w.workout_type === 'supplement' || 
          w.workout_type === 'strength' ||
          w.workout_type === 'general'
        )
        const hasSport = dayWorkouts.some(w => w.workout_type === 'training')
        
        days.push({
          date,
          workouts: dayWorkouts,
          hasWeights,
          hasSport
        })
      })

      setWorkoutDays(days)

      // Set workouts for selected date
      const selectedWorkouts = days.find(day => 
        isSameDay(day.date, selectedDate)
      )?.workouts || []
      setSelectedDayWorkouts(selectedWorkouts)

    } catch (error) {
      console.error('Error fetching workouts:', error)
      toast({
        title: "Error",
        description: "Failed to load workout history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkouts()
  }, [user])

  useEffect(() => {
    const selectedWorkouts = workoutDays.find(day => 
      isSameDay(day.date, selectedDate)
    )?.workouts || []
    setSelectedDayWorkouts(selectedWorkouts)
  }, [selectedDate, workoutDays])

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-pulse-purple/20 text-pulse-purple'
      case 'Medium': return 'bg-pulse-blue/20 text-pulse-blue'
      case 'Low': return 'bg-pulse-green/20 text-pulse-green'
      default: return 'bg-muted/20 text-muted-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-red-500/20 text-red-500'
      case 'supplement': return 'bg-blue-500/20 text-blue-500'
      case 'strength': return 'bg-blue-500/20 text-blue-500'
      case 'cardio': return 'bg-green-500/20 text-green-500'
      case 'yoga': return 'bg-purple-500/20 text-purple-500'
      case 'hiit': return 'bg-red-500/20 text-red-500'
      default: return 'bg-muted/20 text-muted-foreground'
    }
  }

  const renderCalendarDay = (day: Date) => {
    const workoutDay = workoutDays.find(wd => isSameDay(wd.date, day))
    if (!workoutDay) return null

    return (
      <div className="flex justify-center mt-1 gap-1">
        {workoutDay.hasWeights && (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
        {workoutDay.hasSport && (
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Workout History</h2>
        <p className="text-muted-foreground">Track your fitness journey</p>
      </div>

      {/* Calendar */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border-0 p-0"
              components={{
                DayContent: ({ date }) => (
                  <div className="relative">
                    <span>{date.getDate()}</span>
                    {renderCalendarDay(date)}
                  </div>
                )
              }}
            />
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Weights/General</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Sport Training</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Workouts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>

        {selectedDayWorkouts.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No workouts on this day</h3>
              <p className="text-muted-foreground">
                {isSameDay(selectedDate, new Date()) 
                  ? "Generate a workout to get started!" 
                  : "Select a different date or generate a new workout"}
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedDayWorkouts.map((workout) => (
            <Card key={workout.id} className="glass border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-pulse-blue" />
                    <h3 className="font-semibold">{workout.title}</h3>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(workout.created_at), 'h:mm a')}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getTypeColor(workout.workout_type)}>
                    {workout.workout_type}
                  </Badge>
                  <Badge className="bg-pulse-green/20 text-pulse-green">
                    Completed ✓
                  </Badge>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {workout.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      {workout.sport}
                    </div>
                  </div>
                </div>

                {workout.journal_entry && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <h5 className="font-medium text-sm mb-1">Journal Entry:</h5>
                    <p className="text-sm text-muted-foreground">{workout.journal_entry}</p>
                    {workout.feeling && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Feeling: </span>
                        <span className="text-lg">{workout.feeling}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
