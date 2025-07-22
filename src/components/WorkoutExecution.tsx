import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Timer, Plus, Minus, Play, Pause, Info } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface Exercise {
  name: string
  sets: string
  reps: string
  rest?: string
  description?: string
}

interface ExercisePerformance {
  exercise_name: string
  sets_completed: number
  performance_data: Array<{
    set: number
    reps?: number
    weight?: number
    time_seconds?: number
    distance?: number
    completed: boolean
  }>
}

interface WorkoutExecutionProps {
  workout: {
    title: string
    type: string
    sport: string
    duration: number
    warmup: string[]
    exercises: Exercise[]
    cooldown: string[]
  }
  workoutId?: string
  onComplete: () => void
}

export function WorkoutExecution({ workout, workoutId, onComplete }: WorkoutExecutionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [currentPhase, setCurrentPhase] = useState<'warmup' | 'exercises' | 'cooldown'>('warmup')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exercisePerformance, setExercisePerformance] = useState<ExercisePerformance[]>([])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (restTimerActive && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setRestTimerActive(false)
            toast({
              title: "Rest Complete!",
              description: "Time to start your next set",
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [restTimerActive, restTimeLeft, toast])

  // Initialize exercise performance tracking
  useEffect(() => {
    const initialPerformance = workout.exercises.map(exercise => ({
      exercise_name: exercise.name,
      sets_completed: 0,
      performance_data: Array(parseInt(exercise.sets) || 3).fill(null).map((_, index) => ({
        set: index + 1,
        completed: false
      }))
    }))
    setExercisePerformance(initialPerformance)
  }, [workout.exercises])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSportSpecificFields = (sport: string) => {
    const sportFields: Record<string, string[]> = {
      weightlifting: ['weight', 'reps'],
      strength: ['weight', 'reps'],
      running: ['distance', 'time'],
      cycling: ['distance', 'time'],
      swimming: ['distance', 'time'],
      basketball: ['time', 'points'],
      soccer: ['time', 'goals'],
      tennis: ['time', 'points'],
      cardio: ['time', 'distance'],
      yoga: ['time'],
      default: ['reps']
    }
    
    return sportFields[sport.toLowerCase()] || sportFields.default
  }

  const updatePerformanceData = (exerciseIndex: number, setIndex: number, field: string, value: number) => {
    setExercisePerformance(prev => {
      const updated = [...prev]
      if (!updated[exerciseIndex]) return prev
      
      updated[exerciseIndex].performance_data[setIndex] = {
        ...updated[exerciseIndex].performance_data[setIndex],
        [field]: value
      }
      return updated
    })
  }

  const markSetCompleted = (exerciseIndex: number, setIndex: number) => {
    setExercisePerformance(prev => {
      const updated = [...prev]
      if (!updated[exerciseIndex]) return prev
      
      updated[exerciseIndex].performance_data[setIndex].completed = true
      updated[exerciseIndex].sets_completed = updated[exerciseIndex].performance_data
        .filter(set => set.completed).length
        
      return updated
    })
    
    // Start rest timer if exercise has rest time
    const currentExercise = workout.exercises[exerciseIndex]
    if (currentExercise.rest) {
      const restSeconds = parseInt(currentExercise.rest.replace(/\D/g, '')) || 60
      setRestTimeLeft(restSeconds)
      setRestTimerActive(true)
    }
  }

  const startWorkout = () => {
    setIsTimerRunning(true)
    toast({
      title: "Workout Started!",
      description: "Let's get moving! 💪",
    })
  }

  const nextPhase = () => {
    if (currentPhase === 'warmup') {
      setCurrentPhase('exercises')
      setCurrentIndex(0)
    } else if (currentPhase === 'exercises') {
      setCurrentPhase('cooldown')
      setCurrentIndex(0)
    } else {
      finishWorkout()
    }
  }

  const nextExercise = () => {
    if (currentIndex < workout.exercises.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      nextPhase()
    }
  }

  const finishWorkout = async () => {
    setIsTimerRunning(false)
    
    // Save all performance data
    if (user && workoutId) {
      try {
        const performanceEntries = exercisePerformance.flatMap(exercise => 
          exercise.performance_data
            .filter(set => set.completed)
            .map(set => ({
              user_id: user.id,
              workout_id: workoutId,
              exercise_name: exercise.exercise_name,
              metric_type: getSportSpecificFields(workout.sport).includes('weight') ? 'strength' : 'cardio',
              sets: 1,
              reps: set.reps,
              value: set.weight || set.distance,
              time_seconds: set.time_seconds,
              unit: getSportSpecificFields(workout.sport).includes('weight') ? 'lbs' : 
                    getSportSpecificFields(workout.sport).includes('distance') ? 'yards' : undefined
            }))
        )

        if (performanceEntries.length > 0) {
          await supabase
            .from('workout_performance')
            .insert(performanceEntries)
        }

        toast({
          title: "Workout Complete!",
          description: `Great job! Total time: ${formatTime(timerSeconds)}`,
        })
      } catch (error) {
        console.error('Error saving performance:', error)
      }
    }
    
    onComplete()
  }

  const renderWarmup = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Warm-up</h2>
        <p className="text-muted-foreground">Prepare your body for exercise</p>
      </div>
      
      {workout.warmup.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">{index + 1}</span>
            </div>
            <span>{item}</span>
          </div>
        </Card>
      ))}
      
      <Button onClick={nextPhase} className="w-full">
        Start Main Workout
      </Button>
    </div>
  )

  const renderAllExercises = () => {
    const fields = getSportSpecificFields(workout.sport)
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">{workout.title}</h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'MMM d, yyyy')}
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
            <Timer className="h-4 w-4" />
            {formatTime(timerSeconds)}
          </div>
        </div>

        {/* All Exercises */}
        <div className="space-y-6">
          {workout.exercises.map((exercise, exerciseIndex) => {
            const exercisePerf = exercisePerformance[exerciseIndex]
            if (!exercisePerf) return null

            return (
              <div key={exerciseIndex} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-primary">{exercise.name}</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                
                {exercise.description && (
                  <div className="bg-orange-100 text-orange-800 text-sm p-2 rounded">
                    {exercise.description}
                  </div>
                )}

                {/* Headers */}
                <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="text-center">Set</div>
                  <div className="text-center">Previous</div>
                  {fields.includes('weight') && <div className="text-center">lbs</div>}
                  {fields.includes('time') && <div className="text-center">Time</div>}
                  {fields.includes('distance') && <div className="text-center">Distance</div>}
                  <div className="text-center">
                    {fields.includes('reps') ? 'Reps' : fields.includes('time') ? 'Duration' : 'Complete'}
                  </div>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  {exercisePerf.performance_data.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {set.set}
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-muted-foreground">
                        {/* Previous performance placeholder */}
                        --
                      </div>
                      
                      {fields.includes('weight') && (
                        <div>
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.weight || ''}
                            onChange={(e) => updatePerformanceData(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                            className="text-center h-10"
                            disabled={set.completed}
                          />
                        </div>
                      )}
                      
                      {fields.includes('time') && !fields.includes('weight') && (
                        <div>
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.time_seconds || ''}
                            onChange={(e) => updatePerformanceData(exerciseIndex, setIndex, 'time_seconds', parseInt(e.target.value) || 0)}
                            className="text-center h-10"
                            disabled={set.completed}
                          />
                        </div>
                      )}
                      
                      {fields.includes('distance') && (
                        <div>
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.distance || ''}
                            onChange={(e) => updatePerformanceData(exerciseIndex, setIndex, 'distance', parseFloat(e.target.value) || 0)}
                            className="text-center h-10"
                            disabled={set.completed}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {fields.includes('reps') ? (
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.reps || ''}
                            onChange={(e) => updatePerformanceData(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                            className="text-center h-10 flex-1"
                            disabled={set.completed}
                          />
                        ) : null}
                        
                        <Button
                          size="sm"
                          variant={set.completed ? "secondary" : "outline"}
                          onClick={() => markSetCompleted(exerciseIndex, setIndex)}
                          className="h-10 w-10 p-0"
                        >
                          {set.completed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Set Button */}
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    const newSet = {
                      set: exercisePerf.performance_data.length + 1,
                      completed: false
                    }
                    setExercisePerformance(prev => {
                      const updated = [...prev]
                      updated[exerciseIndex].performance_data.push(newSet)
                      return updated
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Set
                </Button>
              </div>
            )
          })}
        </div>

        {/* Rest Timer */}
        {restTimerActive && (
          <Card className="p-4 text-center bg-blue-50 border-blue-200">
            <h3 className="font-medium mb-2">Rest Time</h3>
            <div className="text-3xl font-mono text-blue-600">
              {formatTime(restTimeLeft)}
            </div>
          </Card>
        )}

        {/* Finish Button */}
        <Button onClick={finishWorkout} className="w-full" size="lg">
          Finish Workout
        </Button>
      </div>
    )
  }

  const renderCooldown = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Cool-down</h2>
        <p className="text-muted-foreground">Stretch and recover</p>
      </div>
      
      {workout.cooldown.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-green-600 font-medium">{index + 1}</span>
            </div>
            <span>{item}</span>
          </div>
        </Card>
      ))}
      
      <Button onClick={finishWorkout} className="w-full">
        Complete Workout
      </Button>
    </div>
  )

  if (!isTimerRunning && currentPhase === 'warmup') {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{workout.title}</h1>
          <p className="text-muted-foreground mb-4">
            {workout.sport} • {workout.type} • {workout.duration} mins
          </p>
          
          <div className="text-6xl mb-4">💪</div>
          
          <Button onClick={startWorkout} size="lg" className="w-full">
            <Play className="mr-2 h-5 w-5" />
            Start Workout
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with timer */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{workout.title}</h1>
            <p className="text-sm text-muted-foreground capitalize">{currentPhase}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-mono">
              <Timer className="h-5 w-5" />
              {formatTime(timerSeconds)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Phase content */}
      {currentPhase === 'warmup' && renderWarmup()}
      {currentPhase === 'exercises' && renderAllExercises()}
      {currentPhase === 'cooldown' && renderCooldown()}
    </div>
  )
}

