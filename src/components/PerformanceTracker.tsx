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
  const [quickEntry, setQuickEntry] = useState("")
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

  const parseQuickEntry = (text: string, sport?: string) => {
    const entries: PerformanceEntry[] = []
    
    // Sport-specific parsing patterns
    const patterns = [
      // Strength: "bench press 120x8", "squat 200 lbs x 5"
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pounds?|kilograms?)?\s*x?\s*(\d+)\s*(?:reps?)?/gi,
      // Running: "ran 5 miles in 35:00" or "5k in 20:30"
      /(?:ran\s+)?(\d+(?:\.\d+)?)\s*(miles?|km|k|kilometers?)\s*(?:in\s+)?(\d+):(\d+)/gi,
      // Basketball: "made 15/20 free throws", "scored 25 points"
      /(?:made\s+)?(\d+)\/(\d+)\s*(\w+(?:\s+\w+)*)|(?:scored\s+)?(\d+)\s*points?/gi,
      // Soccer: "ran 7 miles", "scored 2 goals"  
      /(?:scored\s+)?(\d+)\s*goals?|(?:ran\s+)?(\d+(?:\.\d+)?)\s*miles?/gi,
      // Tennis: "won 6-4, 6-2", "hit 30 winners"
      /won\s+(\d+-\d+(?:,\s*\d+-\d+)*)|hit\s+(\d+)\s*(\w+)/gi,
      // Cycling: "rode 25 miles in 1:15:00"
      /(?:rode\s+)?(\d+(?:\.\d+)?)\s*miles?\s*(?:in\s+)?(\d+):(\d+)(?::(\d+))?/gi,
      // Swimming: "swam 1000 yards" (keep for swimming sport only)
      /(?:swam\s+)?(\d+)\s*(?:x\s*)?(\d+)?\s*(yards?|meters?)\s*(?:on\s+(\d+):(\d+))?/gi,
      // Time exercises: "plank 2:30"
      /(\w+(?:\s+\w+)*)\s+(\d+):(\d+)/gi
    ]

    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const groups = match.slice(1).filter(g => g !== undefined)
        
        // Handle different sport-specific patterns
        if (pattern.source.includes('miles?.*in')) {
          // Running: "5 miles in 35:00"
          const [distance, unit, minutes, seconds] = groups
          entries.push({
            exercise_name: `Running`,
            metric_type: 'cardio',
            distance: parseFloat(distance),
            unit: unit,
            time_seconds: parseInt(minutes) * 60 + parseInt(seconds)
          })
        } else if (pattern.source.includes('/')) {
          // Basketball: "15/20 free throws" or "25 points"
          if (groups.length >= 3 && groups[2]) {
            entries.push({
              exercise_name: groups[2],
              metric_type: 'performance',
              value: parseFloat(groups[0]),
              reps: parseInt(groups[1])
            })
          } else if (groups[3]) {
            entries.push({
              exercise_name: 'Scoring',
              metric_type: 'performance', 
              value: parseFloat(groups[3]),
              unit: 'points'
            })
          }
        } else if (pattern.source.includes('goals?')) {
          // Soccer: "scored 2 goals"
          entries.push({
            exercise_name: 'Goals',
            metric_type: 'performance',
            value: parseFloat(groups[0]),
            unit: 'goals'
          })
        } else if (pattern.source.includes('won.*-')) {
          // Tennis: "won 6-4, 6-2"
          entries.push({
            exercise_name: 'Match Result',
            metric_type: 'performance',
            notes: groups[0]
          })
        } else if (pattern.source.includes('hit.*winners')) {
          // Tennis: "hit 30 winners"
          entries.push({
            exercise_name: groups[2] || 'Shots',
            metric_type: 'performance',
            value: parseFloat(groups[1])
          })
        } else if (pattern.source.includes('rode.*miles')) {
          // Cycling: "rode 25 miles in 1:15:00"
          const [distance, minutes, seconds, hours] = groups
          const totalSeconds = (hours ? parseInt(hours) * 3600 : 0) + parseInt(minutes) * 60 + parseInt(seconds || '0')
          entries.push({
            exercise_name: 'Cycling',
            metric_type: 'cardio',
            distance: parseFloat(distance),
            unit: 'miles',
            time_seconds: totalSeconds
          })
        } else if (pattern.source.includes('yards?|meters?')) {
          // Swimming: "1000 yards" or "10x100 yards on 1:10"
          const [distance, sets, unit, minutes, seconds] = groups
          entries.push({
            exercise_name: 'Swimming',
            metric_type: 'cardio',
            distance: parseFloat(distance),
            unit: unit,
            sets: sets ? parseInt(sets) : undefined,
            time_seconds: minutes && seconds ? parseInt(minutes) * 60 + parseInt(seconds) : undefined
          })
        } else if (pattern.source.includes(':')) {
          // Time-based: "plank 2:30"
          const [exercise, minutes, seconds] = groups
          entries.push({
            exercise_name: exercise.trim(),
            metric_type: 'endurance',
            time_seconds: parseInt(minutes) * 60 + parseInt(seconds)
          })
        } else {
          // Strength: "bench press 120x8"
          const [exercise, weight, reps] = groups
          entries.push({
            exercise_name: exercise.trim(),
            metric_type: 'strength',
            value: parseFloat(weight),
            unit: 'lbs',
            reps: parseInt(reps)
          })
        }
      }
    })

    return entries
  }

  const getSportSpecificPlaceholder = (sport?: string) => {
    switch (sport?.toLowerCase()) {
      case 'basketball':
        return "Example: made 15/20 free throws, scored 25 points, 8 rebounds"
      case 'soccer':
        return "Example: scored 2 goals, ran 7 miles, 5 assists" 
      case 'tennis':
        return "Example: won 6-4 6-2, hit 30 winners, 15 aces"
      case 'cycling':
        return "Example: rode 25 miles in 1:15:00, bench press 120x8"
      case 'running':
        return "Example: ran 5 miles in 35:00, plank 2:30, bench press 120x8"
      case 'swimming':
        return "Example: swam 1000 yards, 10x100 yards on 1:30, bench press 120x8"
      default:
        return "Example: bench press 120x8, plank 2:30, ran 3 miles in 25:00"
    }
  }

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
        description: "Try sport-specific formats like examples shown",
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
              placeholder={getSportSpecificPlaceholder()}
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