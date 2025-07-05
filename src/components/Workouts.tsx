
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Zap, Play } from "lucide-react"

export function Workouts() {
  const workouts = [
    {
      id: 1,
      name: "Morning HIIT Blast",
      duration: 25,
      intensity: "High",
      type: "HIIT",
      calories: 300,
      completed: false,
      date: "Today"
    },
    {
      id: 2,
      name: "Upper Body Strength",
      duration: 45,
      intensity: "Medium",
      type: "Strength",
      calories: 250,
      completed: true,
      date: "Yesterday"
    },
    {
      id: 3,
      name: "Yoga Flow",
      duration: 30,
      intensity: "Low",
      type: "Yoga",
      calories: 120,
      completed: true,
      date: "2 days ago"
    },
    {
      id: 4,
      name: "Leg Day Challenge",
      duration: 50,
      intensity: "High",
      type: "Strength",
      calories: 400,
      completed: true,
      date: "3 days ago"
    }
  ]

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-pulse-purple/20 text-pulse-purple'
      case 'Medium': return 'bg-pulse-blue/20 text-pulse-blue'
      case 'Low': return 'bg-pulse-green/20 text-pulse-green'
      default: return 'bg-muted/20 text-muted-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HIIT': return 'bg-red-500/20 text-red-500'
      case 'Strength': return 'bg-blue-500/20 text-blue-500'
      case 'Cardio': return 'bg-green-500/20 text-green-500'
      case 'Yoga': return 'bg-purple-500/20 text-purple-500'
      default: return 'bg-muted/20 text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Your Workouts</h2>
        <p className="text-muted-foreground">Track your fitness journey</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="glass border-0">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pulse-blue">47</div>
              <div className="text-xs text-muted-foreground">Total Workouts</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pulse-green">28.5</div>
              <div className="text-xs text-muted-foreground">Hours Trained</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {workouts.map((workout) => (
          <Card key={workout.id} className="glass border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-pulse-blue" />
                  <h3 className="font-semibold">{workout.name}</h3>
                </div>
                <div className="text-xs text-muted-foreground">{workout.date}</div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={getTypeColor(workout.type)}>
                  {workout.type}
                </Badge>
                <Badge className={getIntensityColor(workout.intensity)}>
                  {workout.intensity}
                </Badge>
                {workout.completed && (
                  <Badge className="bg-pulse-green/20 text-pulse-green">
                    Completed ✓
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {workout.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {workout.calories} cal
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant={workout.completed ? "outline" : "default"}
                disabled={workout.completed}
              >
                {workout.completed ? (
                  "Completed"
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Workout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
