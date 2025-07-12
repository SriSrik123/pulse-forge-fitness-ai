import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Activity, Heart, Zap, Clock, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface SmartwatchDataEntryProps {
  workoutId?: string
  onClose: () => void
}

export function SmartwatchDataEntry({ workoutId, onClose }: SmartwatchDataEntryProps) {
  const [heartRateData, setHeartRateData] = useState({
    avgHeartRate: "",
    maxHeartRate: "",
    restingHeartRate: "",
    heartRateZones: ""
  })
  
  const [performanceData, setPerformanceData] = useState({
    caloriesBurned: "",
    duration: "",
    averagePace: "",
    maxSpeed: "",
    elevationGain: "",
    steps: ""
  })
  
  const [recoveryData, setRecoveryData] = useState({
    perceivedExertion: "",
    sleepQuality: "",
    stressLevel: "",
    recoveryScore: "",
    notes: ""
  })
  
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSaveData = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const smartwatchData = {
        workout_id: workoutId,
        heart_rate_data: heartRateData,
        performance_data: performanceData,
        recovery_data: recoveryData,
        recorded_at: new Date().toISOString()
      }

      // Save to a new table for smartwatch data
      const { error } = await supabase
        .from('smartwatch_data')
        .insert({
          user_id: user.id,
          data: smartwatchData,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Data Saved Successfully",
        description: "Your smartwatch data has been recorded for future AI analysis.",
      })
      
      onClose()
    } catch (error) {
      console.error('Error saving smartwatch data:', error)
      toast({
        title: "Error",
        description: "Failed to save smartwatch data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-6 w-6 text-pulse-blue" />
          <h2 className="text-2xl font-bold">Smartwatch Data Entry</h2>
        </div>
        <p className="text-muted-foreground">
          Enter data from your smartwatch to help AI improve future workouts
        </p>
      </div>

      {/* Heart Rate Data */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Heart Rate Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Average Heart Rate (bpm)</Label>
              <Input
                type="number"
                placeholder="e.g., 145"
                value={heartRateData.avgHeartRate}
                onChange={(e) => setHeartRateData(prev => ({ ...prev, avgHeartRate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Heart Rate (bpm)</Label>
              <Input
                type="number"
                placeholder="e.g., 185"
                value={heartRateData.maxHeartRate}
                onChange={(e) => setHeartRateData(prev => ({ ...prev, maxHeartRate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Resting Heart Rate (bpm)</Label>
              <Input
                type="number"
                placeholder="e.g., 65"
                value={heartRateData.restingHeartRate}
                onChange={(e) => setHeartRateData(prev => ({ ...prev, restingHeartRate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Heart Rate Zones (minutes in each zone)</Label>
              <Input
                placeholder="e.g., Zone 1: 5min, Zone 2: 20min"
                value={heartRateData.heartRateZones}
                onChange={(e) => setHeartRateData(prev => ({ ...prev, heartRateZones: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Data */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Performance Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calories Burned</Label>
              <Input
                type="number"
                placeholder="e.g., 450"
                value={performanceData.caloriesBurned}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, caloriesBurned: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g., 45"
                value={performanceData.duration}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, duration: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Average Pace</Label>
              <Input
                placeholder="e.g., 6:30/mile or 2:15/100m"
                value={performanceData.averagePace}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, averagePace: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Speed</Label>
              <Input
                placeholder="e.g., 12 mph or 1.5 m/s"
                value={performanceData.maxSpeed}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, maxSpeed: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Elevation Gain (ft)</Label>
              <Input
                type="number"
                placeholder="e.g., 250"
                value={performanceData.elevationGain}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, elevationGain: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Steps</Label>
              <Input
                type="number"
                placeholder="e.g., 8500"
                value={performanceData.steps}
                onChange={(e) => setPerformanceData(prev => ({ ...prev, steps: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Data */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Recovery & Subjective Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Perceived Exertion (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 7"
                value={recoveryData.perceivedExertion}
                onChange={(e) => setRecoveryData(prev => ({ ...prev, perceivedExertion: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Sleep Quality Last Night (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 8"
                value={recoveryData.sleepQuality}
                onChange={(e) => setRecoveryData(prev => ({ ...prev, sleepQuality: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Stress Level (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 4"
                value={recoveryData.stressLevel}
                onChange={(e) => setRecoveryData(prev => ({ ...prev, stressLevel: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Recovery Score (if available)</Label>
              <Input
                placeholder="e.g., 75%"
                value={recoveryData.recoveryScore}
                onChange={(e) => setRecoveryData(prev => ({ ...prev, recoveryScore: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any additional observations about how you felt, environmental conditions, etc."
              value={recoveryData.notes}
              onChange={(e) => setRecoveryData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleSaveData}
          disabled={saving}
          className="flex-1 pulse-gradient text-white font-semibold"
        >
          {saving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Data
            </>
          )}
        </Button>
        
        <Button 
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <div className="text-center">
        <Badge variant="outline" className="text-xs">
          This data helps AI understand your body's response to training
        </Badge>
      </div>
    </div>
  )
}