import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Activity, Clock, Target, Zap, Play, Edit3, Save, X, Download, Printer, Info } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useToast } from "@/hooks/use-toast"
import { SmartwatchDataEntry } from "./SmartwatchDataEntry"

interface Exercise {
  name: string
  sets: string
  reps: string
  rest?: string
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

interface WorkoutViewerProps {
  workoutType?: string | null;
}

export function WorkoutViewer({ workoutType }: WorkoutViewerProps = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { profile, getSportInfo } = useSportProfile()
  
  const [workout, setWorkout] = useState<WorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingExercise, setEditingExercise] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [contextText, setContextText] = useState("")
  const [showSmartwatchEntry, setShowSmartwatchEntry] = useState(false)
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null)

  useEffect(() => {
    loadTodaysWorkout()
  }, [workoutType])

  const loadTodaysWorkout = async () => {
    if (!user) return

    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Determine the workout type mapping
      const workoutTypeForQuery = workoutType === 'strength' ? 'strength' : 
                                 workoutType === 'training' ? 'training' : 'training'
      
      console.log('Loading workout for type:', workoutType, 'mapped to:', workoutTypeForQuery)
      
      // First try to get scheduled workout for today
      const { data: scheduledWorkout } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .eq('workout_type', workoutTypeForQuery)
        .maybeSingle()

      console.log('Found scheduled workout:', scheduledWorkout)

      if (scheduledWorkout) {
        // Generate the actual workout content
        await generateWorkoutFromScheduled(scheduledWorkout)
      } else {
        // Fallback to generating new workout
        await generateWorkout()
      }
    } catch (error: any) {
      console.error('Error loading workout:', error)
      await generateWorkout()
    } finally {
      setLoading(false)
    }
  }

  const generateWorkoutFromScheduled = async (scheduledWorkout: any) => {
    try {
      // Use the scheduled workout's sport and type directly
      const sport = scheduledWorkout.sport
      const sessionType = scheduledWorkout.workout_type
      
      console.log('Generating workout from scheduled:', { sport, sessionType, scheduledWorkout })
      
      // Get previous workouts for context
      const { data: previousWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('sport', sport)
        .order('created_at', { ascending: false })
        .limit(5)

      // Generate context text
      if (previousWorkouts && previousWorkouts.length > 0) {
        const lastWorkout = previousWorkouts[0]
        const lastWorkoutType = lastWorkout.workout_type === 'strength' ? 'strength training' : lastWorkout.sport
        const focusArea = getWorkoutFocus(lastWorkout)
        const todayFocus = getTodayFocus(workoutType, sport)
        
        setContextText(`Yesterday you did a ${lastWorkoutType} session focused on ${focusArea}, so today you should do ${sessionType} and focus on ${todayFocus}.`)
      }

      const { data } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType: sessionType,
          sport: sport,
          sessionType: sessionType,
          fitnessLevel: profile.experienceLevel,
          duration: workoutType === 'strength' ? 45 : profile.sessionDuration,
          equipment: [],
          sportEquipmentList: getEquipmentList(sport),
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
        description: "Failed to load scheduled workout",
        variant: "destructive"
      })
    }
  }

  const saveWorkoutAndMarkComplete = async () => {
    if (!user || !workout) return

    setSaving(true)
    try {
      // Save workout to database
      const { data: savedWorkout, error: saveError } = await supabase
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
        .select()
        .single()

      if (saveError) throw saveError
      
      // Store the workout ID for potential smartwatch data entry
      if (savedWorkout) {
        setCurrentWorkoutId(savedWorkout.id)
      }

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

      // Check if smartwatch is enabled
      const smartwatchEnabled = localStorage.getItem('smartwatch-enabled')
      if (smartwatchEnabled === 'true') {
        setShowSmartwatchEntry(true)
      } else {
        // Navigate back to home
        window.location.href = '/'
      }
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
          sportEquipmentList: getEquipmentList(sport),
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

  const getWorkoutFocus = (workout: any) => {
    if (workout.workout_type === 'strength') return 'building strength and muscle'
    if (workout.sport === 'swimming') return 'technique and endurance'
    if (workout.sport === 'running') return 'speed and endurance'
    if (workout.sport === 'cycling') return 'power and endurance'
    return 'skill development'
  }

  const getTodayFocus = (workoutType: string, sport: string) => {
    if (workoutType === 'strength') return 'progressive overload and compound movements'
    if (sport === 'swimming') return 'stroke efficiency and conditioning'
    if (sport === 'running') return 'form and pacing'
    if (sport === 'cycling') return 'cadence and power'
    return 'technique refinement'
  }

  const getEquipmentList = (sport: string) => {
    const equipmentMap: Record<string, string[]> = {
      swimming: ['pool', 'kickboard', 'pull buoy', 'fins', 'paddles', 'diving boards'],
      running: ['treadmill', 'track', 'timer', 'cones'],
      cycling: ['bike', 'trainer', 'power meter', 'computer'],
      weightlifting: ['barbell', 'dumbbells', 'plates', 'bench', 'rack', 'cables'],
      basketball: ['ball', 'hoop', 'cones', 'agility ladder'],
      tennis: ['racket', 'balls', 'net', 'court', 'cones'],
      soccer: ['ball', 'goals', 'cones', 'field']
    }
    return equipmentMap[sport] || []
  }

  const downloadWorkout = () => {
    if (!workout) return
    
    const workoutText = `
${workout.title}
Duration: ${workout.duration} minutes
Type: ${workout.type}
Sport: ${workout.sport}

${contextText ? `Context: ${contextText}\n` : ''}

WARM-UP:
${workout.warmup.map((item, i) => `${i + 1}. ${item}`).join('\n')}

MAIN WORKOUT:
${workout.exercises.map((ex, i) => `${i + 1}. ${ex.name} - ${ex.sets} sets x ${ex.reps} reps (Rest: ${ex.rest || '60s'})\n   ${ex.description || ''}`).join('\n\n')}

COOL-DOWN:
${workout.cooldown.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Generated by PulseTrack AI
    `.trim()

    const blob = new Blob([workoutText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workout.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Workout Downloaded",
      description: "Your workout has been saved as a text file.",
    })
  }

  const printWorkout = () => {
    if (!workout) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const workoutHtml = `
      <html>
        <head>
          <title>${workout.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #ddd; }
            h2 { color: #555; margin-top: 30px; }
            .exercise { margin: 15px 0; padding: 10px; border-left: 3px solid #007bff; }
            .context { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${workout.title}</h1>
          <p><strong>Duration:</strong> ${workout.duration} minutes | <strong>Type:</strong> ${workout.type} | <strong>Sport:</strong> ${workout.sport}</p>
          
          ${contextText ? `<div class="context"><strong>Context:</strong> ${contextText}</div>` : ''}
          
          <h2>Warm-up</h2>
          <ol>
            ${workout.warmup.map(item => `<li>${item}</li>`).join('')}
          </ol>
          
          <h2>Main Workout</h2>
          ${workout.exercises.map(ex => `
            <div class="exercise">
              <strong>${ex.name}</strong><br>
              ${ex.sets} sets × ${ex.reps} reps (Rest: ${ex.rest || '60s'})<br>
              ${ex.description ? `<em>${ex.description}</em>` : ''}
            </div>
          `).join('')}
          
          <h2>Cool-down</h2>
          <ol>
            ${workout.cooldown.map(item => `<li>${item}</li>`).join('')}
          </ol>
          
          <p style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">Generated by PulseTrack AI</p>
        </body>
      </html>
    `
    
    printWindow.document.write(workoutHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
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

  // Show smartwatch data entry if enabled and workout is completed
  if (showSmartwatchEntry) {
    return (
      <SmartwatchDataEntry
        workoutId={currentWorkoutId || undefined}
        onClose={() => {
          setShowSmartwatchEntry(false)
          window.location.href = '/'
        }}
      />
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
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge className="bg-pulse-blue/20 text-pulse-blue">
            {workout.type}
          </Badge>
          <Badge className="bg-pulse-green/20 text-pulse-green">
            AI Generated
          </Badge>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={downloadWorkout}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={printWorkout}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Context Section */}
      {contextText && (
        <Card className="glass border-0 bg-blue-50/50 border-blue-200/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">{contextText}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
        <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="p-4 bg-muted/20 rounded-lg space-y-3 min-h-fit">
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