
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Timer, Check, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  weight?: number;
}

interface ExercisePerformance {
  exercise_name: string;
  sets?: number;
  reps?: number;
  value?: number;
  unit?: string;
  time_seconds?: number;
  distance?: number;
  notes?: string;
}

export function WorkoutExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [performanceData, setPerformanceData] = useState<ExercisePerformance[]>([]);
  const [currentPerformance, setCurrentPerformance] = useState<Partial<ExercisePerformance>>({});
  const [workoutNotes, setWorkoutNotes] = useState("");

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      if (!id) throw new Error('No workout ID provided');
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Safely parse exercises from Json type
  const exercises: Exercise[] = workout?.exercises && Array.isArray(workout.exercises) 
    ? workout.exercises.map(ex => typeof ex === 'object' && ex !== null ? ex as Exercise : { name: String(ex) })
    : [];

  const currentExercise = exercises[currentExerciseIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const savePerformanceMutation = useMutation({
    mutationFn: async (performanceEntries: ExercisePerformance[]) => {
      const entries = performanceEntries.map(entry => ({
        ...entry,
        workout_id: id,
        metric_type: getMetricType(entry, workout?.sport || ''),
      }));

      const { error } = await supabase
        .from('workout_performance')
        .insert(entries);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workout completed! Performance saved.");
      queryClient.invalidateQueries({ queryKey: ['workout-performance', id] });
    }
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('workouts')
        .update({ 
          completed: true, 
          duration: Math.round(timer / 60),
          journal_entry: workoutNotes || null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      if (performanceData.length > 0) {
        savePerformanceMutation.mutate(performanceData);
      }
      navigate(`/workout/${id}`);
    }
  });

  const getMetricType = (performance: ExercisePerformance, sport: string) => {
    if (performance.value && performance.reps) return 'weight_reps';
    if (performance.time_seconds) return 'time';
    if (performance.distance) return 'distance';
    return 'sets_reps';
  };

  const handleSetComplete = () => {
    if (!currentExercise) return;

    const performance: ExercisePerformance = {
      exercise_name: currentExercise.name,
      sets: currentSet,
      ...currentPerformance
    };

    setPerformanceData(prev => [...prev, performance]);
    
    if (currentSet < (currentExercise.sets || 3)) {
      setCurrentSet(prev => prev + 1);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
      }
    }
    
    setCurrentPerformance({});
  };

  const handleWorkoutComplete = () => {
    setIsTimerRunning(false);
    completeWorkoutMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPerformanceInputs = () => {
    if (!currentExercise || !workout) return null;

    const sport = workout.sport.toLowerCase();
    
    if (sport.includes('weight') || sport.includes('strength') || sport.includes('gym')) {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Reps</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPerformance(prev => ({ 
                  ...prev, 
                  reps: Math.max(0, (prev.reps || 0) - 1) 
                }))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={currentPerformance.reps || ''}
                onChange={(e) => setCurrentPerformance(prev => ({ 
                  ...prev, 
                  reps: parseInt(e.target.value) || 0 
                }))}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPerformance(prev => ({ 
                  ...prev, 
                  reps: (prev.reps || 0) + 1 
                }))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.5"
              value={currentPerformance.value || ''}
              onChange={(e) => setCurrentPerformance(prev => ({ 
                ...prev, 
                value: parseFloat(e.target.value) || 0,
                unit: 'kg'
              }))}
            />
          </div>
        </div>
      );
    }

    if (sport.includes('swim') || sport.includes('run') || sport.includes('cardio')) {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Time (seconds)</Label>
            <Input
              type="number"
              value={currentPerformance.time_seconds || ''}
              onChange={(e) => setCurrentPerformance(prev => ({ 
                ...prev, 
                time_seconds: parseInt(e.target.value) || 0 
              }))}
            />
          </div>
          <div>
            <Label>Distance (m)</Label>
            <Input
              type="number"
              value={currentPerformance.distance || ''}
              onChange={(e) => setCurrentPerformance(prev => ({ 
                ...prev, 
                distance: parseInt(e.target.value) || 0 
              }))}
            />
          </div>
        </div>
      );
    }

    // Default for other sports
    return (
      <div>
        <Label>Reps</Label>
        <Input
          type="number"
          value={currentPerformance.reps || ''}
          onChange={(e) => setCurrentPerformance(prev => ({ 
            ...prev, 
            reps: parseInt(e.target.value) || 0 
          }))}
        />
      </div>
    );
  };

  if (isLoading) return <div>Loading workout...</div>;
  if (!workout || !currentExercise) return <div>Workout not found</div>;

  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const isLastSet = currentSet >= (currentExercise.sets || 3);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Workout Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="break-words">{workout.title}</CardTitle>
                <CardDescription>
                  Exercise {currentExerciseIndex + 1} of {exercises.length}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">{workout.sport}</Badge>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono">{formatTime(timer)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    {isTimerRunning ? 'Pause' : 'Start'}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Exercise */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="break-words">{currentExercise.name}</span>
              <Badge>Set {currentSet} / {currentExercise.sets || 3}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderPerformanceInputs()}
            
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={currentPerformance.notes || ''}
                onChange={(e) => setCurrentPerformance(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Any notes for this set..."
              />
            </div>

            <Button 
              onClick={handleSetComplete}
              className="w-full"
              size="lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete Set
            </Button>
          </CardContent>
        </Card>

        {/* Workout Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Workout Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="How did the workout feel? Any observations..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Complete Workout */}
        {isLastExercise && isLastSet && (
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleWorkoutComplete}
                className="w-full"
                size="lg"
                disabled={completeWorkoutMutation.isPending}
              >
                {completeWorkoutMutation.isPending ? 'Saving...' : 'Complete Workout'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
