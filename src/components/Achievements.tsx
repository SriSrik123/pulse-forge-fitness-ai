import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Target, Star } from "lucide-react"
import { toast } from "sonner"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  earned?: boolean
  earned_at?: string
}

interface UserGoal {
  id: string
  name: string
  description: string
  target_value: number
  current_value: number
  unit: string
  category: string
  target_date: string
  completed: boolean
}

interface AchievementsProps {
  onBack: () => void
}

export function Achievements({ onBack }: AchievementsProps) {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Load achievements with user progress
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select(`
          *,
          user_achievements!left(earned_at)
        `)
        .order('category', { ascending: true })

      if (achievementsError) throw achievementsError

      // Load user goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (goalsError) throw goalsError

      // Process achievements to include earned status
      const processedAchievements = achievementsData.map((achievement: any) => ({
        ...achievement,
        earned: achievement.user_achievements.length > 0,
        earned_at: achievement.user_achievements[0]?.earned_at
      }))

      setAchievements(processedAchievements)
      setGoals(goalsData || [])

      // Calculate total points
      const earnedPoints = processedAchievements
        .filter((a: Achievement) => a.earned)
        .reduce((sum: number, a: Achievement) => sum + a.points, 0)
      setTotalPoints(earnedPoints)

    } catch (error) {
      console.error('Error loading achievements and goals:', error)
      toast.error('Failed to load achievements and goals')
    } finally {
      setLoading(false)
    }
  }

  const groupedAchievements = achievements.reduce((groups, achievement) => {
    const category = achievement.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(achievement)
    return groups
  }, {} as Record<string, Achievement[]>)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Achievements</h1>
      </div>

      <Card className="glass border-0">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="text-3xl font-bold">{totalPoints}</span>
            </div>
            <p className="text-muted-foreground">Total Achievement Points</p>
            <div className="flex justify-center gap-4 text-sm">
              <div>
                <span className="font-bold text-pulse-green">
                  {achievements.filter(a => a.earned).length}
                </span>
                <span className="text-muted-foreground"> earned</span>
              </div>
              <div>
                <span className="font-bold text-pulse-blue">
                  {achievements.length - achievements.filter(a => a.earned).length}
                </span>
                <span className="text-muted-foreground"> remaining</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <Card key={category} className="glass border-0">
          <CardHeader>
            <CardTitle className="capitalize flex items-center gap-2">
              <Star className="h-5 w-5" />
              {category} Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all ${
                    achievement.earned
                      ? 'bg-pulse-green/10 border-pulse-green/20 scale-[1.02]'
                      : 'bg-muted/30 border-muted opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        {achievement.earned && (
                          <Badge variant="secondary" className="text-xs">
                            Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-pulse-blue">
                          {achievement.points} points
                        </span>
                        {achievement.earned && achievement.earned_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(achievement.earned_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {goals.length > 0 && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal) => {
              const progress = Math.min((goal.current_value / goal.target_value) * 100, 100)
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{goal.name}</h4>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                    {goal.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {goal.target_date && (
                    <p className="text-xs text-muted-foreground">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}