
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { AchievementCard } from './AchievementCard'
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Edit, 
  Save, 
  X,
  Trophy,
  Target,
  Zap,
  Award,
  Star,
  Medal,
  Crown,
  Shield,
  Flame
} from 'lucide-react'

interface ProfileData {
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string | null
  preferences: any
}

const Profile: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    phone: ''
  })

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data as ProfileData
    },
    enabled: !!user?.id
  })

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const [workoutsResult, goalsResult, achievementsResult] = await Promise.all([
        supabase.from('workouts').select('*').eq('user_id', user.id),
        supabase.from('user_goals').select('*').eq('user_id', user.id),
        supabase.from('user_achievements').select('*').eq('user_id', user.id)
      ])
      
      return {
        totalWorkouts: workoutsResult.data?.length || 0,
        completedWorkouts: workoutsResult.data?.filter(w => w.completed).length || 0,
        totalGoals: goalsResult.data?.length || 0,
        completedGoals: goalsResult.data?.filter(g => g.completed).length || 0,
        totalAchievements: achievementsResult.data?.length || 0
      }
    },
    enabled: !!user?.id
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.preferences?.bio || '',
        location: profile.preferences?.location || '',
        phone: profile.preferences?.phone || ''
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          username: formData.username,
          preferences: {
            ...profile?.preferences,
            bio: formData.bio,
            location: formData.location,
            phone: formData.phone
          },
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
      
      setIsEditing(false)
      refetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.preferences?.bio || '',
        location: profile.preferences?.location || '',
        phone: profile.preferences?.phone || ''
      })
    }
    setIsEditing(false)
  }

  // Mock achievements data (in a real app, this would come from the database)
  const achievements = [
    {
      id: '1',
      name: 'First Workout',
      description: 'Complete your first workout',
      icon: Trophy,
      category: 'milestone',
      points: 10,
      earned: true,
      earnedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Complete 7 workouts in a week',
      icon: Target,
      category: 'consistency',
      points: 25,
      earned: true,
      earnedDate: '2024-01-22'
    },
    {
      id: '3',
      name: 'Speed Demon',
      description: 'Complete a workout in under 30 minutes',
      icon: Zap,
      category: 'performance',
      points: 15,
      earned: false,
      earnedDate: ''
    },
    {
      id: '4',
      name: 'Goal Crusher',
      description: 'Complete 5 fitness goals',
      icon: Award,
      category: 'achievement',
      points: 50,
      earned: false,
      earnedDate: ''
    }
  ]

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button 
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.full_name || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              {isEditing ? (
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.username || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not available'}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.phone || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter your location"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.location || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{formData.bio || 'No bio added yet'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.totalWorkouts || 0}</div>
            <p className="text-sm text-muted-foreground">Total Workouts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats?.completedWorkouts || 0}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats?.totalGoals || 0}</div>
            <p className="text-sm text-muted-foreground">Goals Set</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats?.totalAchievements || 0}</div>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {achievements.slice(0, 3).map((achievement) => (
              <AchievementCard
                key={achievement.id}
                icon={achievement.icon}
                title={achievement.name}
                description={achievement.description}
                progress={achievement.earned ? 1 : 0}
                maxProgress={1}
                isUnlocked={achievement.earned}
                rarity="common"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
