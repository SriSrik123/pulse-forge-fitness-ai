
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Target, Calendar, TrendingUp, Clock, Zap } from "lucide-react"
import { useSportProfile } from "@/hooks/useSportProfile"

export function Dashboard() {
  const { profile, getSportInfo, hasProfile } = useSportProfile()
  const sportInfo = getSportInfo(profile.primarySport)

  if (!hasProfile()) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full pulse-gradient flex items-center justify-center">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to PulseTrack</h2>
          <p className="text-muted-foreground mb-4">
            Get started by setting up your sport profile
          </p>
          <Button className="pulse-gradient text-white">
            Complete Profile Setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{sportInfo.icon}</span>
          <h2 className="text-2xl font-bold">{sportInfo.label} Training</h2>
        </div>
        <p className="text-muted-foreground">
          {profile.experienceLevel} • {profile.competitiveLevel} level
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pulse-blue">4</div>
            <div className="text-xs text-muted-foreground">This Week</div>
            <div className="text-sm">Sessions</div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pulse-green">12</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
            <div className="text-sm">Consistency</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Training Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sessions Completed</span>
              <span>4 / {profile.trainingFrequency}</span>
            </div>
            <Progress value={(4 / profile.trainingFrequency) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {profile.trainingFrequency - 4} more sessions to reach your weekly goal
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Today's Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-pulse-blue/10 border border-pulse-blue/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pulse-blue/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-pulse-blue" />
              </div>
              <div>
                <div className="font-medium">AI {sportInfo.label} Session</div>
                <div className="text-sm text-muted-foreground">
                  {profile.sessionDuration} minutes • Personalized
                </div>
              </div>
            </div>
            <Badge className="bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30">
              Ready
            </Badge>
          </div>
          
          <Button className="w-full pulse-gradient text-white">
            Generate Today's Workout
          </Button>
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
              { 
                date: "Today", 
                activity: `Generated ${sportInfo.label} technique session`, 
                time: "2 hours ago",
                type: "training"
              },
              { 
                date: "Yesterday", 
                activity: `Completed supplementary gym workout`, 
                time: "1 day ago",
                type: "supplement"
              },
              { 
                date: "Dec 3", 
                activity: `${sportInfo.label} endurance session`, 
                time: "2 days ago",
                type: "training"
              },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'training' ? 'bg-pulse-blue' : 'bg-pulse-green'
                  }`} />
                  <div>
                    <div className="font-medium text-sm">{item.activity}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{item.date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {profile.currentGoals && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profile.currentGoals}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
