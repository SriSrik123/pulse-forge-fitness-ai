import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Play, X, Check, History } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"

interface ScheduledWorkout {
  id: string
  scheduled_date: string
  session_time_of_day: string
  sport: string
  workout_type: string
  title: string
  completed: boolean
  skipped: boolean
  workout_id: string | null
}

interface CompletedWorkout {
  id: string
  title: string
  sport: string
  workout_type: string
  completed: boolean
  created_at: string
  duration: number | null
  feeling: string | null
  journal_entry: string | null
}

export function WorkoutCalendar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    if (user) {
      fetchScheduledWorkouts()
      fetchCompletedWorkouts()
    }
  }, [user, currentDate])

  const fetchScheduledWorkouts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setScheduledWorkouts(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load scheduled workouts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedWorkouts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setCompletedWorkouts(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load workout history",
        variant: "destructive"
      })
    }
  }

  const getWorkoutsForDate = (date: Date) => {
    return scheduledWorkouts.filter(workout => 
      isSameDay(new Date(workout.scheduled_date), date)
    )
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

  const markWorkoutCompleted = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ completed: true })
        .eq('id', workoutId)

      if (error) throw error

      setScheduledWorkouts(prev => 
        prev.map(w => w.id === workoutId ? { ...w, completed: true } : w)
      )

      toast({
        title: "Success!",
        description: "Workout marked as completed",
      })

      // Trigger regeneration of future workouts if this affects the plan
      await regenerateFutureWorkouts(workoutId)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark workout as completed",
        variant: "destructive"
      })
    }
  }

  const markWorkoutSkipped = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ skipped: true })
        .eq('id', workoutId)

      if (error) throw error

      setScheduledWorkouts(prev => 
        prev.map(w => w.id === workoutId ? { ...w, skipped: true } : w)
      )

      toast({
        title: "Workout Skipped",
        description: "Future workouts will be adjusted accordingly",
      })

      // Trigger regeneration of future workouts
      await regenerateFutureWorkouts(workoutId)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark workout as skipped",
        variant: "destructive"
      })
    }
  }

  const regenerateFutureWorkouts = async (changedWorkoutId: string) => {
    try {
      await supabase.functions.invoke('regenerate-future-workouts', {
        body: { changedWorkoutId }
      })
    } catch (error) {
      console.error('Failed to regenerate future workouts:', error)
    }
  }

  const generateWorkoutForDay = async (scheduledWorkout: ScheduledWorkout) => {
    try {
      // Get previous workouts for context
      const { data: previousWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('sport', scheduledWorkout.sport)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType: scheduledWorkout.workout_type,
          sport: scheduledWorkout.sport,
          sessionType: scheduledWorkout.workout_type,
          scheduledWorkoutId: scheduledWorkout.id,
          previousWorkouts: previousWorkouts || [],
          adaptToProgress: true,
          userPreferences: ""
        }
      })

      if (data?.workout) {
        // Update the scheduled workout with the generated workout ID
        await supabase
          .from('scheduled_workouts')
          .update({ workout_id: data.workout.id })
          .eq('id', scheduledWorkout.id)

        toast({
          title: "Workout Generated!",
          description: `${scheduledWorkout.title} is ready for today`,
        })

        fetchScheduledWorkouts() // Refresh the data
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate workout",
        variant: "destructive"
      })
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const selectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CalendarIcon className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Calendar & History</h2>
        </div>
        <p className="text-muted-foreground">
          View and manage your scheduled workouts and training history
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const dayWorkouts = getWorkoutsForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${isToday ? 'bg-primary/10' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                     {dayWorkouts.slice(0, 3).map((workout, index) => (
                       <div
                         key={workout.id}
                         className={`w-2 h-2 rounded-full inline-block mr-1 ${
                           workout.completed 
                             ? 'bg-green-500' 
                             : workout.skipped
                             ? 'bg-red-500'
                             : workout.sport === 'weightlifting' || workout.sport === 'strength_training'
                             ? 'bg-orange-500'
                             : workout.sport === 'swimming'
                             ? 'bg-blue-500'
                             : workout.sport === 'running'
                             ? 'bg-emerald-500'
                             : workout.sport === 'cycling'
                             ? 'bg-yellow-500'
                             : 'bg-purple-500'
                         }`}
                       />
                     ))}
                     {dayWorkouts.length > 3 && (
                       <div className="text-xs text-muted-foreground text-center">
                         +{dayWorkouts.length - 3}
                       </div>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && selectedDateWorkouts.length > 0 && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>
              Workouts for {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDateWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSportIcon(workout.sport)}</span>
                    <div>
                      <h4 className="font-medium">{workout.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {workout.session_time_of_day} • {workout.workout_type}
                      </p>
                    </div>
                    <Badge variant={
                      workout.completed ? "default" : 
                      workout.skipped ? "destructive" : 
                      "outline"
                    }>
                      {workout.completed ? "Completed" : 
                       workout.skipped ? "Skipped" : 
                       "Scheduled"}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    {!workout.completed && !workout.skipped && (
                      <>
                        {!workout.workout_id && (
                          <Button
                            size="sm"
                            onClick={() => generateWorkoutForDay(workout)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Generate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markWorkoutCompleted(workout.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markWorkoutSkipped(workout.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedWorkouts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No completed workouts yet. Start training to see your history!
                  </p>
                ) : (
                  completedWorkouts.map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSportIcon(workout.sport)}</span>
                        <div>
                          <h4 className="font-medium">{workout.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(workout.created_at), 'MMM d, yyyy')} • {workout.workout_type}
                            {workout.duration && ` • ${workout.duration} min`}
                          </p>
                          {workout.journal_entry && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{workout.journal_entry}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workout.feeling && (
                          <Badge variant="outline">
                            {workout.feeling}
                          </Badge>
                        )}
                        <Badge variant="default">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}