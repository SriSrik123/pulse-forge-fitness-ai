import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, Trophy, Target, Timer, Activity, Waves, MapPin } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface PerformanceData {
  id: string
  workout_id?: string
  exercise_name: string
  metric_type: string
  value?: number
  unit?: string
  reps?: number
  sets?: number
  time_seconds?: number
  distance?: number
  created_at: string
  notes?: string
  sport: string
}

interface WorkoutData {
  id: string
  title: string
  sport: string
  duration: number
  completed: boolean
  created_at: string
  exercises: any
}

interface SportProgress {
  sport: string
  totalWorkouts: number
  totalDuration: number
  avgDuration: number
  recentPerformance: PerformanceData[]
  progressTrend: 'up' | 'down' | 'stable'
}

const SPORT_CATEGORIES = {
  swimming: {
    categories: ['Distance', 'Sprint', 'Technique', 'Endurance'],
    metrics: {
      'Distance': ['total_distance', 'pace_per_100'],
      'Sprint': ['sprint_time', '50m_time', '100m_time'],
      'Technique': ['stroke_count', 'efficiency_rating'],
      'Endurance': ['continuous_distance', 'heart_rate']
    },
    icon: "🏊‍♂️"
  },
  running: {
    categories: ['Distance', 'Speed', 'Endurance', 'Intervals'],
    metrics: {
      'Distance': ['total_distance', 'weekly_mileage'],
      'Speed': ['pace', 'sprint_time', '5k_time'],
      'Endurance': ['long_run_distance', 'max_distance'],
      'Intervals': ['interval_pace', 'recovery_time']
    },
    icon: "🏃‍♂️"
  },
  cycling: {
    categories: ['Distance', 'Speed', 'Power', 'Climbing'],
    metrics: {
      'Distance': ['total_distance', 'ride_time'],
      'Speed': ['avg_speed', 'max_speed'],
      'Power': ['avg_power', 'max_power', 'ftp'],
      'Climbing': ['elevation_gain', 'climbing_time']
    },
    icon: "🚴‍♂️"
  },
  basketball: {
    categories: ['Shooting', 'Skills', 'Fitness', 'Game Stats'],
    metrics: {
      'Shooting': ['free_throw_pct', 'three_point_pct', 'field_goal_pct'],
      'Skills': ['dribbling_time', 'passing_accuracy'],
      'Fitness': ['agility_time', 'vertical_jump'],
      'Game Stats': ['points', 'rebounds', 'assists']
    },
    icon: "🏀"
  },
  soccer: {
    categories: ['Technical', 'Physical', 'Tactical', 'Game Stats'],
    metrics: {
      'Technical': ['passing_accuracy', 'dribbling_success', 'shooting_accuracy'],
      'Physical': ['sprint_speed', 'endurance_time', 'agility'],
      'Tactical': ['positioning_score', 'decision_making'],
      'Game Stats': ['goals', 'assists', 'tackles']
    },
    icon: "⚽"
  },
  tennis: {
    categories: ['Serve', 'Groundstrokes', 'Fitness', 'Match Play'],
    metrics: {
      'Serve': ['first_serve_pct', 'ace_count', 'serve_speed'],
      'Groundstrokes': ['forehand_accuracy', 'backhand_accuracy'],
      'Fitness': ['court_movement', 'endurance_rating'],
      'Match Play': ['match_wins', 'set_wins', 'break_points']
    },
    icon: "🎾"
  }
}

