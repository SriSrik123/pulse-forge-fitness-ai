import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Play, X, Check, History, Plus, Trophy } from "lucide-react"
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

interface ScheduledEvent {
  id: string
  title: string
  event_type: string
  sport: string
  scheduled_date: string
  scheduled_time: string | null
  location: string | null
  opponent: string | null
  notes: string | null
  result: string | null
  performance_data: any
}

export function WorkoutCalendar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateCompletedWorkouts, setSelectedDateCompletedWorkouts] = useState<CompletedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '',
    event_type: 'game',
    sport: '',
    scheduled_date: '',
    scheduled_time: '',
    location: '',
    opponent: '',
    notes: ''
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    if (user) {
      fetchScheduledWorkouts()
      fetchScheduledEvents()
      fetchCompletedWorkouts()
    }
  }, [user, currentDate])

  useEffect(() => {
    if (selectedDate && user) {
      fetchCompletedWorkoutsForDate(selectedDate)
    }
  }, [selectedDate, user])

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

  const fetchScheduledEvents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('scheduled_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setScheduledEvents(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load scheduled events",
        variant: "destructive"
      })
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

  const fetchCompletedWorkoutsForDate = async (date: Date) => {
    if (!user) return

    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSelectedDateCompletedWorkouts(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load completed workouts for date",
        variant: "destructive"
      })
    }
  }

  const getWorkoutsForDate = (date: Date) => {
    return scheduledWorkouts.filter(workout => 
      isSameDay(new Date(workout.scheduled_date), date)
    )
  }

  const getEventsForDate = (date: Date) => {
    return scheduledEvents.filter(event => 
      isSameDay(new Date(event.scheduled_date), date)
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

  const createEvent = async () => {
    if (!user || !eventForm.title || !eventForm.sport || !eventForm.scheduled_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('scheduled_events')
        .insert({
          user_id: user.id,
          ...eventForm
        })

      if (error) throw error

      toast({
        title: "Success!",
        description: "Event added to calendar",
      })

      setShowEventDialog(false)
      setEventForm({
        title: '',
        event_type: 'game',
        sport: '',
        scheduled_date: '',
        scheduled_time: '',
        location: '',
        opponent: '',
        notes: ''
      })
      fetchScheduledEvents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      })
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const selectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : []
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CalendarIcon className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>
        <p className="text-muted-foreground">
          View and manage your scheduled workouts and see your training history
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Game/Meet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="vs Team Name / Regional Meet"
                        value={eventForm.title}
                        onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_type">Type</Label>
                      <Select value={eventForm.event_type} onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="game">Game</SelectItem>
                          <SelectItem value="meet">Meet</SelectItem>
                          <SelectItem value="tournament">Tournament</SelectItem>
                          <SelectItem value="competition">Competition</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sport">Sport *</Label>
                      <Select value={eventForm.sport} onValueChange={(value) => setEventForm(prev => ({ ...prev, sport: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soccer">Soccer</SelectItem>
                          <SelectItem value="basketball">Basketball</SelectItem>
                          <SelectItem value="tennis">Tennis</SelectItem>
                          <SelectItem value="swimming">Swimming</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="cycling">Cycling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventForm.scheduled_date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={eventForm.scheduled_time}
                          onChange={(e) => setEventForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="opponent">Opponent/Event Name</Label>
                      <Input
                        id="opponent"
                        placeholder="Team Name / Event Name"
                        value={eventForm.opponent}
                        onChange={(e) => setEventForm(prev => ({ ...prev, opponent: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Stadium, Pool, Track"
                        value={eventForm.location}
                        onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes..."
                        value={eventForm.notes}
                        onChange={(e) => setEventForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                    <Button onClick={createEvent} className="w-full">
                      Add Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
              const dayEvents = getEventsForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all relative
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${isToday ? 'bg-primary/10' : 'hover:bg-muted/50'}
                    ${dayWorkouts.length > 0 && dayWorkouts.every(w => w.completed) ? 'bg-green-500/20 border-green-500/30' : ''}
                    ${dayEvents.length > 0 ? 'border-l-4 border-l-yellow-500' : ''}
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                     {dayEvents.slice(0, 1).map((event) => (
                       <div
                         key={event.id}
                         className="flex items-center text-xs"
                       >
                         <Trophy className="h-3 w-3 text-yellow-600 mr-1" />
                         <span className="truncate text-yellow-700 font-medium">
                           {event.event_type}
                         </span>
                       </div>
                     ))}
                     {dayWorkouts.slice(0, 2).map((workout, index) => (
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
                     {(dayWorkouts.length + dayEvents.length) > 3 && (
                       <div className="text-xs text-muted-foreground text-center">
                         +{(dayWorkouts.length + dayEvents.length) - 3}
                       </div>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (selectedDateCompletedWorkouts.length > 0 || selectedDateWorkouts.length > 0 || selectedDateEvents.length > 0) && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedDateEvents.length > 0 && (
                <div>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    Games & Events
                  </h5>
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h6 className="font-medium">{event.title}</h6>
                            <p className="text-sm text-muted-foreground">
                              {event.event_type} • {event.sport}
                              {event.scheduled_time && ` • ${event.scheduled_time}`}
                              {event.opponent && ` • vs ${event.opponent}`}
                              {event.location && ` • ${event.location}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-yellow-600 text-yellow-700">
                            {event.event_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateWorkouts.length > 0 && (
                <div>
                  <h5 className="font-medium mb-3">Scheduled Sessions</h5>
                  <div className="space-y-3">
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
                </div>
              )}

              {selectedDateCompletedWorkouts.length > 0 && (
                <div>
                  <h5 className="font-medium mb-3">Completed Workouts</h5>
                  <div className="space-y-3">
                    {selectedDateCompletedWorkouts.map((workout) => (
                      <div key={workout.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getSportIcon(workout.sport)}</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{workout.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(workout.created_at), 'h:mm a')} • {workout.workout_type}
                              {workout.duration && ` • ${workout.duration} min`}
                            </p>
                          </div>
                         {workout.feeling && (
                           <div className="flex items-center gap-2">
                             <span className="text-2xl">
                               {workout.feeling === 'very-bad' ? '😫' : 
                                workout.feeling === 'bad' ? '😕' : 
                                workout.feeling === 'okay' ? '😐' : 
                                workout.feeling === 'good' ? '😊' : 
                                workout.feeling === 'great' ? '🤩' : '😐'}
                             </span>
                             <Badge variant="outline" className="bg-white text-xs capitalize">
                               {workout.feeling.replace('-', ' ')}
                             </Badge>
                           </div>
                         )}
                        </div>
                        {workout.journal_entry && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <p className="text-sm italic">"{workout.journal_entry}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  )
}