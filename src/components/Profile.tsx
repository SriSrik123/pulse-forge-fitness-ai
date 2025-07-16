
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Trophy, Target, Activity, Edit, User, Mail, MapPin, Phone, Clock, Award, Star, Zap } from 'lucide-react';
import { AchievementCard } from './AchievementCard';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface WorkoutStats {
  totalWorkouts: number;
  completedWorkouts: number;
  totalGoals: number;
  completedGoals: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    totalGoals: 0,
    completedGoals: 0
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWorkoutStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          username: user.user_metadata?.username || null,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      } else if (error) {
        throw error;
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    }
  };

  const fetchWorkoutStats = async () => {
    if (!user) return;

    try {
      // Fetch workout stats
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('completed')
        .eq('user_id', user.id);

      if (workoutError) throw workoutError;

      // Fetch goals stats
      const { data: goals, error: goalsError } = await supabase
        .from('user_goals')
        .select('completed')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      const totalWorkouts = workouts?.length || 0;
      const completedWorkouts = workouts?.filter(w => w.completed).length || 0;
      const totalGoals = goals?.length || 0;
      const completedGoals = goals?.filter(g => g.completed).length || 0;

      setWorkoutStats({
        totalWorkouts,
        completedWorkouts,
        totalGoals,
        completedGoals
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          username: editForm.username,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        full_name: editForm.full_name,
        username: editForm.username,
      });

      setEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const startEditing = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      bio: ''
    });
    setEditing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completionPercentage = workoutStats.totalWorkouts > 0 
    ? Math.round((workoutStats.completedWorkouts / workoutStats.totalWorkouts) * 100) 
    : 0;

  const achievements = [
    {
      id: '1',
      name: 'First Workout',
      description: 'Complete your first workout',
      icon: Activity,
      category: 'milestone',
      points: 10,
      earned: workoutStats.completedWorkouts > 0,
      earnedDate: workoutStats.completedWorkouts > 0 ? new Date().toISOString() : undefined
    },
    {
      id: '2',
      name: 'Early Bird',
      description: 'Complete 5 morning workouts',
      icon: Clock,
      category: 'consistency',
      points: 25,
      earned: workoutStats.completedWorkouts >= 5,
      earnedDate: workoutStats.completedWorkouts >= 5 ? new Date().toISOString() : undefined
    },
    {
      id: '3',
      name: 'Goal Setter',
      description: 'Set your first fitness goal',
      icon: Target,
      category: 'milestone',
      points: 15,
      earned: workoutStats.totalGoals > 0,
      earnedDate: workoutStats.totalGoals > 0 ? new Date().toISOString() : undefined
    },
    {
      id: '4',
      name: 'Goal Crusher',
      description: 'Complete your first goal',
      icon: Trophy,
      category: 'achievement',
      points: 50,
      earned: workoutStats.completedGoals > 0,
      earnedDate: workoutStats.completedGoals > 0 ? new Date().toISOString() : undefined
    },
    {
      id: '5',
      name: 'Consistency King',
      description: 'Complete 10 workouts',
      icon: Award,
      category: 'consistency',
      points: 100,
      earned: workoutStats.completedWorkouts >= 10,
      earnedDate: workoutStats.completedWorkouts >= 10 ? new Date().toISOString() : undefined
    },
    {
      id: '6',
      name: 'Champion',
      description: 'Complete 25 workouts',
      icon: Star,
      category: 'achievement',
      points: 250,
      earned: workoutStats.completedWorkouts >= 25,
      earnedDate: workoutStats.completedWorkouts >= 25 ? new Date().toISOString() : undefined
    },
    {
      id: '7',
      name: 'Fitness Guru',
      description: 'Complete 50 workouts',
      icon: Zap,
      category: 'mastery',
      points: 500,
      earned: workoutStats.completedWorkouts >= 50,
      earnedDate: workoutStats.completedWorkouts >= 50 ? new Date().toISOString() : undefined
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
      {/* Profile Header */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-semibold">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-xl sm:text-2xl truncate">
                    {profile?.full_name || profile?.username || 'User'}
                  </CardTitle>
                  {profile?.username && profile?.full_name && (
                    <CardDescription className="text-sm truncate">@{profile.username}</CardDescription>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{profile?.email || user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Joined {new Date(profile?.created_at || '').toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Dialog open={editing} onOpenChange={setEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={startEditing} className="flex-shrink-0">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          placeholder="Enter your username"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} className="flex-1">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <div className="min-w-0">
                <p className="text-2xl font-bold">{workoutStats.completedWorkouts}</p>
                <p className="text-sm text-muted-foreground truncate">Workouts Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <div className="min-w-0">
                <p className="text-2xl font-bold">{workoutStats.completedGoals}</p>
                <p className="text-sm text-muted-foreground truncate">Goals Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <div className="min-w-0">
                <p className="text-2xl font-bold">{earnedAchievements.length}</p>
                <p className="text-sm text-muted-foreground truncate">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <div className="min-w-0">
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground truncate">Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Workout Completion Rate</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Workouts:</span>
              <span className="ml-2 font-medium">{workoutStats.totalWorkouts}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Goals:</span>
              <span className="ml-2 font-medium">{workoutStats.totalGoals}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements ({earnedAchievements.length}/{achievements.length})
          </CardTitle>
          <CardDescription>
            You've earned {totalPoints} points from {earnedAchievements.length} achievements!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
