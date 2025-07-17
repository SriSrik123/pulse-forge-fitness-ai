
import React, { useState, useEffect } from 'react'
import { format, isToday, startOfDay } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Flame, Trophy, Target, Calendar, Clock, ChevronRight, Play, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Exercise {
  name: string
  sets?: number
  reps?: number
  duration?: number
  rest?: number
  weight?: number
  distance?: number
  instructions?: string
}

interface Workout {
  id: string
  title: string
  description?: string
  sport: string
  workout_type: string
  duration?: number
  exercises: Exercise[]
  equipment?: any
  feeling?: string
  journal_entry?: string
  user_id: string
}

interface ScheduledWorkout {
  id: string
  title: string
  sport: string
  workout_type: string
  scheduled_date: string
  session_time_of_day?: string
  completed?: boolean
  skipped?: boolean
  plan_id?: string
  workout_id?: string
  user_id: string
  created_at: string
  updated_at: string
  workout?: Workout
}

interface DashboardProps {
  onTabChange: (tab: string, type?: string) => void
  setActiveTab: (tab: string) => void
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange, setActiveTab }) => {
  const { user } = useAuth()
  const [todaysWorkouts, setTodaysWorkouts] = useState<ScheduledWorkout[]>([])
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0)
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 7 })
  const [streakCount, setStreakCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      // Fetch today's scheduled workouts with related workout data
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_workouts')
        .select(`
          *,
          workout:workouts(*)
        `)
        .eq('user_id', user?.id)
        .eq('scheduled_date', today)

      if (scheduledError) throw scheduledError

      // Transform the data to match our types
      const transformedScheduled = (scheduledData || []).map(item => ({
        ...item,
        workout: item.workout ? {
          ...item.workout,
          exercises: Array.isArray(item.workout.exercises) 
            ? item.workout.exercises 
            : typeof item.workout.exercises === 'string' 
              ? JSON.parse(item.workout.exercises)
              : []
        } : undefined
      })) as ScheduledWorkout[]

      setTodaysWorkouts(transformedScheduled)

      // Fetch recent workouts
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (workoutError) throw workoutError

      // Transform workout data
      const transformedWorkouts = (workoutData || []).map(workout => ({
        ...workout,
        exercises: Array.isArray(workout.exercises) 
          ? workout.exercises 
          : typeof workout.exercises === 'string' 
            ? JSON.parse(workout.exercises)
            : []
      })) as Workout[]

      setRecentWorkouts(transformedWorkouts)

      // Calculate weekly progress and streak
      await calculateWeeklyProgress()
      await calculateStreak()

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeklyProgress = async () => {
    try {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('completed')
        .eq('user_id', user?.id)
        .gte('scheduled_date', format(startOfWeek, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endOfWeek, 'yyyy-MM-dd'))

      if (error) throw error

      const completed = data?.filter(w => w.completed).length || 0
      const total = data?.length || 0

      setWeeklyProgress({ completed, total: Math.max(total, 7) })
    } catch (error) {
      console.error('Error calculating weekly progress:', error)
    }
  }

  const calculateStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('scheduled_date, completed')
        .eq('user_id', user?.id)
        .eq('completed', true)
        .order('scheduled_date', { ascending: false })
        .limit(30)

      if (error) throw error

      let streak = 0
      const today = startOfDay(new Date())
      
      if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const workoutDate = startOfDay(new Date(data[i].scheduled_date))
          const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff === streak) {
            streak++
          } else {
            break
          }
        }
      }

      setStreakCount(streak)
    } catch (error) {
      console.error('Error calculating streak:', error)
    }
  }

  const markWorkoutComplete = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ completed: true })
        .eq('id', workoutId)

      if (error) throw error

      // Update local state
      setTodaysWorkouts(prev => 
        prev.map(w => w.id === workoutId ? { ...w, completed: true } : w)
      )

      toast({
        title: "Workout Completed!",
        description: "Great job finishing your workout!",
      })

      // Refresh dashboard data
      await fetchDashboardData()
    } catch (error) {
      console.error('Error marking workout complete:', error)
      toast({
        title: "Error",
        description: "Failed to mark workout as complete",
        variant: "destructive",
      })
    }
  }

  const startWorkout = (workout: ScheduledWorkout | Workout) => {
    // Navigate to workout view
    if ('scheduled_date' in workout) {
      // It's a scheduled workout
      onTabChange('workouts', workout.workout_type)
    } else {
      // It's a regular workout
      onTabChange('workouts', workout.workout_type)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    )
  }

  const selectedWorkout = todaysWorkouts[selectedWorkoutIndex]
  const progressPercentage = weeklyProgress.total > 0 ? (weeklyProgress.completed / weeklyProgress.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">Here's your fitness overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pulse-blue/20 to-pulse-blue/10 border-pulse-blue/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-pulse-blue" />
              <div>
                <p className="text-2xl font-bold text-foreground">{streakCount}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pulse-green/20 to-pulse-green/10 border-pulse-green/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-pulse-green" />
              <div>
                <p className="text-2xl font-bold text-foreground">{weeklyProgress.completed}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pulse-purple/20 to-pulse-purple/10 border-pulse-purple/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-pulse-purple" />
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(progressPercentage)}%</p>
                <p className="text-xs text-muted-foreground">Weekly Goal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pulse-orange/20 to-pulse-orange/10 border-pulse-orange/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-pulse-orange" />
              <div>
                <p className="text-2xl font-bold text-foreground">{todaysWorkouts.length}</p>
                <p className="text-xs text-muted-foreground">Today's Plan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Today's Workout</CardTitle>
            {todaysWorkouts.length > 1 && (
              <Select 
                value={selectedWorkoutIndex.toString()} 
                onValueChange={(value) => setSelectedWorkoutIndex(parseInt(value))}
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {todaysWorkouts.map((workout, index) => (
                    <SelectItem key={workout.id} value={index.toString()}>
                      {workout.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedWorkout ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{selectedWorkout.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="capitalize">{selectedWorkout.sport}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedWorkout.workout_type.replace('_', ' ')}</span>
                    {selectedWorkout.session_time_of_day && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{selectedWorkout.session_time_of_day}</span>
                      </>
                    )}
                  </div>
                  {selectedWorkout.workout?.duration && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{selectedWorkout.workout.duration} minutes</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {selectedWorkout.completed ? (
                    <Badge variant="secondary" className="bg-pulse-green/20 text-pulse-green">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => startWorkout(selectedWorkout)}
                        className="bg-pulse-blue hover:bg-pulse-blue/80"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markWorkoutComplete(selectedWorkout.id)}
                      >
                        Mark Done
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {selectedWorkout.workout?.exercises && selectedWorkout.workout.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Exercises:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedWorkout.workout.exercises.slice(0, 4).map((exercise, index) => (
                      <div key={index} className="text-sm text-muted-foreground p-2 rounded bg-muted/50">
                        {exercise.name}
                        {(exercise.sets || exercise.reps) && (
                          <span className="ml-2 text-xs">
                            {exercise.sets && `${exercise.sets} sets`}
                            {exercise.sets && exercise.reps && ' × '}
                            {exercise.reps && `${exercise.reps} reps`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedWorkout.workout.exercises.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      +{selectedWorkout.workout.exercises.length - 4} more exercises
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No workouts scheduled for today</p>
              <Button onClick={() => onTabChange('generate')} className="bg-pulse-blue hover:bg-pulse-blue/80">
                Generate Workout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Workouts completed</span>
              <span className="font-medium">{weeklyProgress.completed}/{weeklyProgress.total}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Workouts</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onTabChange('workouts')}
            className="text-pulse-blue hover:text-pulse-blue/80"
          >
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((workout, index) => (
                <div key={workout.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{workout.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span className="capitalize">{workout.sport}</span>
                      <span>•</span>
                      <span className="capitalize">{workout.workout_type.replace('_', ' ')}</span>
                      {workout.duration && (
                        <>
                          <span>•</span>
                          <span>{workout.duration} min</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startWorkout(workout)}
                    className="text-pulse-blue hover:text-pulse-blue/80"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-2">No recent workouts</p>
              <Button size="sm" onClick={() => onTabChange('generate')} className="bg-pulse-blue hover:bg-pulse-blue/80">
                Generate Your First Workout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
