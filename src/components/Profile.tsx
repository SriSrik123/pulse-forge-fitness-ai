
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Award, Target, Calendar, Edit, Save, X } from "lucide-react"
import { toast } from "sonner"

export function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: ''
  })

  useEffect(() => {
    loadProfile()
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
      setEditForm({
        full_name: data.full_name || '',
        username: data.username || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
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
      loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }
  const achievements = [
    { name: "First Workout", icon: "🎯", earned: true },
    { name: "Week Warrior", icon: "🔥", earned: true },
    { name: "Consistency King", icon: "👑", earned: false },
    { name: "Strength Builder", icon: "💪", earned: true },
  ]

  const goals = [
    { name: "Weekly Workouts", current: 4, target: 5, unit: "workouts" },
    { name: "Monthly Steps", current: 180000, target: 250000, unit: "steps" },
    { name: "Calories Burned", current: 1200, target: 2000, unit: "kcal" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-pulse-blue to-pulse-cyan text-white">
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => toast.info('Profile picture upload coming soon!')}
              >
                <Edit className="h-3 w-3" />
              </Button>
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
                <div className="text-2xl font-bold text-pulse-blue">47</div>
                <div className="text-xs text-muted-foreground">Workouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pulse-green">12</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pulse-purple">8.2k</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-center ${
                  achievement.earned
                    ? 'bg-pulse-blue/10 border-pulse-blue/20'
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="text-sm font-medium">{achievement.name}</div>
                {achievement.earned && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Earned
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal, index) => {
            const progress = (goal.current / goal.target) * 100
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-muted-foreground">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "Today", activity: "Generated HIIT workout", time: "2 hours ago" },
              { date: "Yesterday", activity: "Completed Upper Body workout", time: "1 day ago" },
              { date: "Dec 3", activity: "Achieved weekly goal", time: "2 days ago" },
              { date: "Dec 2", activity: "New personal best: 10k steps", time: "3 days ago" },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/20">
                <div>
                  <div className="font-medium text-sm">{item.activity}</div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
                <div className="text-xs text-muted-foreground">{item.date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
