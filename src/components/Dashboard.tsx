
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Target, TrendingUp, Zap } from "lucide-react"

export function Dashboard() {
  const stats = [
    {
      title: "Today's Activity",
      value: "8,547",
      unit: "steps",
      progress: 68,
      icon: Activity,
      color: "pulse-blue"
    },
    {
      title: "Weekly Goal",
      value: "4/5",
      unit: "workouts",
      progress: 80,
      icon: Target,
      color: "pulse-green"
    },
    {
      title: "Calories Burned",
      value: "324",
      unit: "kcal",
      progress: 54,
      icon: Zap,
      color: "pulse-purple"
    },
    {
      title: "Streak",
      value: "12",
      unit: "days",
      progress: 100,
      icon: TrendingUp,
      color: "pulse-cyan"
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold mb-2">Good morning, Alex! 👋</h2>
        <p className="text-muted-foreground">Ready to crush your fitness goals today?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="glass border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 text-${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.unit}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.title}</div>
                  <Progress value={stat.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-lg">Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Upper Body Strength", date: "Today", duration: "45 min", intensity: "High" },
              { name: "HIIT Cardio", date: "Yesterday", duration: "30 min", intensity: "Medium" },
              { name: "Leg Day", date: "2 days ago", duration: "60 min", intensity: "High" }
            ].map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">{workout.name}</div>
                  <div className="text-sm text-muted-foreground">{workout.date} • {workout.duration}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workout.intensity === 'High' 
                    ? 'bg-pulse-purple/20 text-pulse-purple' 
                    : 'bg-pulse-green/20 text-pulse-green'
                }`}>
                  {workout.intensity}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
