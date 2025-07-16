
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AchievementCard } from "./AchievementCard"
import { 
  Trophy, 
  Target, 
  Calendar, 
  Zap, 
  Award, 
  Star, 
  Medal, 
  Crown, 
  Flame, 
  TrendingUp,
  Clock,
  Activity,
  Heart,
  Dumbbell,
  Timer,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Mountain,
  Users,
  Coffee,
  Moon,
  Sun
} from "lucide-react"

const achievements = [
  {
    icon: Trophy,
    title: "First Victory",
    description: "Complete your first workout session",
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    rarity: 'common' as const
  },
  {
    icon: Calendar,
    title: "Weekly Warrior",
    description: "Complete workouts for 7 consecutive days",
    progress: 5,
    maxProgress: 7,
    isUnlocked: false,
    rarity: 'rare' as const
  },
  {
    icon: Flame,
    title: "On Fire",
    description: "Maintain a 30-day workout streak",
    progress: 12,
    maxProgress: 30,
    isUnlocked: false,
    rarity: 'epic' as const
  },
  {
    icon: Crown,
    title: "Fitness Royalty",
    description: "Complete 100 total workouts",
    progress: 25,
    maxProgress: 100,
    isUnlocked: false,
    rarity: 'legendary' as const
  },
  {
    icon: Target,
    title: "Goal Crusher",
    description: "Achieve 5 personal fitness goals",
    progress: 2,
    maxProgress: 5,
    isUnlocked: false,
    rarity: 'rare' as const
  },
  {
    icon: Zap,
    title: "Power Hour",
    description: "Complete a 60-minute intense workout",
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    rarity: 'common' as const
  },
  {
    icon: Heart,
    title: "Cardio King",
    description: "Complete 50 cardio sessions",
    progress: 23,
    maxProgress: 50,
    isUnlocked: false,
    rarity: 'rare' as const
  },
  {
    icon: Dumbbell,
    title: "Strength Master",
    description: "Complete 50 strength training sessions",
    progress: 18,
    maxProgress: 50,
    isUnlocked: false,
    rarity: 'rare' as const
  },
  {
    icon: Timer,
    title: "Speed Demon",
    description: "Complete a workout in under 15 minutes",
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    rarity: 'common' as const
  },
  {
    icon: Mountain,
    title: "Peak Performer",
    description: "Reach your highest intensity level",
    progress: 0,
    maxProgress: 1,
    isUnlocked: false,
    rarity: 'epic' as const
  },
  {
    icon: Star,
    title: "Rising Star",
    description: "Get 5-star rating on 10 workouts",
    progress: 3,
    maxProgress: 10,
    isUnlocked: false,
    rarity: 'rare' as const
  },
  {
    icon: Users,
    title: "Team Player",
    description: "Complete 10 group workouts",
    progress: 2,
    maxProgress: 10,
    isUnlocked: false,
    rarity: 'common' as const
  },
  {
    icon: Coffee,
    title: "Early Bird",
    description: "Complete 20 morning workouts",
    progress: 8,
    maxProgress: 20,
    isUnlocked: false,
    rarity: 'common' as const
  },
  {
    icon: Moon,
    title: "Night Owl",
    description: "Complete 20 evening workouts",
    progress: 15,
    maxProgress: 20,
    isUnlocked: false,
    rarity: 'common' as const
  },
  {
    icon: Sparkles,
    title: "Consistency Champion",
    description: "Never miss a scheduled workout for 2 weeks",
    progress: 8,
    maxProgress: 14,
    isUnlocked: false,
    rarity: 'epic' as const
  },
  {
    icon: BarChart3,
    title: "Progress Tracker",
    description: "Log your progress for 30 consecutive days",
    progress: 12,
    maxProgress: 30,
    isUnlocked: false,
    rarity: 'rare' as const
  }
]

const stats = [
  { label: "Total Workouts", value: "47", icon: Activity },
  { label: "Current Streak", value: "5 days", icon: Flame },
  { label: "Total Time", value: "32.5h", icon: Clock },
  { label: "Achievements", value: "3/16", icon: Trophy }
]

export function Profile() {
  const [activeTab, setActiveTab] = useState("overview")
  
  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const lockedAchievements = achievements.filter(a => !a.isUnlocked)

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">JD</span>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold mb-2">John Doe</h1>
                <p className="text-muted-foreground mb-3">Fitness Enthusiast • Level 12</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Member
                  </Badge>
                  <Badge variant="outline">
                    <Target className="w-3 h-3 mr-1" />
                    Goal Focused
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-4 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="achievements" className="text-sm">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Full Body Strength</p>
                      <p className="text-xs text-muted-foreground">45 minutes • Today</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                    Completed
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Cardio HIIT</p>
                      <p className="text-xs text-muted-foreground">30 minutes • Yesterday</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
                    Completed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Upper Body Focus</p>
                      <p className="text-xs text-muted-foreground">40 minutes • 2 days ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-700">
                    Completed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Current Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Current Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weekly Workout Goal</span>
                    <span className="font-medium">5/7 sessions</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: '71%' }} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Distance</span>
                    <span className="font-medium">42/50 km</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 rounded-full h-2" style={{ width: '84%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Strength Sessions</span>
                    <span className="font-medium">8/12 this month</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2" style={{ width: '67%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6 mt-6">
            {/* Achievement Summary */}
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Achievement Progress</h3>
                    <p className="text-muted-foreground mb-2">
                      {unlockedAchievements.length} of {achievements.length} achievements unlocked
                    </p>
                    <div className="w-48 bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
                  Unlocked Achievements
                </h3>
                <div className="grid gap-4">
                  {unlockedAchievements.map((achievement, index) => (
                    <AchievementCard key={`unlocked-${index}`} {...achievement} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Medal className="h-5 w-5 text-muted-foreground" />
                In Progress
              </h3>
              <div className="grid gap-4">
                {lockedAchievements.map((achievement, index) => (
                  <AchievementCard key={`locked-${index}`} {...achievement} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
