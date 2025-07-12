
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Target, Calendar, TrendingUp, Clock, Zap } from "lucide-react"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"

interface DashboardProps {
  onTabChange?: (tab: string, type?: string) => void
}

export function Dashboard({ onTabChange }: DashboardProps) {
  const { user } = useAuth()
  const { profile, getSportInfo, hasProfile } = useSportProfile()
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const sportInfo = getSportInfo(profile.primarySport)

  useEffect(() => {
    const fetchTodayWorkouts = async () => {
      if (!user) return
      
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const { data, error } = await supabase
          .from('scheduled_workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('scheduled_date', today)
          .order('workout_type', { ascending: true })

        if (error) throw error
        setTodayWorkouts(data || [])
      } catch (error) {
        console.error('Error fetching today scheduled workouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayWorkouts()
  }, [user])

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
          {todayWorkouts.map((workout) => {
            const isCompleted = workout.completed
            return (
              <div 
                key={workout.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : workout.workout_type === 'training' 
                      ? 'bg-pulse-blue/10 border-pulse-blue/20 hover:bg-pulse-blue/20'
                      : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
                }`}
                onClick={() => onTabChange?.('workouts', workout.workout_type)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-200' 
                      : workout.workout_type === 'training' 
                        ? 'bg-pulse-blue/20' 
                        : 'bg-orange-500/20'
                  }`}>
                    <Zap className={`h-5 w-5 ${
                      isCompleted 
                        ? 'text-green-600' 
                        : workout.workout_type === 'training' 
                          ? 'text-pulse-blue' 
                          : 'text-orange-500'
                    }`} />
                  </div>
                   <div>
                     <div className="font-medium">{workout.title}</div>
                     <div className="text-sm text-muted-foreground">
                       {format(new Date(), 'EEEE')} • {workout.session_time_of_day || 'morning'} • {workout.sport}
                     </div>
                   </div>
                </div>
                <Badge className={
                  isCompleted 
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : workout.workout_type === 'training' 
                      ? 'bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30'
                      : 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                }>
                  {isCompleted ? 'Completed ✓' : 'Ready'}
                </Badge>
              </div>
            )
          })}
          
          {todayWorkouts.length === 0 && !loading && (
            <>
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
                      {profile.sessionDuration} minutes • Generate new
                    </div>
                  </div>
                </div>
                <Badge className="bg-pulse-blue/20 text-pulse-blue border-pulse-blue/30">
                  Generate
                </Badge>
              </div>
              
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
                      45 minutes • Generate new
                    </div>
                  </div>
                </div>
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                  Generate
                </Badge>
              </div>
            </>
          )}
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
