import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Trophy, Target } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"

interface PerformanceData {
  id: string
  exercise_name: string
  metric_type: string
  value?: number
  unit?: string
  reps?: number
  sets?: number
  time_seconds?: number
  distance?: number
  notes?: string
  created_at: string
}

interface WorkoutPerformanceHistoryProps {
  workoutId?: string
  exerciseName?: string
  sport: string
}

export function WorkoutPerformanceHistory({ workoutId, exerciseName, sport }: WorkoutPerformanceHistoryProps) {
  const { user } = useAuth()
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadPerformanceHistory()
    }
  }, [user, workoutId, exerciseName])

  const loadPerformanceHistory = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('workout_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (workoutId) {
        query = query.eq('workout_id', workoutId)
      }

      if (exerciseName) {
        query = query.eq('exercise_name', exerciseName)
      }

      const { data, error } = await query.limit(10)

      if (error) throw error
      setPerformanceData(data || [])
    } catch (error) {
      console.error('Error loading performance history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPerformance = (data: PerformanceData) => {
    const { metric_type, value, unit, reps, sets, time_seconds, distance } = data

    if (metric_type === 'strength' && value && reps) {
      return `${value}${unit ? ` ${unit}` : ''} × ${reps} reps${sets ? ` (${sets} sets)` : ''}`
    }

    if (metric_type === 'cardio' && distance) {
      const timeStr = time_seconds ? ` in ${Math.floor(time_seconds / 60)}:${(time_seconds % 60).toString().padStart(2, '0')}` : ''
      return `${distance} ${unit || 'yards'}${timeStr}`
    }

    if (time_seconds) {
      return `${Math.floor(time_seconds / 60)}:${(time_seconds % 60).toString().padStart(2, '0')}`
    }

    if (value) {
      return `${value}${unit ? ` ${unit}` : ''}`
    }

    return 'Performance recorded'
  }

  const getMetricTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-red-500/20 text-red-700 border-red-500/30'
      case 'cardio':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      case 'endurance':
        return 'bg-green-500/20 text-green-700 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (performanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Trophy className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No performance data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete workouts to track your progress</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance History
          <Badge variant="outline" className="ml-auto">
            {performanceData.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {performanceData.map((data) => (
          <div key={data.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{data.exercise_name}</span>
                <Badge variant="outline" className={getMetricTypeColor(data.metric_type)}>
                  {data.metric_type}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatPerformance(data)}
              </div>
              {data.notes && (
                <div className="text-xs text-muted-foreground italic">
                  {data.notes}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(data.created_at), 'MMM d')}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}