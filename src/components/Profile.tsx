
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Camera, Trophy, Star, Target, Calendar, Activity } from "lucide-react"
import { AchievementCard } from "./AchievementCard"

interface UserProfile {
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string | null
}

interface UserStats {
  totalWorkouts: number
  totalTime: number
  currentStreak: number
  achievements: number
}

export function Profile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    totalWorkouts: 0,
    totalTime: 0,
    currentStreak: 0,
    achievements: 0
  })
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: ""
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStats()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, email')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const profileData = {
        ...data,
        email: user.email
      }
      setProfile(profileData)
      setEditForm({
        full_name: data.full_name || "",
        username: data.username || ""
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set basic profile with user email if database fetch fails
      setProfile({
        full_name: null,
        username: null,
        avatar_url: null,
        email: user.email
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user) return

    try {
      // Fetch workout count
      const { count: workoutCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)

      // Fetch total workout time
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('duration')
        .eq('user_id', user.id)
        .eq('completed', true)
        .not('duration', 'is', null)

      const totalTime = workoutData?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0

      // Fetch achievements count
      const { count: achievementCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Calculate current streak (simplified - count consecutive days with workouts)
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(30)

      let currentStreak = 0
      if (recentWorkouts && recentWorkouts.length > 0) {
        const today = new Date()
        const workoutDates = recentWorkouts.map(w => new Date(w.created_at).toDateString())
        const uniqueDates = [...new Set(workoutDates)]
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(today.getDate() - i)
          
          if (uniqueDates.includes(checkDate.toDateString())) {
            currentStreak++
          } else {
            break
          }
        }
      }

      setStats({
        totalWorkouts: workoutCount || 0,
        totalTime: Math.round(totalTime / 60), // Convert to minutes
        currentStreak,
        achievements: achievementCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name || null,
          username: editForm.username || null
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name || null,
        username: editForm.username || null
      } : null)

      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase()
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-20 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Profile Header */}
      <Card className="glass border-0">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                <AvatarFallback className="bg-pulse-blue text-white text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="full_name" className="text-sm">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-sm">Username</Label>
                    <Input
                      id="username"
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      placeholder="Choose a username"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateProfile}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold truncate">
                    {profile?.full_name || "Add your name"}
                  </h2>
                  <p className="text-muted-foreground">
                    {profile?.username ? `@${profile.username}` : profile?.email}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="mt-2"
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass border-0">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-pulse-blue mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <div className="text-sm text-muted-foreground">Workouts</div>
          </CardContent>
        </Card>
        
        <Card className="glass border-0">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        
        <Card className="glass border-0">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatTime(stats.totalTime)}</div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </CardContent>
        </Card>
        
        <Card className="glass border-0">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.achievements}</div>
            <div className="text-sm text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AchievementCard 
              title="Welcome to CoachMe!"
              description="Complete your first workout"
              icon="🎯"
              earnedAt="2024-01-15"
              isEarned={stats.totalWorkouts > 0}
            />
            <AchievementCard 
              title="Consistency King"
              description="Complete 5 workouts"
              icon="👑"
              earnedAt={stats.totalWorkouts >= 5 ? "2024-01-20" : undefined}
              isEarned={stats.totalWorkouts >= 5}
            />
            <AchievementCard 
              title="Week Warrior"
              description="Maintain a 7-day streak"
              icon="🔥"
              earnedAt={stats.currentStreak >= 7 ? "2024-01-25" : undefined}
              isEarned={stats.currentStreak >= 7}
            />
            {stats.achievements === 0 && stats.totalWorkouts === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Complete your first workout to start earning achievements!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
