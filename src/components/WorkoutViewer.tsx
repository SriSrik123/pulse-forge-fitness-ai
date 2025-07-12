import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Activity, Clock, Target, Zap, Play, Edit3, Save, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "react-router-dom"

interface Exercise {
  name: string
  sets: string
  reps: string
  description?: string
}

interface WorkoutData {
  title: string
  type: string
  sport: string
  duration: number
  warmup: string[]
  exercises: Exercise[]
  cooldown: string[]
}

export function WorkoutViewer() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { profile, getSportInfo } = useSportProfile()
  const [searchParams] = useSearchParams()
  const workoutType = searchParams.get('type')
  
  const [workout, setWorkout] = useState<WorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingExercise, setEditingExercise] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    generateWorkout()
  }, [workoutType])

  const generateWorkout = async () => {
    if (!user) return

    setLoading(true)
    try {
      const sport = workoutType === 'strength' ? 'weightlifting' : profile.primarySport
      const sessionType = workoutType === 'strength' ? 'strength' : 'training'
      
      // Get previous workouts for context
      const { data: previousWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('sport', sport)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType: sessionType,
          sport: sport,
          sessionType: sessionType,
          fitnessLevel: profile.experienceLevel,
          duration: workoutType === 'strength' ? 45 : profile.sessionDuration,
          equipment: [],
          sportEquipmentList: [],
          goals: `Improve ${sport} performance`,
          previousWorkouts: previousWorkouts || [],
          adaptToProgress: true
        }
      })

      if (data?.workout) {
        setWorkout(data.workout)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate workout",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveWorkoutAndMarkComplete = async () => {
    if (!user || !workout) return

    setSaving(true)
    try {
      // Save workout to database
      const { error: saveError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          title: workout.title,
          description: `${workout.type} workout for ${workout.sport}`,
          workout_type: workout.type,
          sport: workout.sport,
          duration: workout.duration,
          equipment: {},
          exercises: { exercises: workout.exercises, warmup: workout.warmup, cooldown: workout.cooldown } as any,
          completed: true
        })

      if (saveError) throw saveError

      // Update scheduled workout if it exists
      const today = new Date().toISOString().split('T')[0]
      const { error: updateError } = await supabase
        .from('scheduled_workouts')
        .update({ completed: true })
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .eq('workout_type', workout.type)

      if (updateError) console.warn('No scheduled workout to update')

      toast({
        title: "Workout Completed! 🎉",
        description: "Great job! Your workout has been saved.",
      })

      // Navigate back to home
      window.location.href = '/'
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workout",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    if (!workout) return
    
    const updatedExercises = [...workout.exercises]
    updatedExercises[index] = { ...updatedExercises[index], [field]: value }
    setWorkout({ ...workout, exercises: updatedExercises })
  }

  const updateWarmup = (index: number, value: string) => {
    if (!workout) return
    
    const updatedWarmup = [...workout.warmup]
    updatedWarmup[index] = value
    setWorkout({ ...workout, warmup: updatedWarmup })
  }

  const updateCooldown = (index: number, value: string) => {
    if (!workout) return
    
    const updatedCooldown = [...workout.cooldown]
    updatedCooldown[index] = value
    setWorkout({ ...workout, cooldown: updatedCooldown })
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Generating your workout...</p>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <p>Failed to generate workout. Please try again.</p>
          <Button onClick={generateWorkout} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const sportInfo = getSportInfo(workout.sport)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{sportInfo.icon}</span>
          <h2 className="text-2xl font-bold">{workout.title}</h2>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-pulse-blue/20 text-pulse-blue">
            {workout.type}
          </Badge>
          <Badge className="bg-pulse-green/20 text-pulse-green">
            AI Generated
          </Badge>
        </div>
      </div>

      {/* Warm-up Section */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-yellow-500" />
            Warm-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workout.warmup.map((item, index) => (
            <div key={index} className="p-3 bg-muted/20 rounded-lg">
              <Textarea
                value={item}
                onChange={(e) => updateWarmup(index, e.target.value)}
                className="min-h-[60px] border-0 bg-transparent resize-none"
                placeholder="Warm-up exercise..."
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main Workout Section */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-pulse-blue" />
            Main Workout
            <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
              <Clock className="h-4 w-4" />
              {workout.duration} min
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="p-4 bg-muted/20 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Exercise</label>
                  <Input
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    className="border-0 bg-background/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sets</label>
                  <Input
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                    className="border-0 bg-background/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Reps</label>
                  <Input
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    className="border-0 bg-background/50"
                  />
                </div>
              </div>
              {exercise.description && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <Textarea
                    value={exercise.description}
                    onChange={(e) => updateExercise(index, 'description', e.target.value)}
                    className="min-h-[60px] border-0 bg-background/50 resize-none"
                    placeholder="Exercise notes..."
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cool-down Section */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Cool-down
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workout.cooldown.map((item, index) => (
            <div key={index} className="p-3 bg-muted/20 rounded-lg">
              <Textarea
                value={item}
                onChange={(e) => updateCooldown(index, e.target.value)}
                className="min-h-[60px] border-0 bg-transparent resize-none"
                placeholder="Cool-down exercise..."
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={saveWorkoutAndMarkComplete}
          disabled={saving}
          className="flex-1 pulse-gradient text-white font-semibold"
        >
          {saving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Mark as Done
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Skip Workout
        </Button>
      </div>
    </div>
  )
}