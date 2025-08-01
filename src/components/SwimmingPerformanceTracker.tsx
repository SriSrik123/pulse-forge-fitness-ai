import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, TrendingUp, Timer } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SwimmingSet {
  exerciseName: string
  targetInterval: string
  actualTime: string
  notes?: string
}

interface SwimmingPerformanceTrackerProps {
  workout: any
  workoutId: string
  onPerformanceAdded: () => void
}

export function SwimmingPerformanceTracker({ workout, workoutId, onPerformanceAdded }: SwimmingPerformanceTrackerProps) {
  const [sets, setSets] = useState<SwimmingSet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Initialize sets from workout exercises
  useState(() => {
    if (workout.exercises && workout.exercises.length > 0) {
      const initialSets = workout.exercises.map((exercise: any) => ({
        exerciseName: `${exercise.name}: ${exercise.reps}`,
        targetInterval: exercise.interval || exercise.rest || "0:00",
        actualTime: "",
        notes: ""
      }))
      setSets(initialSets)
    }
  })

  const updateSet = (index: number, field: keyof SwimmingSet, value: string) => {
    setSets(prev => prev.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    ))
  }

  const addCustomSet = () => {
    setSets(prev => [...prev, {
      exerciseName: "",
      targetInterval: "",
      actualTime: "",
      notes: ""
    }])
  }

  const removeSet = (index: number) => {
    setSets(prev => prev.filter((_, i) => i !== index))
  }

  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseInt(parts[1]) || 0
      return minutes * 60 + seconds
    }
    return 0
  }

  const savePerformanceData = async () => {
    if (!user || sets.length === 0) return

    setIsLoading(true)
    try {
      const performanceData = sets
        .filter(set => set.actualTime.trim())
        .map(set => ({
          user_id: user.id,
          workout_id: workoutId,
          exercise_name: set.exerciseName,
          metric_type: 'swimming',
          time_seconds: parseTimeToSeconds(set.actualTime),
          notes: set.notes || `Target: ${set.targetInterval}, Actual: ${set.actualTime}`,
          value: parseTimeToSeconds(set.targetInterval) // Store target time for comparison
        }))

      if (performanceData.length === 0) {
        toast({
          title: "No Data",
          description: "Please enter at least one actual time",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from('workout_performance')
        .insert(performanceData)

      if (error) throw error

      toast({
        title: "Swimming Times Saved! 🏊‍♂️",
        description: `Recorded ${performanceData.length} swimming sets`
      })

      onPerformanceAdded()
    } catch (error) {
      console.error('Error saving swimming performance:', error)
      toast({
        title: "Error",
        description: "Failed to save swimming performance",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeInput = (value: string) => {
    // Remove non-digits and colons
    const cleaned = value.replace(/[^\d:]/g, '')
    
    // Auto-format as mm:ss
    if (cleaned.length <= 2) {
      return cleaned
    } else if (cleaned.length <= 4) {
      return cleaned.length === 3 ? `${cleaned[0]}:${cleaned.slice(1)}` : `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`
    }
    return cleaned.slice(0, 5) // Limit to mm:ss format
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-blue-500" />
          Swimming Performance
          <Badge variant="outline" className="text-blue-600">🏊‍♂️ {workout.sport}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Record your actual times for each set. Format: MM:SS (e.g., 1:15 for 1 minute 15 seconds)
        </div>

        <div className="space-y-3">
          {sets.map((set, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
              <div>
                <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300">Exercise/Set</Label>
                <Input
                  value={set.exerciseName}
                  onChange={(e) => updateSet(index, 'exerciseName', e.target.value)}
                  placeholder="e.g., 4x50 freestyle"
                  className="text-sm mt-1 bg-white/70 dark:bg-gray-800/70"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Target Interval</Label>
                  <Input
                    value={set.targetInterval}
                    onChange={(e) => updateSet(index, 'targetInterval', formatTimeInput(e.target.value))}
                    placeholder="1:00"
                    className="text-sm font-mono mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Actual Time *</Label>
                  <Input
                    value={set.actualTime}
                    onChange={(e) => updateSet(index, 'actualTime', formatTimeInput(e.target.value))}
                    placeholder="1:10"
                    className="text-sm font-mono mt-1 border-blue-300 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <Input
                    value={set.notes}
                    onChange={(e) => updateSet(index, 'notes', e.target.value)}
                    placeholder="felt good, need to work on technique"
                    className="text-sm mt-1"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeSet(index)}
                  className="mb-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={addCustomSet}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
          
          <Button 
            onClick={savePerformanceData} 
            disabled={isLoading || sets.every(set => !set.actualTime.trim())}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Saving..." : "Save Swimming Times"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          💡 Tip: Focus on consistency rather than speed. Good technique leads to better times!
        </div>
      </CardContent>
    </Card>
  )
}