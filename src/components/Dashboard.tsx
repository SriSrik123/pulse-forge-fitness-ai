
import { useEffect, useState } from "react";
import { useAuth } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Target, Trophy, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Workout {
  id: string;
  title: string;
  description: string;
  exercises: any[];
  duration: number;
  sport: string;
  workout_type: string;
}

interface ScheduledWorkout {
  id: string;
  title: string;
  scheduled_date: string;
  sport: string;
  workout_type: string;
  completed: boolean;
  workout_id: string;
  workout?: Workout;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [todaysWorkouts, setTodaysWorkouts] = useState<ScheduledWorkout[]>([]);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<ScheduledWorkout[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    weeklyGoal: 0,
    currentStreak: 0,
    totalAchievements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const weekAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      // Fetch today's workouts
      const { data: todaysData, error: todaysError } = await supabase
        .from('scheduled_workouts')
        .select(`
          *,
          workout:workouts(*)
        `)
        .eq('user_id', user?.id)
        .eq('scheduled_date', today);

      if (todaysError) throw todaysError;
      setTodaysWorkouts(todaysData || []);

      // Fetch upcoming workouts
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', user?.id)
        .gte('scheduled_date', tomorrow)
        .order('scheduled_date', { ascending: true })
        .limit(5);

      if (upcomingError) throw upcomingError;
      setUpcomingWorkouts(upcomingData || []);

      // Fetch recent workouts
      const { data: recentData, error: recentError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentWorkouts(recentData || []);

      // Fetch stats
      const { data: workoutCount, error: countError } = await supabase
        .from('workouts')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id);

      const { data: weeklyWorkouts, error: weeklyError } = await supabase
        .from('workouts')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
        .gte('created_at', weekAgo);

      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id);

      if (countError || weeklyError || achievementsError) {
        throw countError || weeklyError || achievementsError;
      }

      setStats({
        totalWorkouts: workoutCount?.length || 0,
        weeklyGoal: weeklyWorkouts?.length || 0,
        currentStreak: 3, // This would need more complex logic
        totalAchievements: achievements?.length || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markWorkoutComplete = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ completed: true })
        .eq('id', workoutId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workout marked as complete!",
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error marking workout complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark workout as complete",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedWorkout = todaysWorkouts[selectedWorkoutIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.user_metadata?.full_name || 'Athlete'}!
        </h1>
        <p className="text-muted-foreground">
          Ready to crush your fitness goals today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
                <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.weeklyGoal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{stats.totalAchievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-xl font-semibold flex-shrink-0">
                Today's Workout
              </CardTitle>
              {todaysWorkouts.length > 1 && (
                <Select
                  value={selectedWorkoutIndex.toString()}
                  onValueChange={(value) => setSelectedWorkoutIndex(parseInt(value))}
                >
                  <SelectTrigger className="w-auto min-w-[200px] bg-background border-input">
                    <SelectValue />
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {todaysWorkouts.map((workout, index) => (
                      <SelectItem 
                        key={workout.id} 
                        value={index.toString()}
                        className="hover:bg-muted cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {workout.sport}
                          </Badge>
                          <span className="truncate max-w-[150px]">
                            {workout.title}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedWorkout ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 break-words">
                    {selectedWorkout.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">{selectedWorkout.sport}</Badge>
                    <Badge variant="outline">{selectedWorkout.workout_type}</Badge>
                    {selectedWorkout.workout?.duration && (
                      <Badge variant="outline">
                        {selectedWorkout.workout.duration} min
                      </Badge>
                    )}
                  </div>
                  {selectedWorkout.workout?.description && (
                    <p className="text-muted-foreground mb-4 break-words">
                      {selectedWorkout.workout.description}
                    </p>
                  )}
                </div>

                {selectedWorkout.workout?.exercises && (
                  <div>
                    <h4 className="font-medium mb-2">Exercises:</h4>
                    <div className="space-y-2">
                      {selectedWorkout.workout.exercises.slice(0, 3).map((exercise: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium break-words flex-1 mr-2">
                            {exercise.name || exercise.exercise_name || `Exercise ${index + 1}`}
                          </span>
                          {(exercise.sets || exercise.reps || exercise.duration) && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {exercise.sets && `${exercise.sets} sets`}
                              {exercise.reps && ` × ${exercise.reps} reps`}
                              {exercise.duration && ` × ${exercise.duration}`}
                            </span>
                          )}
                        </div>
                      ))}
                      {selectedWorkout.workout.exercises.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{selectedWorkout.workout.exercises.length - 3} more exercises
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => markWorkoutComplete(selectedWorkout.id)}
                    disabled={selectedWorkout.completed}
                    className="flex-1"
                  >
                    {selectedWorkout.completed ? 'Completed ✓' : 'Mark Complete'}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No workouts scheduled for today</p>
                <Button className="mt-4">Schedule Workout</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingWorkouts.length > 0 ? (
              <div className="space-y-3">
                {upcomingWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{workout.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {workout.sport}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(workout.scheduled_date), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming workouts
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{workout.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {workout.sport}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(workout.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  {workout.completed && (
                    <Badge variant="default" className="bg-green-500">
                      Completed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
