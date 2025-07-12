
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Target, Calendar, TrendingUp, Clock, Zap } from "lucide-react"
import { useSportProfile } from "@/hooks/useSportProfile"

interface DashboardProps {
  onTabChange?: (tab: string, type?: string) => void
}

export function Dashboard({ onTabChange }: DashboardProps) {
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
              <span>0 / {profile.trainingFrequency}</span>
            </div>
            <Progress value={0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Complete your first workout to start tracking progress
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
          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-pulse-blue/10 border border-pulse-blue/20 cursor-pointer hover:bg-pulse-blue/20 transition-colors"
            onClick={() => onTabChange?.('workouts', 'training')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pulse-blue/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-pulse-blue" />
              </div>
              <div>
                <div className="font-medium">{sportInfo.label} Session</div>
                <div className="text-sm text-muted-foreground">
                  {profile.sessionDuration} minutes • Pre-generated
                </div>
              </div>
            </div>
            <Badge className="bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30">
              Ready
            </Badge>
          </div>
          
          {/* Show lifting workout if applicable */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
            onClick={() => onTabChange?.('workouts', 'strength')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="font-medium">Strength Training</div>
                <div className="text-sm text-muted-foreground">
                  45 minutes • Pre-generated
                </div>
              </div>
            </div>
            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
              Ready
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              ✓ Done
            </Button>
            <Button variant="outline" className="flex-1 border-red-500 text-red-500 hover:bg-red-50">
              ✗ Skip
            </Button>
          </div>
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start your first workout to see your activity history here
            </p>
            <Button size="sm" variant="outline">
              Generate First Workout
            </Button>
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
