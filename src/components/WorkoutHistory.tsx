import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Activity, Clock, Zap, Calendar as CalendarIcon } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { format, isSameDay } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function WorkoutHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [workouts, setWorkouts] = useState<any[]>([])
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWorkouts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkouts(data || [])

      const selectedWorkouts = (data || []).filter(workout => 
        isSameDay(new Date(workout.created_at), selectedDate)
      )
      setSelectedDayWorkouts(selectedWorkouts)

    } catch (error) {
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
    const selectedWorkouts = workouts.filter(workout => 
      isSameDay(new Date(workout.created_at), selectedDate)
    )
    setSelectedDayWorkouts(selectedWorkouts)
  }, [selectedDate, workouts])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading workouts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Workout History</h2>
        <p className="text-muted-foreground">Track your fitness journey</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border-0"
          />
        </CardContent>
      </Card>

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
                Select a different date to view workouts
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedDayWorkouts.map((workout) => (
            <Card key={workout.id} className="glass border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{workout.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(workout.created_at), 'h:mm a')}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{workout.workout_type}</Badge>
                  <Badge variant="default">Completed ✓</Badge>
                </div>

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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}