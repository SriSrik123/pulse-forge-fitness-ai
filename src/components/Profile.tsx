
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Award, Edit, Save, X, Trophy } from "lucide-react"
import { toast } from "sonner"

interface Achievement {
  id: string
  name: string
  icon: string
  earned: boolean
  points: number
}

interface UserStats {
  workouts_completed: number
  current_streak: number
  total_calories: number
}

interface ProfileProps {
  onShowAchievements: () => void
}

export function Profile({ onShowAchievements }: ProfileProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    workouts_completed: 0,
    current_streak: 0,
    total_calories: 0
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: ''
  })

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)
      setEditForm({
        full_name: profileData.full_name || '',
        username: profileData.username || ''
      })

      // Load user achievements (top 4)
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select(`
          id,
          name,
          icon,
          points,
          user_achievements!left(earned_at)
        `)
        .limit(4)

      if (achievementsError) throw achievementsError

      const processedAchievements = achievementsData.map((achievement: any) => ({
        id: achievement.id,
        name: achievement.name,
        icon: achievement.icon,
        earned: achievement.user_achievements.length > 0,
        points: achievement.points
      }))

      setAchievements(processedAchievements)

      // Load user stats from workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('completed, created_at')
        .eq('user_id', user.id)

      if (workoutsError) throw workoutsError

      const completedWorkouts = workoutsData?.filter(w => w.completed) || []
      setUserStats({
        workouts_completed: completedWorkouts.length,
        current_streak: calculateStreak(completedWorkouts),
        total_calories: completedWorkouts.length * 300 // Rough estimate
      })

    } catch (error) {
      console.error('Error loading profile data:', error)
    }
  }

  const calculateStreak = (workouts: any[]) => {
    if (workouts.length === 0) return 0
    
    const sortedDates = workouts
      .map(w => new Date(w.created_at).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      streak = 1
      // Simple streak calculation - could be improved
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i])
        const prevDate = new Date(sortedDates[i-1])
        const diffDays = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (diffDays <= 1) {
          streak++
        } else {
          break
        }
      }
    }
    
    return streak
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user!.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: data.publicUrl,
        })
        .eq('id', user!.id)

      if (updateError) {
        throw updateError
      }

      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }))
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          username: editForm.username
        })
        .eq('id', user?.id)

      if (error) throw error
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      loadData()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt="Profile picture" />
                )}
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-pulse-blue to-pulse-cyan text-white">
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-3 w-3" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
              />
            </div>
            
            {isEditing ? (
              <div className="space-y-4 w-full max-w-sm">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} size="sm" className="bg-pulse-green hover:bg-pulse-green/80">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{profile?.full_name || 'No name set'}</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-muted-foreground">@{profile?.username || 'No username'}</p>
              </div>
            )}
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-pulse-blue">{userStats.workouts_completed}</div>
                <div className="text-xs text-muted-foreground">Workouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pulse-green">{userStats.current_streak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pulse-purple">{userStats.total_calories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onShowAchievements}
              className="text-xs"
            >
              View All <Trophy className="h-3 w-3 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {achievements.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border text-center transition-all ${
                  achievement.earned
                    ? 'bg-pulse-green/10 border-pulse-green/20'
                    : 'bg-muted/30 border-muted opacity-75'
                }`}
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="text-sm font-medium">{achievement.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {achievement.points} pts
                </div>
              </div>
            ))}
          </div>
          {achievements.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Complete your first workout to start earning achievements!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
