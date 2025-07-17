
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Play } from "lucide-react";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  weight?: number;
  rest?: number;
}

interface PerformanceData {
  exercise_name: string;
  sets?: number;
  reps?: number;
  value?: number;
  time_seconds?: number;
  distance?: number;
  unit?: string;
  notes?: string;
}

export const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const { data: performanceData } = useQuery({
    queryKey: ["workout-performance", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_performance")
        .select("*")
        .eq("workout_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PerformanceData[];
    },
    enabled: !!id,
  });

  const handleStartWorkout = () => {
    navigate(`/workout/${id}/execute`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Workout not found</p>
      </div>
    );
  }

  // Safely parse exercises from JSON
  let exercises: Exercise[] = [];
  try {
    if (Array.isArray(workout.exercises)) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{workout.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary">{workout.sport}</Badge>
              <Badge variant="outline">{workout.workout_type}</Badge>
              {workout.duration && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{workout.duration} min</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleStartWorkout} size="lg" className="gap-2">
            <Play className="h-4 w-4" />
            Start Workout
          </Button>
        </div>

        {workout.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{workout.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{exercise.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-muted-foreground">
                    {exercise.sets && <div>Sets: {exercise.sets}</div>}
                    {exercise.reps && <div>Reps: {exercise.reps}</div>}
                    {exercise.duration && <div>Duration: {exercise.duration}s</div>}
                    {exercise.distance && <div>Distance: {exercise.distance}m</div>}
                    {exercise.weight && <div>Weight: {exercise.weight}kg</div>}
                    {exercise.rest && <div>Rest: {exercise.rest}s</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {performanceData && performanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((perf, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium">{perf.exercise_name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-muted-foreground">
                      {perf.sets && <div>Sets: {perf.sets}</div>}
                      {perf.reps && <div>Reps: {perf.reps}</div>}
                      {perf.value && <div>Weight: {perf.value}{perf.unit || 'kg'}</div>}
                      {perf.time_seconds && <div>Time: {perf.time_seconds}s</div>}
                      {perf.distance && <div>Distance: {perf.distance}m</div>}
                    </div>
                    {perf.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{perf.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
