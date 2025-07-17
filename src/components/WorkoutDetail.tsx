
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Calendar, Clock, Target, Award } from "lucide-react";
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
  description?: string;
  sport: string;
  workout_type: string;
  exercises: Exercise[];
  duration?: number;
  completed?: boolean;
  created_at: string;
}

interface PerformanceData {
  id: string;
  exercise_name: string;
  sets?: number;
  reps?: number;
  value?: number;
  unit?: string;
  time_seconds?: number;
  distance?: number;
  created_at: string;
}

export function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorkout();
      fetchPerformanceData();
    }
  }, [id]);

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
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
      toast({
        title: "Error",
        description: "Failed to load workout",
        variant: "destructive",
      });
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_performance')
        .select('*')
        .eq('workout_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPerformanceData(data || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    navigate(`/workout/${id}/execute`);
  };

  const getPerformanceForExercise = (exerciseName: string) => {
    return performanceData.filter(p => p.exercise_name === exerciseName);
  };

  const formatPerformanceData = (data: PerformanceData[], sport: string) => {
    if (data.length === 0) return "No previous data";
    
    const sportLower = sport.toLowerCase();
    
    if (sportLower.includes('weight') || sportLower.includes('strength')) {
      const grouped = data.reduce((acc, curr) => {
        const key = `${curr.value}${curr.unit}`;
        if (!acc[key]) acc[key] = 0;
        acc[key] += curr.reps || 0;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(grouped)
        .map(([weight, totalReps]) => `${weight} × ${totalReps}`)
        .join(', ');
    } else if (sportLower.includes('swim') || sportLower.includes('run')) {
      return data.map(d => 
        `${d.time_seconds}s${d.distance ? ` / ${d.distance}m` : ''}`
      ).join(', ');
    } else {
      return data.map(d => `${d.reps} reps`).join(', ');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!workout) {
    return <div className="text-center text-muted-foreground">Workout not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/workouts')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{workout.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <Badge variant="secondary">{workout.sport}</Badge>
            <Badge variant="outline">{workout.workout_type}</Badge>
            {workout.completed && (
              <Badge variant="default" className="bg-green-500">
                <Award className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={startWorkout} className="bg-blue-500 hover:bg-blue-600">
          <Play className="h-4 w-4 mr-2" />
          {workout.completed ? 'Do Again' : 'Start Workout'}
        </Button>
      </div>

      {/* Workout Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(workout.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{workout.duration || 'Not set'} min</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Exercises</p>
              <p className="font-medium">{workout.exercises.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {workout.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{workout.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workout.exercises.map((exercise, index) => {
              const exercisePerformance = getPerformanceForExercise(exercise.name);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{exercise.name}</h3>
                    <Badge variant="outline">{index + 1}</Badge>
                  </div>
                  
                  {exercise.instructions && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded mb-3 text-sm">
                      {exercise.instructions}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {exercise.sets && (
                      <div>
                        <span className="text-muted-foreground">Sets:</span>
                        <span className="ml-2 font-medium">{exercise.sets}</span>
                      </div>
                    )}
                    {exercise.reps && (
                      <div>
                        <span className="text-muted-foreground">Reps:</span>
                        <span className="ml-2 font-medium">{exercise.reps}</span>
                      </div>
                    )}
                    {exercise.weight && (
                      <div>
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="ml-2 font-medium">{exercise.weight} lbs</span>
                      </div>
                    )}
                    {exercise.duration && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">{exercise.duration}s</span>
                      </div>
                    )}
                    {exercise.distance && (
                      <div>
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="ml-2 font-medium">{exercise.distance}m</span>
                      </div>
                    )}
                    {exercise.rest && (
                      <div>
                        <span className="text-muted-foreground">Rest:</span>
                        <span className="ml-2 font-medium">{exercise.rest}s</span>
                      </div>
                    )}
                  </div>
                  
                  {exercisePerformance.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Last Performance:</span>
                        <span className="ml-2 font-medium">
                          {formatPerformanceData(exercisePerformance, workout.sport)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
