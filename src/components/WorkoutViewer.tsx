
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Clock, Target, Zap, Play, Edit3, Save, X, Download, Printer, Info, RotateCcw, HelpCircle, Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useToast } from "@/hooks/use-toast"
import { SmartwatchDataEntry } from "./SmartwatchDataEntry"
import { WorkoutFeedback } from "./WorkoutFeedback"
import { WorkoutQuestions } from "./WorkoutQuestions"
import { WorkoutCompletion } from "./WorkoutCompletion"
import { WorkoutExecution } from "./WorkoutExecution"
import { WorkoutPerformanceHistory } from "./WorkoutPerformanceHistory"
import { format } from "date-fns"

interface Exercise {
  name: string
  sets: string
  reps: string
  rest?: string
  interval?: string
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
  workoutId?: string | null;
  generatedWorkoutData?: WorkoutData | null;
}

export function WorkoutViewer({ workoutType, workoutId, generatedWorkoutData }: WorkoutViewerProps = {}) {
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
  const [currentScheduledWorkoutId, setCurrentScheduledWorkoutId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [allScheduledWorkouts, setAllScheduledWorkouts] = useState<any[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([])
  const [selectedWorkoutFromDropdown, setSelectedWorkoutFromDropdown] = useState<string>("")

  useEffect(() => {
    console.log('WorkoutViewer useEffect triggered:', { workoutId, workoutType, selectedDate, generatedWorkoutData })
    
    // If we have generated workout data, use it directly and persist it
    if (generatedWorkoutData) {
      console.log('Using generated workout data:', generatedWorkoutData)
      setWorkout(generatedWorkoutData)
      setLoading(false)
      setTodayWorkouts([]) // Clear scheduled workouts when showing generated workout
      return
    }
    
    // If we already have a workout loaded and it's not from parameters, don't reload
    if (workout && !workoutId && !generatedWorkoutData && currentWorkoutId) {
      console.log('Already have workout loaded, not reloading')
      return
    }
    
    if (workoutId) {
      console.log('Loading existing workout:', workoutId)
      loadExistingWorkout(workoutId)
    } else {
      console.log('Loading scheduled workouts for date:', selectedDate)
      loadScheduledWorkouts()
    }
  }, [workoutType, workoutId, selectedDate, generatedWorkoutData])

  // Listen for workout selection events
  useEffect(() => {
    const handleShowWorkout = (event: CustomEvent) => {
      console.log('Show workout event received:', event.detail)
      const { workoutId: eventWorkoutId } = event.detail
      if (eventWorkoutId) {
        loadExistingWorkout(eventWorkoutId)
      }
    }

    window.addEventListener('showWorkout', handleShowWorkout as EventListener)
    return () => {
      window.removeEventListener('showWorkout', handleShowWorkout as EventListener)
    }
  }, [])

  const loadScheduledWorkouts = async () => {
    if (!user) return

    console.log('Loading scheduled workouts for user:', user.id, 'date:', selectedDate)
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      // Get scheduled workouts for the selected date
      const { data: scheduledWorkouts, error } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', dateStr)
        .order('workout_type', { ascending: true })

      console.log('Scheduled workouts loaded:', scheduledWorkouts, error)

      if (error) throw error
      
      setTodayWorkouts(scheduledWorkouts || [])
      
      // Load available workouts for dropdown
      await loadAvailableWorkouts()
      
      // If there's a completed workout, load the first one automatically
      const completedWorkout = scheduledWorkouts?.find(w => w.workout_id)
      if (completedWorkout && completedWorkout.workout_id) {
        console.log('Auto-loading completed workout:', completedWorkout.workout_id)
        await loadExistingWorkout(completedWorkout.workout_id)
        return
      }
      
      // If no workouts exist, show empty state
      setWorkout(null)
    } catch (error: any) {
      console.error('Error loading scheduled workouts:', error)
      toast({
        title: "Error",
        description: "Failed to load scheduled workouts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableWorkouts = async () => {
    if (!user) return

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      // Get all scheduled workouts for today (both generated and not generated)
      const { data: scheduledWorkouts, error } = await supabase
        .from('scheduled_workouts')
        .select('id, title, workout_type, sport, workout_id')
        .eq('user_id', user.id)
        .eq('scheduled_date', dateStr)
        .order('workout_type', { ascending: true })

      if (error) throw error
      
      setAvailableWorkouts(scheduledWorkouts || [])
    } catch (error: any) {
      console.error('Error loading available workouts:', error)
    }
  }

  const handleWorkoutSelection = async (selectedId: string) => {
    setSelectedWorkoutFromDropdown(selectedId)
    if (!selectedId) return
    
    // Find the selected scheduled workout
    const selectedScheduledWorkout = availableWorkouts.find(w => w.id === selectedId)
    if (!selectedScheduledWorkout) return
    
    if (selectedScheduledWorkout.workout_id) {
      // Already generated, just load it
      await loadExistingWorkout(selectedScheduledWorkout.workout_id)
    } else {
      // Not generated yet, generate it now
      await handleTodayWorkoutClick(selectedScheduledWorkout)
    }
  }

  const loadExistingWorkout = async (id: string) => {
    if (!user) return

    console.log('Loading existing workout:', id)
    setLoading(true)
    try {
      const { data: existingWorkout, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single()
        
      console.log('Existing workout loaded:', existingWorkout, error)
      
      if (error) throw error
      
      if (existingWorkout) {
        setCurrentWorkoutId(existingWorkout.id)
        // Convert existing workout to expected format
        const exercises = existingWorkout.exercises as any
        const workoutData: WorkoutData = {
          title: existingWorkout.title,
          type: existingWorkout.workout_type,
          sport: existingWorkout.sport,
          duration: existingWorkout.duration || 60,
          warmup: exercises?.warmup || [],
          exercises: exercises?.exercises || [],
          cooldown: exercises?.cooldown || []
        }
        
        console.log('Setting workout data:', workoutData)
        setWorkout(workoutData)
        
        // Check if workout is liked
        await checkIfLiked(id)
      }
    } catch (error: any) {
      console.error('Error loading existing workout:', error)
      toast({
        title: "Error",
        description: "Failed to load workout",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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

  const handleTodayWorkoutClick = async (scheduledWorkout: any) => {
    console.log('Today workout clicked:', scheduledWorkout)
    
    if (scheduledWorkout.workout_id) {
      // Load existing workout
      console.log('Loading existing workout from scheduled:', scheduledWorkout.workout_id)
      await loadExistingWorkout(scheduledWorkout.workout_id)
      setCurrentScheduledWorkoutId(scheduledWorkout.id)
    } else {
      // Generate new workout
      console.log('Generating new workout for scheduled workout:', scheduledWorkout.id)
      setLoading(true)
      toast({
        title: "Generating Workout",
        description: "Please wait while we generate your workout...",
      })
      
      try {
        // Get previous workouts for context
        const { data: previousWorkouts } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('sport', scheduledWorkout.sport)
          .order('created_at', { ascending: false })
          .limit(5)

        const { data, error } = await supabase.functions.invoke('generate-workout', {
          body: {
            workoutType: scheduledWorkout.workout_type,
            sport: scheduledWorkout.sport,
            sessionType: scheduledWorkout.workout_type,
            fitnessLevel: profile.experienceLevel || 'intermediate',
            duration: profile.sessionDuration || 60,
            equipment: [],
            sportEquipmentList: [],
            goals: `Improve ${scheduledWorkout.sport} performance`,
            previousWorkouts: previousWorkouts || [],
            adaptToProgress: true
          }
        })

        console.log('Workout generation response:', data, error)

        if (error) throw error

        if (data?.workout) {
          // Convert the generated workout to the expected format
          const workoutData: WorkoutData = {
            title: data.workout.title,
            type: data.workout.type || scheduledWorkout.workout_type,
            sport: data.workout.sport,
            duration: data.workout.duration || 60,
            warmup: data.workout.warmup || [],
            exercises: data.workout.exercises || [],
            cooldown: data.workout.cooldown || []
          }
          
          console.log('Setting generated workout data:', workoutData)
          setWorkout(workoutData)
          setCurrentWorkoutId(data.workout.id)
          setCurrentScheduledWorkoutId(scheduledWorkout.id)
          
          // Update scheduled workout with the generated workout ID
          await supabase
            .from('scheduled_workouts')
            .update({ workout_id: data.workout.id })
            .eq('id', scheduledWorkout.id)
          
          // Don't refresh scheduled workouts as it will clear the current workout
          // Just update the local state to show the workout is linked
          setTodayWorkouts(prev => 
            prev.map(w => w.id === scheduledWorkout.id 
              ? { ...w, workout_id: data.workout.id } 
              : w
            )
          )
          
          toast({
            title: "Workout Generated!",
            description: "Your personalized workout is ready.",
          })
        } else {
          throw new Error('No workout data received')
        }
      } catch (error: any) {
        console.error('Error generating workout:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to generate workout. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setSelectedDate(newDate)
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
          completed: false
        })
        .select()
        .single()

      if (saveError) throw saveError
      
      // Store the workout ID for completion
      if (savedWorkout) {
        setCurrentWorkoutId(savedWorkout.id)
        setWorkout(prev => prev ? { ...prev, id: savedWorkout.id } : prev)
        setShowCompletion(true)
      }

      // Update scheduled workout if it exists
      if (currentScheduledWorkoutId) {
        const { error: updateError } = await supabase
          .from('scheduled_workouts')
          .update({ 
            completed: true,
            workout_id: savedWorkout.id 
          })
          .eq('id', currentScheduledWorkoutId)

        if (updateError) console.warn('Failed to update scheduled workout:', updateError)
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

  const handleWorkoutComplete = () => {
    setShowCompletion(false)
    
    // Check if smartwatch is enabled
    const smartwatchEnabled = localStorage.getItem('smartwatch-enabled')
    if (smartwatchEnabled === 'true') {
      setShowSmartwatchEntry(true)
    } else {
      // Navigate back to home
      window.location.href = '/'
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

  const generateWorkout = async (userFeedback = "") => {
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

      // Get AI suggestions from coach chat if available
      const coachSuggestions = localStorage.getItem('coach-suggestions') || ""

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
          adaptToProgress: true,
          userFeedback: userFeedback,
          coachSuggestions: coachSuggestions
        }
      })

      if (data?.workout) {
        setWorkout(data.workout)
        // Clear coach suggestions after use
        localStorage.removeItem('coach-suggestions')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate workout",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  const handleRegenerateWorkout = async (feedback: string) => {
    setRegenerating(true)
    await generateWorkout(feedback)
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
${workout.exercises.map((ex, i) => `${i + 1}. ${ex.name} - ${ex.sets} sets x ${ex.reps} reps (${workout.sport === 'swimming' ? 'Interval' : 'Rest'}: ${ex.interval || ex.rest || '60s'})\n   ${ex.description || ''}`).join('\n\n')}

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
              ${ex.sets} sets × ${ex.reps} reps (${workout.sport === 'swimming' ? 'Interval' : 'Rest'}: ${ex.interval || ex.rest || '60s'})<br>
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

  const checkIfLiked = async (workoutId: string) => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('workout_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('workout_id', workoutId)
        .maybeSingle()

      setIsLiked(!!data)
    } catch (error) {
      console.error('Error checking if workout is liked:', error)
    }
  }

  const toggleLike = async () => {
    if (!user || !currentWorkoutId) return

    try {
      if (isLiked) {
        // Unlike workout
        const { error } = await supabase
          .from('workout_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('workout_id', currentWorkoutId)

        if (error) throw error

        setIsLiked(false)
        toast({
          title: "Workout Unliked",
          description: "Removed from your liked workouts",
        })
      } else {
        // Like workout
        const { error } = await supabase
          .from('workout_likes')
          .insert({
            user_id: user.id,
            workout_id: currentWorkoutId
          })

        if (error) throw error

        setIsLiked(true)
        toast({
          title: "Workout Liked! ❤️",
          description: "Added to your liked workouts",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update workout like status",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your workout...</p>
        </div>
      </div>
    )
  }

  // Show scheduled workouts if no specific workout is loaded and no generated workout data
  if (!workout && !generatedWorkoutData && todayWorkouts.length > 0) {
    return (
      <div className="space-y-4">
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Scheduled Workouts
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="glass border-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(selectedDate, 'MMM d, yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="glass border-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {todayWorkouts.map((scheduledWorkout) => (
              <div 
                key={scheduledWorkout.id}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md glass border-0 ${
                  scheduledWorkout.completed 
                    ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' 
                    : scheduledWorkout.workout_id
                      ? 'bg-pulse-blue/10 border-pulse-blue/20 hover:bg-pulse-blue/20'
                      : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
                }`}
                onClick={() => handleTodayWorkoutClick(scheduledWorkout)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSportIcon(scheduledWorkout.sport)}</span>
                  <div>
                    <div className="font-medium text-foreground">{scheduledWorkout.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {scheduledWorkout.session_time_of_day} • {scheduledWorkout.workout_type}
                      {scheduledWorkout.workout_id ? ' • Ready to view' : ' • Click to generate'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {scheduledWorkout.workout_id && (
                    <Eye className="h-4 w-4 text-pulse-blue" />
                  )}
                  {!scheduledWorkout.workout_id && (
                    <Play className="h-4 w-4 text-orange-500" />
                  )}
                  <Badge variant="secondary" className={
                    scheduledWorkout.completed 
                      ? 'bg-green-500/20 text-green-700 border-green-500/30'
                      : scheduledWorkout.workout_id
                        ? 'bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30'
                        : 'bg-orange-500/20 text-orange-600 border-orange-500/30'
                  }>
                    {scheduledWorkout.completed ? 'Completed ✓' : scheduledWorkout.workout_id ? 'Ready' : 'Generate'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty state if no workouts
  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No workouts scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
          <p className="text-sm text-muted-foreground mt-2">Go to Training Manager to create a plan.</p>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateDate('prev')}
            className="glass border-0"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Day
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateDate('next')}
            className="glass border-0"
          >
            Next Day
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // Show workout execution mode
  if (isExecuting && currentWorkoutId) {
    return (
      <WorkoutExecution
        workout={workout}
        workoutId={currentWorkoutId}
        onComplete={() => {
          setIsExecuting(false)
          setShowCompletion(true)
        }}
      />
    )
  }

  // Show workout completion form
  if (showCompletion && currentWorkoutId) {
    return (
      <WorkoutCompletion
        workout={{ ...workout, id: currentWorkoutId }}
        onComplete={handleWorkoutComplete}
      />
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
    <div className="space-y-4 animate-fade-in bg-gradient-to-b from-background to-muted/30 min-h-screen">
      <div className="text-center py-4 glass border-0 rounded-xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">{sportInfo.icon}</span>
          <h2 className="text-3xl font-bold text-foreground">{workout.title}</h2>
        </div>
        
        {/* Workout Selection Dropdown */}
        {availableWorkouts.length > 0 && (
          <div className="mb-4 max-w-xs mx-auto">
            <Select value={selectedWorkoutFromDropdown} onValueChange={handleWorkoutSelection}>
              <SelectTrigger className="glass border-0">
                <SelectValue placeholder="Select a different workout" />
              </SelectTrigger>
              <SelectContent className="glass border-0">
                {availableWorkouts.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.title} ({w.sport}) {!w.workout_id && "- Not Generated"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge className="bg-primary/20 text-primary">
            {workout.type}
          </Badge>
          <Badge className="bg-green-500/20 text-green-700">
            AI Generated
          </Badge>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {currentWorkoutId && (
            <Button 
              onClick={toggleLike} 
              variant="outline" 
              size="sm" 
              className={`glass border-0 ${isLiked ? 'text-red-500 border-red-300' : ''}`}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Liked' : 'Like'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={downloadWorkout} className="glass border-0">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={printWorkout} className="glass border-0">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFeedback(true)}
            disabled={regenerating}
            className="glass border-0"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowQuestions(true)}
            className="glass border-0"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Ask Questions
          </Button>
        </div>
      </div>

      {/* Context Section */}
      {contextText && (
        <Card className="glass border-0">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground font-medium">{contextText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warm-up Section */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-orange-500" />
            Warm-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {workout.warmup.map((item, index) => (
            <div key={index} className="p-3 glass border-0 rounded-lg bg-orange-500/10 border-orange-500/20">
              <div className="text-foreground font-medium">{item}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main Workout Section */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Main Workout
            <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
              <Clock className="h-4 w-4" />
              {workout.duration} min
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="p-4 glass border-0 rounded-lg bg-primary/10 border-primary/20 space-y-3">
              {workout.sport === 'swimming' ? (
                <div className="text-center space-y-3">
                  <div className="glass border-0 bg-primary/20 rounded-lg p-3 border-primary/30">
                    <h4 className="font-bold text-xl text-foreground mb-2">{exercise.name}</h4>
                    <div className="text-lg font-semibold text-foreground">{exercise.reps}</div>
                    {(exercise.interval || exercise.rest) && (
                      <div className="text-sm text-muted-foreground mt-1">Interval: {exercise.interval || exercise.rest}</div>
                    )}
                  </div>
                  {exercise.description && (
                    <div className="glass border-0 p-3 rounded border">
                      <p className="text-sm text-muted-foreground italic">{exercise.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="glass border-0 p-3 rounded border">
                    <h4 className="font-bold text-lg text-foreground mb-2">{exercise.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Sets:</span>
                        <span className="ml-2 text-foreground">{exercise.sets}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Reps:</span>
                        <span className="ml-2 text-foreground">{exercise.reps}</span>
                      </div>
                      {(exercise.rest || exercise.interval) && (
                        <div className="col-span-2">
                          <span className="font-medium text-muted-foreground">{workout.sport === 'swimming' ? 'Interval:' : 'Rest:'}</span>
                          <span className="ml-2 text-foreground">{exercise.interval || exercise.rest}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {exercise.description && (
                    <div className="glass border-0 p-3 rounded border">
                      <p className="text-sm text-muted-foreground italic">{exercise.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cool-down Section */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-green-500" />
            Cool-down
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {workout.cooldown.map((item, index) => (
            <div key={index} className="p-3 glass border-0 rounded-lg bg-green-500/10 border-green-500/20">
              <div className="text-foreground font-medium">{item}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance History */}
      {currentWorkoutId && (
        <WorkoutPerformanceHistory 
          workoutId={currentWorkoutId} 
          sport={workout.sport}
        />
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="mb-6">
          <WorkoutFeedback
            workout={workout}
            onRegenerateWorkout={handleRegenerateWorkout}
            onClose={() => setShowFeedback(false)}
          />
        </div>
      )}

      {/* Questions Modal */}
      {showQuestions && (
        <div className="mb-6">
          <WorkoutQuestions
            workout={workout}
            onClose={() => setShowQuestions(false)}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 glass border-0 p-4 rounded-xl">
        <Button 
          onClick={async () => {
            if (!currentWorkoutId) {
              await saveWorkoutAndMarkComplete()
            } else {
              // If workout already exists, just mark as completed and show completion
              if (workout?.sport === 'swimming') {
                setShowCompletion(true)
              } else {
                setIsExecuting(true)
              }
            }
          }}
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
              {workout?.sport === 'swimming' ? 'Done' : 'Start Workout'}
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="flex-1 glass border-0"
        >
          <X className="mr-2 h-4 w-4" />
          Skip Workout
        </Button>
      </div>
    </div>
  )
}
