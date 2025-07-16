import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Target, Activity, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Workout {
  id: string;
  title: string;
  sport: string;
  workout_type: string;
  scheduled_date: string;
  completed: boolean;
  skipped: boolean;
  workout: {
    description: string;
    exercises: any[];
  };
}

interface Stats {
  totalWorkouts: number;
  completedWorkouts: number;
  averageWorkoutDuration: number;
  longestStreak: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [scheduledWorkouts, setScheduledWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    averageWorkoutDuration: 0,
    longestStreak: 0,
  });
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (user) {
        try {
          const { data: workouts, error } = await supabase
            .from('scheduled_workouts')
            .select(`
              id, 
              title,
              sport,
              workout_type,
              scheduled_date,
              completed,
              skipped,
              workout (
                description,
                exercises
              )
            `)
            .eq('user_id', user.id)
            .order('scheduled_date', { ascending: false });

          if (error) {
            console.error('Error fetching workouts:', error);
          } else {
            setScheduledWorkouts(workouts || []);
          }
        } catch (err) {
          console.error('Unexpected error fetching workouts:', err);
        }
      }
    };

    fetchWorkouts();
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        try {
          const { data: userStats, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching stats:', error);
          } else {
            if (userStats) {
              setStats({
                totalWorkouts: userStats.total_workouts || 0,
                completedWorkouts: userStats.completed_workouts || 0,
                averageWorkoutDuration: userStats.average_workout_duration || 0,
                longestStreak: userStats.longest_streak || 0,
              });
            }
          }
        } catch (err) {
          console.error('Unexpected error fetching stats:', err);
        }
      }
    };

    fetchStats();
  }, [user]);

  const handleCompleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ completed: true })
        .eq('id', workoutId);

      if (error) {
        console.error('Error completing workout:', error);
      } else {
        setScheduledWorkouts(prevWorkouts =>
          prevWorkouts.map(workout =>
            workout.id === workoutId ? { ...workout, completed: true } : workout
          )
        );
        setStats(prevStats => ({
          ...prevStats,
          completedWorkouts: prevStats.completedWorkouts + 1,
        }));

        await supabase
          .from('user_stats')
          .update({ completed_workouts: stats.completedWorkouts + 1 })
          .eq('user_id', user?.id);
      }
    } catch (err) {
      console.error('Unexpected error completing workout:', err);
    }
  };

  const handleSkipWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ skipped: true })
        .eq('id', workoutId);

      if (error) {
        console.error('Error skipping workout:', error);
      } else {
        setScheduledWorkouts(prevWorkouts =>
          prevWorkouts.map(workout =>
            workout.id === workoutId ? { ...workout, skipped: true } : workout
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error skipping workout:', err);
    }
  };

  const todaysWorkouts = scheduledWorkouts.filter(workout => 
    workout.scheduled_date === new Date().toISOString().split('T')[0]
  );

  const selectedWorkout = todaysWorkouts.find(w => w.id === selectedWorkoutId) || todaysWorkouts[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, {user?.user_metadata?.full_name || 'Athlete'}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">
                All workouts ever scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-green-500" />
                Completed Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedWorkouts}</div>
              <p className="text-xs text-muted-foreground">
                Workouts you've successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-blue-500" />
                Avg. Workout Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageWorkoutDuration} min
              </div>
              <p className="text-xs text-muted-foreground">
                Average time spent per workout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-orange-500" />
                Longest Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.longestStreak} days</div>
              <p className="text-xs text-muted-foreground">
                Your longest consecutive workout streak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Workout Section */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl font-semibold text-foreground break-words min-w-0 flex-1">
                Today's Workout
              </CardTitle>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {todaysWorkouts.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm whitespace-nowrap">
                        Workout {todaysWorkouts.findIndex(w => w.id === selectedWorkoutId) + 1}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {todaysWorkouts.map((workout, index) => (
                        <DropdownMenuItem
                          key={workout.id}
                          onClick={() => setSelectedWorkoutId(workout.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">Workout {index + 1}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {workout.title}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                    onClick={() => selectedWorkout && handleCompleteWorkout(selectedWorkout.id)}
                    disabled={!selectedWorkout || selectedWorkout.completed}
                  >
                    {selectedWorkout?.completed ? 'Completed' : 'Complete'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                    onClick={() => selectedWorkout && handleSkipWorkout(selectedWorkout.id)}
                    disabled={!selectedWorkout || selectedWorkout.skipped}
                  >
                    {selectedWorkout?.skipped ? 'Skipped' : 'Skip'}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {selectedWorkout ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground break-words">
                    {selectedWorkout.title}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{selectedWorkout.sport}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{selectedWorkout.workout_type}</span>
                </div>
                
                {selectedWorkout.workout && (
                  <div className="space-y-3">
                    {selectedWorkout.workout.description && (
                      <p className="text-sm text-muted-foreground break-words">
                        {selectedWorkout.workout.description}
                      </p>
                    )}
                    
                    {selectedWorkout.workout.exercises && selectedWorkout.workout.exercises.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Exercises:</h4>
                        <div className="space-y-2">
                          {selectedWorkout.workout.exercises.slice(0, 3).map((exercise: any, index: number) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm bg-muted/50 p-2 rounded">
                              <span className="font-medium min-w-0 break-words">
                                {exercise.name || `Exercise ${index + 1}`}
                              </span>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {exercise.sets && (
                                  <span>{exercise.sets} sets</span>
                                )}
                                {exercise.reps && (
                                  <span>{exercise.reps} reps</span>
                                )}
                                {exercise.duration && (
                                  <span>{exercise.duration}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {selectedWorkout.workout.exercises.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{selectedWorkout.workout.exercises.length - 3} more exercises...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No workout scheduled
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ready to get started? Create a new workout plan.
                </p>
                <Button onClick={() => window.location.href = '/workout-generator'}>
                  Generate Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Recent Activity
          </h2>
          {/* Add recent activity list or components here */}
          <p className="text-sm text-muted-foreground">
            Your recent workout history will appear here.
          </p>
        </section>

        {/* Quick Actions Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center justify-center p-4">
                <Button onClick={() => window.location.href = '/workout-generator'}>
                  Generate Workout
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-center p-4">
                <Button onClick={() => window.location.href = '/workout-plans'}>
                  View Workout Plans
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-center p-4">
                <Button onClick={() => window.location.href = '/settings'}>
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
