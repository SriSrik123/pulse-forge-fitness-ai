
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Plus, Check, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest?: number;
  instructions?: string;
}

interface Workout {
  id: string;
  title: string;
  sport: string;
  exercises: Exercise[];
  duration?: number;
}

interface ExerciseSet {
  weight?: number;
  reps?: number;
  time?: number;
  distance?: number;
  completed: boolean;
}

export function WorkoutExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseSets, setExerciseSets] = useState<{ [exerciseIndex: number]: ExerciseSet[] }>({});

  useEffect(() => {
    if (id) {
      fetchWorkout();
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const fetchWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setWorkout({
          ...data,
          exercises: Array.isArray(data.exercises) ? data.exercises : []
        });
        
        // Initialize exercise sets based on sport and exercise type
        const initialSets: { [exerciseIndex: number]: ExerciseSet[] } = {};
        (Array.isArray(data.exercises) ? data.exercises : []).forEach((exercise: Exercise, index: number) => {
          const defaultSets = exercise.sets || 3;
          initialSets[index] = Array.from({ length: defaultSets }, () => 
            getDefaultSetForSport(data.sport, exercise)
          );
        });
        setExerciseSets(initialSets);
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
      toast({
        title: "Error",
        description: "Failed to load workout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSetForSport = (sport: string, exercise: Exercise): ExerciseSet => {
    const sportLower = sport.toLowerCase();
    
    if (sportLower.includes('weight') || sportLower.includes('strength') || sportLower.includes('gym')) {
      return {
        weight: exercise.weight || 0,
        reps: exercise.reps || 0,
        completed: false
      };
    } else if (sportLower.includes('swim') || sportLower.includes('run') || sportLower.includes('cardio')) {
      return {
        time: exercise.duration || 0,
        distance: exercise.distance || 0,
        completed: false
      };
    } else {
      return {
        reps: exercise.reps || 0,
        completed: false
      };
    }
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: any) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseIndex]: prev[exerciseIndex].map((set, idx) => 
        idx === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const addSet = (exerciseIndex: number) => {
    const exercise = workout?.exercises[exerciseIndex];
    if (!exercise) return;
    
    setExerciseSets(prev => ({
      ...prev,
      [exerciseIndex]: [
        ...prev[exerciseIndex],
        getDefaultSetForSport(workout?.sport || '', exercise)
      ]
    }));
  };

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    updateSet(exerciseIndex, setIndex, 'completed', !exerciseSets[exerciseIndex][setIndex].completed);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const finishWorkout = async () => {
    if (!workout) return;

    try {
      // Save performance data
      const performanceData = Object.entries(exerciseSets).map(([exerciseIndex, sets]) => {
        const exercise = workout.exercises[parseInt(exerciseIndex)];
        return sets.map((set, setIndex) => ({
          exercise_name: exercise.name,
          metric_type: workout.sport.toLowerCase().includes('weight') ? 'strength' : 'cardio',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          workout_id: workout.id,
          ...set,
          sets: setIndex + 1,
          value: set.weight || set.time || set.reps || 0,
          unit: set.weight ? 'lbs' : set.time ? 'seconds' : 'reps'
        }));
      }).flat();

      for (const data of performanceData) {
        if (data.completed) {
          await supabase.from('workout_performance').insert(data);
        }
      }

      // Mark workout as completed
      await supabase
        .from('workouts')
        .update({ completed: true })
        .eq('id', workout.id);

      toast({
        title: "Workout Completed!",
        description: "Great job on finishing your workout!",
      });

      navigate('/workouts');
    } catch (error) {
      console.error('Error finishing workout:', error);
      toast({
        title: "Error",
        description: "Failed to save workout data",
        variant: "destructive",
      });
    }
  };

  const renderSetInputs = (sport: string, set: ExerciseSet, exerciseIndex: number, setIndex: number) => {
    const sportLower = sport.toLowerCase();
    
    if (sportLower.includes('weight') || sportLower.includes('strength') || sportLower.includes('gym')) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="lbs"
            value={set.weight || ''}
            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseInt(e.target.value) || 0)}
            className="w-16 text-center"
          />
          <span className="text-sm text-muted-foreground">×</span>
          <Input
            type="number"
            placeholder="reps"
            value={set.reps || ''}
            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
            className="w-16 text-center"
          />
        </div>
      );
    } else if (sportLower.includes('swim') || sportLower.includes('run') || sportLower.includes('cardio')) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="time"
            value={set.time || ''}
            onChange={(e) => updateSet(exerciseIndex, setIndex, 'time', parseInt(e.target.value) || 0)}
            className="w-20 text-center"
          />
          <span className="text-xs text-muted-foreground">sec</span>
          <Input
            type="number"
            placeholder="dist"
            value={set.distance || ''}
            onChange={(e) => updateSet(exerciseIndex, setIndex, 'distance', parseInt(e.target.value) || 0)}
            className="w-20 text-center"
          />
          <span className="text-xs text-muted-foreground">m</span>
        </div>
      );
    } else {
      return (
        <Input
          type="number"
          placeholder="reps"
          value={set.reps || ''}
          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
          className="w-16 text-center"
        />
      );
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!workout) {
    return <div className="text-center text-muted-foreground">Workout not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-muted"
        >
          <Clock className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <div className="text-2xl font-mono">{formatTime(timer)}</div>
        </div>
        
        <Button
          onClick={finishWorkout}
          className="bg-green-500 hover:bg-green-600 text-white px-6"
        >
          Finish
        </Button>
      </div>

      {/* Workout Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{workout.title}</h1>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <span>📅 Jul 16, 2025</span>
          <span>⏱️ {formatTime(timer)}</span>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-6">
        {workout.exercises.map((exercise, exerciseIndex) => (
          <Card key={exerciseIndex}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-500">{exercise.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {exercise.instructions && (
                <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-sm">
                  {exercise.instructions}
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {/* Set Headers */}
              <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-1">Set</div>
                <div className="col-span-3">Previous</div>
                <div className="col-span-6 text-center">
                  {workout.sport.toLowerCase().includes('weight') ? 'lbs / Reps' : 
                   workout.sport.toLowerCase().includes('swim') || workout.sport.toLowerCase().includes('run') ? 'Time / Distance' :
                   'Reps'}
                </div>
                <div className="col-span-2"></div>
              </div>
              
              {/* Sets */}
              <div className="space-y-2">
                {exerciseSets[exerciseIndex]?.map((set, setIndex) => (
                  <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-center font-medium bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                      {setIndex + 1}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {/* Previous set data would go here */}
                      -
                    </div>
                    <div className="col-span-6 flex justify-center">
                      {renderSetInputs(workout.sport, set, exerciseIndex, setIndex)}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant={set.completed ? "default" : "outline"}
                        size="icon"
                        className={`w-8 h-8 ${set.completed ? 'bg-green-500 hover:bg-green-600' : ''}`}
                        onClick={() => toggleSetCompletion(exerciseIndex, setIndex)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Set Button */}
              <Button
                variant="ghost"
                onClick={() => addSet(exerciseIndex)}
                className="w-full mt-4 text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Start Timer Button */}
      {!isRunning && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={() => setIsRunning(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full"
          >
            Start Workout
          </Button>
        </div>
      )}
    </div>
  );
}
