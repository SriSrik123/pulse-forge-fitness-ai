
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Dumbbell, Play } from "lucide-react";

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  weight?: number;
}

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();

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

  const { data: performance } = useQuery({
    queryKey: ['workout-performance', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('workout_performance')
        .select('*')
        .eq('workout_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) return <div>Loading workout...</div>;
  if (!workout) return <div>Workout not found</div>;

  // Safely parse exercises from Json type
  const exercises: Exercise[] = Array.isArray(workout.exercises) 
    ? workout.exercises.map(ex => typeof ex === 'object' && ex !== null ? ex as Exercise : { name: String(ex) })
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold break-words">{workout.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary">{workout.sport}</Badge>
              <Badge variant="outline">{workout.workout_type}</Badge>
              {workout.completed && <Badge variant="default">Completed</Badge>}
            </div>
          </div>
          <Link to={`/workout/${workout.id}/execute`}>
            <Button size="lg" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Workout
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Workout Info */}
            <Card>
              <CardHeader>
                <CardTitle>Workout Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(workout.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {workout.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{workout.duration} minutes</span>
                    </div>
                  )}
                </div>
                {workout.description && (
                  <p className="text-muted-foreground">{workout.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Exercises */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Exercises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">{exercise.name}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {exercise.sets && (
                          <span>{exercise.sets} sets</span>
                        )}
                        {exercise.reps && (
                          <span>{exercise.reps} reps</span>
                        )}
                        {exercise.duration && (
                          <span>{exercise.duration} seconds</span>
                        )}
                        {exercise.distance && (
                          <span>{exercise.distance} meters</span>
                        )}
                        {exercise.weight && (
                          <span>{exercise.weight} kg</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Previous results for this workout</CardDescription>
              </CardHeader>
              <CardContent>
                {performance && performance.length > 0 ? (
                  <div className="space-y-4">
                    {performance.map((perf) => (
                      <div key={perf.id} className="p-3 rounded-lg border">
                        <h5 className="font-medium">{perf.exercise_name}</h5>
                        <div className="text-sm text-muted-foreground mt-1">
                          {perf.sets && `${perf.sets} sets`}
                          {perf.reps && ` × ${perf.reps} reps`}
                          {perf.value && ` @ ${perf.value}${perf.unit || 'kg'}`}
                          {perf.time_seconds && ` in ${perf.time_seconds}s`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(perf.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No performance data yet. Complete the workout to track your progress!
                  </p>
                )}
              </CardContent>
            </Card>

            {workout.journal_entry && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Journal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{workout.journal_entry}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
