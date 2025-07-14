
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Target, Calendar, TrendingUp, Clock, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"

interface DashboardProps {
  onTabChange?: (tab: string, type?: string) => void
  setActiveTab: (tab: string) => void
}

export function Dashboard({ onTabChange, setActiveTab }: DashboardProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { profile, getSportInfo, hasProfile } = useSportProfile()
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const sportInfo = getSportInfo(profile.primarySport)


  useEffect(() => {
    const fetchOrGenerateTodayWorkouts = async () => {
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
        
        let workouts = data || []
        
        // If no workouts exist for today, auto-generate them
        if (workouts.length === 0) {
          // Generate training workout
          const { error: trainingError } = await supabase
            .from('scheduled_workouts')
            .insert({
              user_id: user.id,
              title: `${sportInfo.label} Training`,
              workout_type: 'training',
              sport: profile.primarySport,
              scheduled_date: today,
              session_time_of_day: 'morning'
            })

          // Generate strength workout if user trains multiple times per week
          if (profile.trainingFrequency >= 4) {
            const { error: strengthError } = await supabase
              .from('scheduled_workouts')
              .insert({
                user_id: user.id,
                title: 'Strength Training',
                workout_type: 'strength',
                sport: 'weightlifting',
                scheduled_date: today,
                session_time_of_day: 'evening'
              })
          }

          // Refetch after generation
          const { data: newData } = await supabase
            .from('scheduled_workouts')
            .select('*')
            .eq('user_id', user.id)
            .eq('scheduled_date', today)
            .order('workout_type', { ascending: true })
          
          workouts = newData || []
        }
        
        setTodayWorkouts(workouts)
      } catch (error) {
        console.error('Error fetching/generating today workouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrGenerateTodayWorkouts()
  }, [user, profile.primarySport, profile.trainingFrequency])

  const generateWorkoutForScheduled = async (scheduledWorkout: any) => {
    try {
      // Get user's sport profile for context
      const { data: sportProfile } = await supabase
        .from('user_sport_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('primary_sport', scheduledWorkout.sport)
        .single()

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
          userPreferences: "",
          fitnessLevel: sportProfile?.experience_level || 'intermediate',
          duration: sportProfile?.session_duration || 60
        }
      })

      if (data?.workout) {
        // Save the workout to the database first
        const { data: savedWorkout, error: saveError } = await supabase
          .from('workouts')
          .insert({
            user_id: user?.id,
            title: data.workout.title,
            description: `Generated ${scheduledWorkout.workout_type} workout`,
            workout_type: data.workout.type,
            sport: data.workout.sport,
            duration: parseInt(data.workout.duration) || 60,
            exercises: {
              warmup: data.workout.warmup || [],
              exercises: data.workout.exercises || [],
              cooldown: data.workout.cooldown || []
            }
          })
          .select()
          .single()

        if (saveError) throw saveError

        // Update the scheduled workout with the generated workout ID
        await supabase
          .from('scheduled_workouts')
          .update({ workout_id: savedWorkout.id })
          .eq('id', scheduledWorkout.id)
        
        toast({
          title: "Workout Generated!",
          description: `${scheduledWorkout.title} is ready for today`,
        })

        // Navigate to workouts tab and show the generated workout
        setActiveTab('workouts')
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('showWorkout', { detail: { workoutId: savedWorkout.id } }))
        }, 100)
        
        // Refresh the scheduled workouts to remove the "Generating..." state
        setTodayWorkouts(prev => prev.filter(w => w.id !== scheduledWorkout.id))
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate workout",
        variant: "destructive"
      })
    }
  }

  if (!hasProfile()) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full pulse-gradient flex items-center justify-center">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to PulseTrack</h2>
          <p className="text-muted-foreground mb-4">
            Get started by setting up your sport profile
          </p>
          <Button className="pulse-gradient text-white">
            Complete Profile Setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{sportInfo.icon}</span>
          <h2 className="text-2xl font-bold">{sportInfo.label} Training</h2>
        </div>
        <p className="text-muted-foreground mb-2">
          {profile.experienceLevel} • {profile.competitiveLevel} level
        </p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Training Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sessions Completed</span>
              <span>0 / {profile.trainingFrequency}</span>
            </div>
            <Progress value={0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Complete your first workout to start tracking progress
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Today's Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayWorkouts.map((workout) => {
            const isCompleted = workout.completed
            return (
              <div 
                key={workout.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  isCompleted 
                    ? 'bg-pulse-blue/10 border-pulse-blue/20 hover:bg-pulse-blue/20' 
                    : workout.workout_type === 'training' 
                      ? 'bg-pulse-blue/10 border-pulse-blue/20 hover:bg-pulse-blue/20'
                      : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
                }`}
                onClick={() => {
                  if (workout.workout_id) {
                    setActiveTab('workouts')
                    // Pass the workout ID to the workouts component
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('showWorkout', { detail: { workoutId: workout.workout_id } }))
                    }, 100)
                  } else {
                    toast({
                      title: "Generating Workout",
                      description: "Please wait while we generate your workout...",
                    })
                    
                    // Generate the workout and navigate to workouts tab
                    generateWorkoutForScheduled(workout)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                     isCompleted 
                       ? 'bg-pulse-blue/20' 
                       : workout.workout_type === 'training' 
                         ? 'bg-pulse-blue/20' 
                         : 'bg-orange-500/20'
                   }`}>
                     <Zap className={`h-5 w-5 ${
                       isCompleted 
                         ? 'text-green-100' 
                         : workout.workout_type === 'training' 
                           ? 'text-pulse-blue' 
                           : 'text-orange-500'
                     }`} />
                  </div>
                   <div>
                     <div className="font-medium">{workout.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(), 'EEEE')} • {workout.session_time_of_day || 'morning'} • {workout.sport}
                        {workout.workout_id ? ' • Workout Ready' : ' • Generating...'}
                      </div>
                   </div>
                </div>
                 <Badge className={
                   isCompleted 
                     ? 'bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30'
                     : workout.workout_type === 'training' 
                       ? 'bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30'
                       : 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                  }>
                   {isCompleted ? 'Completed ✓' : workout.workout_id ? 'Ready' : 'Generating...'}
                 </Badge>
              </div>
            )
          })}
          
          {todayWorkouts.length === 0 && !loading && (
            <>
              <div 
                className="flex items-center justify-between p-3 rounded-lg bg-pulse-blue/10 border border-pulse-blue/20 cursor-pointer hover:bg-pulse-blue/20 transition-colors"
                onClick={() => onTabChange?.('workouts', 'training')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pulse-blue/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-pulse-blue" />
                  </div>
                  <div>
                    <div className="font-medium">{sportInfo.label} Session</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.sessionDuration} minutes • Generate new
                    </div>
                  </div>
                </div>
                <Badge className="bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30">
                  Generate
                </Badge>
              </div>
              
              <div 
                className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
                onClick={() => onTabChange?.('workouts', 'strength')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-medium">Strength Training</div>
                    <div className="text-sm text-muted-foreground">
                      45 minutes • Generate new
                    </div>
                  </div>
                </div>
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                  Generate
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Plan & Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="flex flex-col items-center justify-center p-6 rounded-lg bg-pulse-blue/10 border border-pulse-blue/20 cursor-pointer hover:bg-pulse-blue/20 transition-colors"
              onClick={() => onTabChange?.('workouts', 'calendar')}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-pulse-blue/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-pulse-blue" />
              </div>
              <h3 className="font-medium mb-1">Workout Calendar</h3>
              <p className="text-xs text-muted-foreground text-center">
                View and schedule your workouts
              </p>
            </div>
            
            <div 
              className="flex flex-col items-center justify-center p-6 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
              onClick={() => onTabChange?.('workouts', 'plan')}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-medium mb-1">Monthly Plan</h3>
              <p className="text-xs text-muted-foreground text-center">
                Generate a training schedule
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.currentGoals && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profile.currentGoals}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