export function SportSpecificProgress() {
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [sportProgress, setSportProgress] = useState<Record<string, SportProgress>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (selectedSport && selectedCategory) {
      generateCategoryChartData()
    }
  }, [selectedSport, selectedCategory, performanceData])

  const loadData = async () => {
    if (!user) return

    try {
      // Load workout data
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (workoutError) throw workoutError

      // Load performance data with workout info to get sport
      const { data: performance, error: perfError } = await supabase
        .from('workout_performance')
        .select(`
          *,
          workout:workouts(sport)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (perfError) throw perfError

      // Map performance data to include sport from workout
      const performanceWithSport: PerformanceData[] = (performance || []).map(perf => ({
        ...perf,
        sport: (perf as any).workout?.sport || 'general'
      }))

      setWorkoutData(workouts || [])
      setPerformanceData(performanceWithSport)

      // Process sport-specific progress
      const sportsProgress = processSportProgress(workouts || [], performanceWithSport)
      setSportProgress(sportsProgress)

      // Set default sport if none selected
      const availableSports = Object.keys(sportsProgress)
      if (availableSports.length > 0 && !selectedSport) {
        setSelectedSport(availableSports[0])
        const sportCategories = SPORT_CATEGORIES[availableSports[0] as keyof typeof SPORT_CATEGORIES]
        if (sportCategories) {
          setSelectedCategory(sportCategories.categories[0])
        }
      }

    } catch (error: any) {
      console.error('Error loading progress data:', error)
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processSportProgress = (workouts: WorkoutData[], performance: PerformanceData[]): Record<string, SportProgress> => {
    const sportsData: Record<string, SportProgress> = {}

    // Group workouts by sport
    workouts.forEach(workout => {
      if (!sportsData[workout.sport]) {
        sportsData[workout.sport] = {
          sport: workout.sport,
          totalWorkouts: 0,
          totalDuration: 0,
          avgDuration: 0,
          recentPerformance: [],
          progressTrend: 'stable'
        }
      }

      sportsData[workout.sport].totalWorkouts++
      sportsData[workout.sport].totalDuration += workout.duration || 0
    })

    // Calculate averages and add performance data
    Object.keys(sportsData).forEach(sport => {
      const sportData = sportsData[sport]
      sportData.avgDuration = sportData.totalDuration / sportData.totalWorkouts
      sportData.recentPerformance = performance
        .filter(p => p.sport === sport)
        .slice(0, 10) // Last 10 performance entries

      // Determine progress trend (simplified)
      const recentWorkouts = workouts
        .filter(w => w.sport === sport)
        .slice(0, 6)
        .reverse()

      if (recentWorkouts.length >= 3) {
        const firstHalf = recentWorkouts.slice(0, Math.floor(recentWorkouts.length / 2))
        const secondHalf = recentWorkouts.slice(Math.floor(recentWorkouts.length / 2))
        
        const firstAvg = firstHalf.reduce((sum, w) => sum + (w.duration || 0), 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, w) => sum + (w.duration || 0), 0) / secondHalf.length
        
        if (secondAvg > firstAvg * 1.1) sportData.progressTrend = 'up'
        else if (secondAvg < firstAvg * 0.9) sportData.progressTrend = 'down'
      }
    })

    return sportsData
  }

  const generateCategoryChartData = () => {
    if (!selectedSport || !selectedCategory) return

    const sportConfig = SPORT_CATEGORIES[selectedSport as keyof typeof SPORT_CATEGORIES]
    if (!sportConfig) return

    const relevantMetrics = (sportConfig.metrics[selectedCategory as keyof typeof sportConfig.metrics] as string[]) || []
    
    // Filter performance data for this sport and category
    const categoryData = performanceData
      .filter(p => p.sport === selectedSport)
      .filter(p => relevantMetrics.some(metric => 
        p.exercise_name.toLowerCase().includes(metric.replace('_', ' ')) ||
        p.metric_type.toLowerCase().includes(metric.replace('_', ' '))
      ))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-10) // Last 10 data points

    const chartPoints = categoryData.map((item, index) => ({
      date: new Date(item.created_at).toLocaleDateString(),
      value: item.value || item.time_seconds || item.distance || item.reps || 0,
      exercise: item.exercise_name,
      metric: item.metric_type,
      index: index + 1
    }))

    setChartData(chartPoints)
  }

  const getProgressTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default: return <Activity className="h-4 w-4 text-yellow-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress data...</p>
        </div>
      </div>
    )
  }

  const availableSports = Object.keys(sportProgress)

  if (availableSports.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Progress Data Yet</h3>
          <p className="text-muted-foreground">
            Complete some workouts to see your sport-specific progress here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const selectedSportConfig = SPORT_CATEGORIES[selectedSport as keyof typeof SPORT_CATEGORIES]
  const selectedSportData = sportProgress[selectedSport]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pulse-blue to-pulse-cyan bg-clip-text text-transparent">
            Sport-Specific Progress
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your performance by sport and training category
          </p>
        </div>
      </div>

      {/* Sport Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableSports.map(sport => {
          const data = sportProgress[sport]
          const config = SPORT_CATEGORIES[sport as keyof typeof SPORT_CATEGORIES]
          return (
            <Card 
              key={sport} 
              className={`cursor-pointer transition-colors ${
                selectedSport === sport ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setSelectedSport(sport)
                if (config) {
                  setSelectedCategory(config.categories[0])
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config?.icon || "🏃‍♂️"}</span>
                    <h3 className="font-semibold capitalize">{sport}</h3>
                  </div>
                  {getProgressTrendIcon(data.progressTrend)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workouts:</span>
                    <span className="font-medium">{data.totalWorkouts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Duration:</span>
                    <span className="font-medium">{Math.round(data.avgDuration)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Time:</span>
                    <span className="font-medium">{Math.round(data.totalDuration / 60)} hrs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Progress for Selected Sport */}
      {selectedSport && selectedSportConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">{selectedSportConfig.icon}</span>
              {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Progress Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-4">
                {selectedSportConfig.categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {selectedSportConfig.categories.map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">{category} Progress</h3>
                  </div>

                  {/* Category-specific metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {((selectedSportConfig.metrics[category as keyof typeof selectedSportConfig.metrics] as string[]) || []).map(metric => {
                      const relevantData = performanceData
                        .filter(p => p.sport === selectedSport)
                        .filter(p => 
                          p.exercise_name.toLowerCase().includes(metric.replace('_', ' ')) ||
                          p.metric_type.toLowerCase().includes(metric.replace('_', ' '))
                        )
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

                      const latestValue = relevantData[0]
                      const improvement = relevantData.length > 1 ? 
                        ((latestValue?.value || 0) - (relevantData[1]?.value || 0)) : 0

                      return (
                        <div key={metric} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground capitalize">
                            {metric.replace('_', ' ')}
                          </p>
                          <p className="text-lg font-semibold">
                            {latestValue?.value || latestValue?.time_seconds || latestValue?.distance || 'N/A'}
                            {latestValue?.unit && ` ${latestValue.unit}`}
                          </p>
                          {improvement !== 0 && (
                            <Badge variant={improvement > 0 ? "default" : "secondary"} className="text-xs">
                              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Chart */}
                  {chartData.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(label) => `Date: ${label}`}
                            formatter={(value: number, name: string) => [
                              `${value}`,
                              'Value'
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent Performance List */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent {category} Sessions</h4>
                    <div className="space-y-1">
                      {selectedSportData.recentPerformance
                        .filter(p => ((selectedSportConfig.metrics[category as keyof typeof selectedSportConfig.metrics] as string[]) || []).some((metric: string) =>
                          p.exercise_name.toLowerCase().includes(metric.replace('_', ' ')) ||
                          p.metric_type.toLowerCase().includes(metric.replace('_', ' '))
                        ))
                        .slice(0, 5)
                        .map((perf, index) => (
                          <div key={perf.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <span className="font-medium">{perf.exercise_name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {new Date(perf.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">
                                {perf.value || perf.time_seconds || perf.distance || perf.reps}
                                {perf.unit && ` ${perf.unit}`}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}