import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface PerformanceEntry {
  exercise_name: string
  metric_type: string
  value?: number
  unit?: string
  reps?: number
  sets?: number
  time_seconds?: number
  distance?: number
  notes?: string
}

interface PerformanceTrackerProps {
  workoutId: string
  onPerformanceAdded: () => void
}

export function PerformanceTracker({ workoutId, onPerformanceAdded }: PerformanceTrackerProps) {
  const [entries, setEntries] = useState<PerformanceEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState<PerformanceEntry>({
    exercise_name: "",
    metric_type: "strength"
  })
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const addEntry = () => {
    if (!currentEntry.exercise_name.trim()) return
    
    setEntries([...entries, { ...currentEntry }])
    setCurrentEntry({
      exercise_name: "",
      metric_type: "strength"
    })
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const savePerformanceData = async () => {
    if (!user || entries.length === 0) return

    setIsLoading(true)
    try {
      const performanceData = entries.map(entry => ({
        user_id: user.id,
        workout_id: workoutId,
        ...entry
      }))

      const { error } = await supabase
        .from('workout_performance')
        .insert(performanceData)

      if (error) throw error

      toast({
        title: "Success!",
        description: `Saved ${entries.length} performance entries`
      })

      setEntries([])
      onPerformanceAdded()
    } catch (error) {
      console.error('Error saving performance data:', error)
      toast({
        title: "Error",
        description: "Failed to save performance data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const parseQuickEntry = (text: string) => {
    const entries: PerformanceEntry[] = []
    
    // Parse patterns like "bench 120x8", "swim 10x100 yards on 1:10", etc.
    const patterns = [
      // Strength: "bench 120x8" or "bench 120 lbs x 8 reps"
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pounds?|kilograms?)?\s*x?\s*(\d+)\s*(?:reps?)?/gi,
      // Cardio distance: "swim 10x100 yards" or "run 5 miles"
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(yards?|meters?|miles?|km|kilometers?)/gi,
      // Cardio time: "plank 2:30" or "run 25:00"
      /(\w+(?:\s+\w+)*)\s+(\d+):(\d+)/gi
    ]

    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const [, exercise, value1, value2OrUnit, value3] = match
        
        if (pattern.source.includes('yards?|meters?')) {
          // Distance exercise
          entries.push({
            exercise_name: exercise.trim(),
            metric_type: 'cardio',
            distance: parseFloat(value1),
            unit: value2OrUnit,
            reps: value3 ? parseInt(value3) : undefined
          })
        } else if (pattern.source.includes(':')) {
          // Time exercise (value1:value2 format)
          const totalSeconds = parseInt(value1) * 60 + parseInt(value2OrUnit)
          entries.push({
            exercise_name: exercise.trim(),
            metric_type: 'endurance',
            time_seconds: totalSeconds
          })
        } else {
          // Strength exercise
          entries.push({
            exercise_name: exercise.trim(),
            metric_type: 'strength',
            value: parseFloat(value1),
            unit: 'lbs',
            reps: parseInt(value2OrUnit)
          })
        }
      }
    })

    return entries
  }

  const [quickEntry, setQuickEntry] = useState("")

  const handleQuickEntry = () => {
    const parsed = parseQuickEntry(quickEntry)
    if (parsed.length > 0) {
      setEntries([...entries, ...parsed])
      setQuickEntry("")
      toast({
        title: "Parsed performance data",
        description: `Added ${parsed.length} exercises`
      })
    } else {
      toast({
        title: "Could not parse",
        description: "Try formats like 'bench 120x8' or 'swim 10x100 yards'",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Track Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Entry */}
        <div className="space-y-2">
          <Label>Quick Entry</Label>
          <div className="flex gap-2">
            <Textarea
              placeholder="Example: bench 120x8, swim 10x100 yards on 1:10, plank 2:30"
              value={quickEntry}
              onChange={(e) => setQuickEntry(e.target.value)}
              className="min-h-[60px]"
            />
            <Button onClick={handleQuickEntry} disabled={!quickEntry.trim()}>
              Parse
            </Button>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Exercise</Label>
            <Input
              value={currentEntry.exercise_name}
              onChange={(e) => setCurrentEntry({ ...currentEntry, exercise_name: e.target.value })}
              placeholder="e.g., Bench Press, Swimming"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={currentEntry.metric_type}
              onValueChange={(value) => setCurrentEntry({ ...currentEntry, metric_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {currentEntry.metric_type === 'strength' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Weight</Label>
              <Input
                type="number"
                value={currentEntry.value || ''}
                onChange={(e) => setCurrentEntry({ ...currentEntry, value: parseFloat(e.target.value) || undefined })}
                placeholder="120"
              />
            </div>
            <div>
              <Label>Reps</Label>
              <Input
                type="number"
                value={currentEntry.reps || ''}
                onChange={(e) => setCurrentEntry({ ...currentEntry, reps: parseInt(e.target.value) || undefined })}
                placeholder="8"
              />
            </div>
            <div>
              <Label>Sets</Label>
              <Input
                type="number"
                value={currentEntry.sets || ''}
                onChange={(e) => setCurrentEntry({ ...currentEntry, sets: parseInt(e.target.value) || undefined })}
                placeholder="3"
              />
            </div>
          </div>
        )}

        {currentEntry.metric_type === 'cardio' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Distance</Label>
              <Input
                type="number"
                value={currentEntry.distance || ''}
                onChange={(e) => setCurrentEntry({ ...currentEntry, distance: parseFloat(e.target.value) || undefined })}
                placeholder="100"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Select
                value={currentEntry.unit || ''}
                onValueChange={(value) => setCurrentEntry({ ...currentEntry, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yards">Yards</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                  <SelectItem value="km">Kilometers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div>
          <Label>Notes (optional)</Label>
          <Input
            value={currentEntry.notes || ''}
            onChange={(e) => setCurrentEntry({ ...currentEntry, notes: e.target.value })}
            placeholder="Any additional notes..."
          />
        </div>

        <Button onClick={addEntry} disabled={!currentEntry.exercise_name.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <Label>Performance Entries</Label>
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{entry.metric_type}</Badge>
                    <span className="font-medium">{entry.exercise_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {entry.metric_type === 'strength' && `${entry.value} lbs x ${entry.reps} reps`}
                      {entry.metric_type === 'cardio' && `${entry.distance} ${entry.unit}`}
                      {entry.metric_type === 'endurance' && entry.time_seconds && 
                        `${Math.floor(entry.time_seconds / 60)}:${(entry.time_seconds % 60).toString().padStart(2, '0')}`
                      }
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeEntry(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              onClick={savePerformanceData} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Performance Data"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}