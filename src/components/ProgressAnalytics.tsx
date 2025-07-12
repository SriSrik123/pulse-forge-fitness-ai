import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, Trophy, Target, Calendar, Download } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
  created_at: string
  workout_title: string
}

interface ChartData {
  date: string
  value: number
  workout: string
}

export function ProgressAnalytics() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>("")
  const [exercises, setExercises] = useState<string[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [personalRecords, setPersonalRecords] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadPerformanceData()
  }, [user])

  useEffect(() => {
    if (selectedExercise && performanceData.length > 0) {
      generateChartData()
    }
  }, [selectedExercise, performanceData])

  const loadPerformanceData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('workout_performance')
        .select(`
          *,
          workout:workouts(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedData = data?.map(item => ({
        ...item,
        workout_title: item.workout?.title || 'Unknown Workout'
      })) || []

      setPerformanceData(formattedData)
      
      // Get unique exercises
      const uniqueExercises = Array.from(new Set(formattedData.map(item => item.exercise_name)))
      setExercises(uniqueExercises)
      
      if (uniqueExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(uniqueExercises[0])
      }

      // Calculate personal records
      calculatePersonalRecords(formattedData)
    } catch (error) {
      console.error('Error loading performance data:', error)
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePersonalRecords = (data: PerformanceData[]) => {
    const records: Record<string, any> = {}
    
    data.forEach(item => {
      const key = item.exercise_name
      
      if (!records[key]) {
        records[key] = {
          maxWeight: 0,
          maxReps: 0,
          bestTime: Infinity,
          maxDistance: 0,
          latestDate: ''
        }
      }

      if (item.value && item.value > records[key].maxWeight) {
        records[key].maxWeight = item.value
        records[key].maxWeightUnit = item.unit
      }
      
      if (item.reps && item.reps > records[key].maxReps) {
        records[key].maxReps = item.reps
      }
      
      if (item.time_seconds && item.time_seconds < records[key].bestTime) {
        records[key].bestTime = item.time_seconds
      }
      
      if (item.distance && item.distance > records[key].maxDistance) {
        records[key].maxDistance = item.distance
        records[key].maxDistanceUnit = item.unit
      }
      
      records[key].latestDate = item.created_at
    })

    setPersonalRecords(records)
  }

  const generateChartData = () => {
    const exerciseData = performanceData.filter(item => item.exercise_name === selectedExercise)
    
    const chartPoints: ChartData[] = exerciseData.map(item => {
      let value = 0
      
      if (item.metric_type === 'strength' && item.value) {
        value = item.value
      } else if (item.metric_type === 'cardio' && item.distance) {
        value = item.distance
      } else if (item.metric_type === 'endurance' && item.time_seconds) {
        value = item.time_seconds / 60 // Convert to minutes
      }
      
      return {
        date: new Date(item.created_at).toLocaleDateString(),
        value,
        workout: item.workout_title
      }
    })

    setChartData(chartPoints)
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Exercise', 'Type', 'Value', 'Unit', 'Reps', 'Sets', 'Time (sec)', 'Distance', 'Workout'].join(','),
      ...performanceData.map(item => [
        new Date(item.created_at).toLocaleDateString(),
        item.exercise_name,
        item.metric_type,
        item.value || '',
        item.unit || '',
        item.reps || '',
        item.sets || '',
        item.time_seconds || '',
        item.distance || '',
        item.workout_title
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workout_performance.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Performance data exported to CSV"
    })
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

  if (performanceData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-muted-foreground">
            Complete workouts with performance tracking to see your progress analytics here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const selectedRecord = personalRecords[selectedExercise]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pulse-blue to-pulse-cyan bg-clip-text text-transparent">
            Progress Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your performance improvements over time
          </p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Workouts Tracked</p>
                <p className="text-2xl font-bold">
                  {new Set(performanceData.map(item => item.workout_title)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercises Tracked</p>
                <p className="text-2xl font-bold">{exercises.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance Entries</p>
                <p className="text-2xl font-bold">{performanceData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select an exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(exercise => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRecord && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                {selectedRecord.maxWeight > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max Weight</p>
                    <p className="text-lg font-semibold">
                      {selectedRecord.maxWeight} {selectedRecord.maxWeightUnit}
                    </p>
                  </div>
                )}
                {selectedRecord.maxReps > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max Reps</p>
                    <p className="text-lg font-semibold">{selectedRecord.maxReps}</p>
                  </div>
                )}
                {selectedRecord.bestTime < Infinity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Best Time</p>
                    <p className="text-lg font-semibold">
                      {Math.floor(selectedRecord.bestTime / 60)}:{(selectedRecord.bestTime % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                )}
                {selectedRecord.maxDistance > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max Distance</p>
                    <p className="text-lg font-semibold">
                      {selectedRecord.maxDistance} {selectedRecord.maxDistanceUnit}
                    </p>
                  </div>
                )}
              </div>
            )}

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
                        `${value}${selectedRecord?.maxWeightUnit || ''}`,
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}