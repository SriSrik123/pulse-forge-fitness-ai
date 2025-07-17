
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  weight?: number;
  rest?: number;
}

interface ExercisePerformance {
  sets?: number;
  reps?: number;
  value?: number;
  unit?: string;
  time_seconds?: number;
  distance?: number;
  notes?: string;
}

export const WorkoutExecution = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [performance, setPerformance] = useState<Record<number, ExercisePerformance>>({});

  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setElapsedTime(0);
  };

  // Safely parse exercises from JSON
  let exercises: Exercise[] = [];
  try {
    if (workout?.exercises && Array.isArray(workout.exercises)) {
      exercises = workout.exercises.map((ex) => {
        if (typeof ex === 'object' && ex !== null && 'name' in ex) {
          return ex as Exercise;
        }
        return { name: 'Unknown Exercise' };
      });
    }
  } catch (error) {
    console.error("Error parsing exercises:", error);
  }

  const updatePerformance = (exerciseIndex: number, field: keyof ExercisePerformance, value: string | number) => {
    setPerformance(prev => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        [field]: value
      }
    }));
  };

  const completeExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      toast.success("Exercise completed!");
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    if (!workout || !id) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save performance data");
        return;
      }

      // Save performance data for each exercise
      const performanceEntries = exercises.map((exercise, index) => {
        const perf = performance[index] || {};
        return {
          workout_id: id,
          user_id: user.id,
          exercise_name: exercise.name,
          metric_type: getMetricType(workout.sport),
          sets: perf.sets || null,
          reps: perf.reps || null,
          value: perf.value || null,
          unit: perf.unit || getDefaultUnit(workout.sport),
          time_seconds: perf.time_seconds || null,
          distance: perf.distance || null,
          notes: perf.notes || null,
        };
      }).filter(entry => 
        entry.sets || entry.reps || entry.value || entry.time_seconds || entry.distance
      );

      if (performanceEntries.length > 0) {
        const { error } = await supabase
          .from("workout_performance")
          .insert(performanceEntries);

        if (error) throw error;
      }

      // Mark workout as completed
      const { error: updateError } = await supabase
        .from("workouts")
        .update({ completed: true })
        .eq("id", id);

      if (updateError) throw updateError;

      toast.success("Workout completed successfully!");
      navigate(`/workout/${id}`);
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout data");
    }
  };

  const getMetricType = (sport: string): string => {
    switch (sport.toLowerCase()) {
      case 'weightlifting':
      case 'strength':
        return 'weight_reps';
      case 'swimming':
      case 'running':
      case 'cycling':
        return 'time_distance';
      default:
        return 'general';
    }
  };

  const getDefaultUnit = (sport: string): string => {
    switch (sport.toLowerCase()) {
      case 'weightlifting':
      case 'strength':
        return 'kg';
      case 'swimming':
      case 'running':
        return 'm';
      case 'cycling':
        return 'km';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workout || exercises.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Workout not found or has no exercises</p>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentPerf = performance[currentExerciseIndex] || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{workout.title}</h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Badge variant="secondary">{workout.sport}</Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        <Card>
          <CardContent className="flex items-center justify-center gap-4 pt-6">
            <Button
              onClick={handleStartTimer}
              disabled={isTimerRunning}
              variant="default"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button
              onClick={handlePauseTimer}
              disabled={!isTimerRunning}
              variant="secondary"
              size="sm"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              onClick={handleStopTimer}
              variant="outline"
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </CardContent>
        </Card>

        {/* Current Exercise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Exercise {currentExerciseIndex + 1} of {exercises.length}</span>
              <Badge variant="outline">{((currentExerciseIndex + 1) / exercises.length * 100).toFixed(0)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">{currentExercise.name}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                {currentExercise.sets && <div>Target Sets: {currentExercise.sets}</div>}
                {currentExercise.reps && <div>Target Reps: {currentExercise.reps}</div>}
                {currentExercise.duration && <div>Target Duration: {currentExercise.duration}s</div>}
                {currentExercise.distance && <div>Target Distance: {currentExercise.distance}m</div>}
                {currentExercise.weight && <div>Target Weight: {currentExercise.weight}kg</div>}
              </div>
            </div>

            {/* Performance Input */}
            <div className="space-y-4">
              <h3 className="font-medium">Record Your Performance</h3>
              
              {workout.sport?.toLowerCase().includes('weight') || workout.sport?.toLowerCase().includes('strength') ? (
                // Weight training inputs
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sets">Sets</Label>
                    <Input
                      id="sets"
                      type="number"
                      value={currentPerf.sets || ''}
                      onChange={(e) => updatePerformance(currentExerciseIndex, 'sets', parseInt(e.target.value) || 0)}
                      placeholder="Number of sets"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      type="number"
                      value={currentPerf.reps || ''}
                      onChange={(e) => updatePerformance(currentExerciseIndex, 'reps', parseInt(e.target.value) || 0)}
                      placeholder="Reps per set"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.5"
                      value={currentPerf.value || ''}
                      onChange={(e) => updatePerformance(currentExerciseIndex, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="Weight used"
                    />
                  </div>
                </div>
              ) : (
                // Cardio inputs
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Time (seconds)</Label>
                    <Input
                      id="time"
                      type="number"
                      value={currentPerf.time_seconds || ''}
                      onChange={(e) => updatePerformance(currentExerciseIndex, 'time_seconds', parseInt(e.target.value) || 0)}
                      placeholder="Time taken"
                    />
                  </div>
                  <div>
                    <Label htmlFor="distance">Distance (m)</Label>
                    <Input
                      id="distance"
                      type="number"
                      value={currentPerf.distance || ''}
                      onChange={(e) => updatePerformance(currentExerciseIndex, 'distance', parseFloat(e.target.value) || 0)}
                      placeholder="Distance covered"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={currentPerf.notes || ''}
                  onChange={(e) => updatePerformance(currentExerciseIndex, 'notes', e.target.value)}
                  placeholder="How did it feel? Any observations?"
                  rows={3}
                />
              </div>
            </div>

            {/* Complete Exercise Button */}
            <Button onClick={completeExercise} className="w-full gap-2">
              <CheckCircle className="h-4 w-4" />
              {currentExerciseIndex < exercises.length - 1 ? 'Complete Exercise' : 'Finish Workout'}
            </Button>
          </CardContent>
        </Card>

        {/* Exercise Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className={`${index === currentExerciseIndex ? 'font-semibold' : ''} ${index < currentExerciseIndex ? 'text-muted-foreground' : ''}`}>
                    {exercise.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {index < currentExerciseIndex && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {index === currentExerciseIndex && <Badge variant="default" size="sm">Current</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
