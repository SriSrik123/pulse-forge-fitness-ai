
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Award, Target, Calendar } from "lucide-react"

export function Profile() {
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
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-pulse-blue to-pulse-cyan text-white">
                A
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">Alex Johnson</h2>
              <p className="text-muted-foreground">Fitness Enthusiast</p>
            </div>
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
