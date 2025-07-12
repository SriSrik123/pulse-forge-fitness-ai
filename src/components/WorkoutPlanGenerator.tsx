import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Target, Plus, Minus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { useToast } from "@/hooks/use-toast"

const SPORTS = [
  { value: "swimming", label: "Swimming", icon: "🏊‍♂️" },
  { value: "running", label: "Running", icon: "🏃‍♂️" },
  { value: "cycling", label: "Cycling", icon: "🚴‍♂️" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
  { value: "tennis", label: "Tennis", icon: "🎾" },
  { value: "weightlifting", label: "Weight Training", icon: "🏋️‍♀️" },
]

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

interface SportPreference {
  sport: string
  frequency: number
  preferredDays: string[]
  sessionDuration: number
  equipment: string[]
}

export function WorkoutPlanGenerator() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { profile } = useSportProfile()
  
  const [planTitle, setPlanTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [includesStrength, setIncludesStrength] = useState(false)
  const [multipleSessionsPerDay, setMultipleSessionsPerDay] = useState(false)
  const [sportPreferences, setSportPreferences] = useState<SportPreference[]>([
    {
      sport: profile.primarySport || "swimming",
      frequency: 3,
      preferredDays: ["monday", "wednesday", "friday"],
      sessionDuration: profile.sessionDuration || 60,
      equipment: []
    }
  ])
  const [aiPreferences, setAiPreferences] = useState("")
  const [generating, setGenerating] = useState(false)

  const getEquipmentForSport = (sport: string) => {
    const equipmentMap: Record<string, string[]> = {
      swimming: ["Kickboard", "Pull Buoy", "Fins", "Paddles", "Snorkel", "Resistance Bands"],
      running: ["Running Shoes", "Heart Rate Monitor", "Resistance Bands", "Foam Roller"],
      cycling: ["Bike", "Helmet", "Water Bottle", "Bike Computer"],
      basketball: ["Basketball", "Resistance Bands", "Agility Ladder", "Cones"],
      soccer: ["Soccer Ball", "Cones", "Agility Ladder", "Resistance Bands"],
      tennis: ["Tennis Racket", "Tennis Balls", "Resistance Bands", "Agility Ladder"],
      weightlifting: ["Dumbbells", "Barbell", "Weight Plates", "Bench", "Squat Rack"],
      default: ["Resistance Bands", "Dumbbells", "Medicine Ball", "Foam Roller"]
    }
    return equipmentMap[sport] || equipmentMap.default
  }

  const addSportPreference = () => {
    setSportPreferences([...sportPreferences, {
      sport: "swimming",
      frequency: 1,
      preferredDays: ["monday"],
      sessionDuration: 60,
      equipment: []
    }])
  }

  const removeSportPreference = (index: number) => {
    setSportPreferences(sportPreferences.filter((_, i) => i !== index))
  }

  const updateSportPreference = (index: number, field: string, value: any) => {
    const updated = [...sportPreferences]
    updated[index] = { ...updated[index], [field]: value }
    setSportPreferences(updated)
  }

  const toggleEquipment = (sportIndex: number, equipment: string) => {
    const updated = [...sportPreferences]
    const currentEquipment = updated[sportIndex].equipment
    if (currentEquipment.includes(equipment)) {
      updated[sportIndex].equipment = currentEquipment.filter(e => e !== equipment)
    } else {
      updated[sportIndex].equipment = [...currentEquipment, equipment]
    }
    setSportPreferences(updated)
  }

  const togglePreferredDay = (sportIndex: number, day: string) => {
    const updated = [...sportPreferences]
    const currentDays = updated[sportIndex].preferredDays
    if (currentDays.includes(day)) {
      updated[sportIndex].preferredDays = currentDays.filter(d => d !== day)
    } else {
      updated[sportIndex].preferredDays = [...currentDays, day]
    }
    setSportPreferences(updated)
  }

  const generateMonthlyPlan = async () => {
    if (!user || !planTitle || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      // Create the workout plan
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          title: planTitle,
          start_date: startDate,
          end_date: endDate,
          primary_sport: sportPreferences[0].sport,
          includes_strength: includesStrength,
          training_frequency: sportPreferences.reduce((sum, pref) => sum + pref.frequency, 0),
          multiple_sessions_per_day: multipleSessionsPerDay
        })
        .select()
        .single()

      if (planError) throw planError

      // Create sport preferences
      for (const pref of sportPreferences) {
        await supabase
          .from('workout_plan_preferences')
          .insert({
            plan_id: plan.id,
            sport: pref.sport,
            frequency_per_week: pref.frequency,
            preferred_days: pref.preferredDays,
            session_duration: pref.sessionDuration,
            equipment: pref.equipment
          })
      }

      // Generate scheduled workouts using the edge function
      const { data: scheduleData, error: scheduleError } = await supabase.functions.invoke('generate-monthly-plan', {
        body: {
          planId: plan.id,
          startDate,
          endDate,
          sportPreferences,
          multipleSessionsPerDay,
          includesStrength,
          aiPreferences
        }
      })

      if (scheduleError) throw scheduleError

      toast({
        title: "Success!",
        description: "Monthly workout plan generated successfully!",
      })

      // Reset form
      setPlanTitle("")
      setStartDate("")
      setEndDate("")
      setAiPreferences("")
      setSportPreferences([{
        sport: profile.primarySport || "swimming",
        frequency: 3,
        preferredDays: ["monday", "wednesday", "friday"],
        sessionDuration: profile.sessionDuration || 60,
        equipment: []
      }])

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Monthly Workout Plan Generator</h2>
        </div>
        <p className="text-muted-foreground">
          Create a personalized monthly training schedule with multiple sports and customizable frequency
        </p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Plan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planTitle">Plan Title</Label>
              <Input
                id="planTitle"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="My Training Plan"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="includesStrength"
                  checked={includesStrength}
                  onCheckedChange={setIncludesStrength}
                />
                <Label htmlFor="includesStrength">Include Weight Training</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="multipleSessionsPerDay"
                  checked={multipleSessionsPerDay}
                  onCheckedChange={setMultipleSessionsPerDay}
                />
                <Label htmlFor="multipleSessionsPerDay">Multiple Sessions Per Day</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="aiPreferences">Training Preferences & Goals</Label>
            <Textarea
              id="aiPreferences"
              value={aiPreferences}
              onChange={(e) => setAiPreferences(e.target.value)}
              placeholder="Describe your training goals, any injuries or limitations, preferred workout intensity, or specific focus areas..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {sportPreferences.map((preference, index) => (
        <Card key={index} className="glass border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">
                  {SPORTS.find(s => s.value === preference.sport)?.icon}
                </span>
                Sport {index + 1}
              </CardTitle>
              {sportPreferences.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSportPreference(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Sport</Label>
                <Select
                  value={preference.sport}
                  onValueChange={(value) => updateSportPreference(index, 'sport', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sport) => (
                      <SelectItem key={sport.value} value={sport.value}>
                        {sport.icon} {sport.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                 <Label>Sessions Per Week: {preference.frequency}</Label>
                <Input
                  type="range"
                  min="1"
                  max="14"
                  value={preference.frequency}
                  onChange={(e) => updateSportPreference(index, 'frequency', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label>Preferred Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Badge
                    key={day.value}
                    variant={preference.preferredDays.includes(day.value) ? "default" : "outline"}
                    onClick={() => togglePreferredDay(index, day.value)}
                    className="cursor-pointer"
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Session Duration: {preference.sessionDuration} minutes</Label>
              <Input
                type="range"
                min="30"
                max="120"
                step="15"
                value={preference.sessionDuration}
                onChange={(e) => updateSportPreference(index, 'sessionDuration', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <Label>Equipment</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {getEquipmentForSport(preference.sport).map((equipment) => (
                  <Badge
                    key={equipment}
                    variant={preference.equipment.includes(equipment) ? "default" : "outline"}
                    onClick={() => toggleEquipment(index, equipment)}
                    className="cursor-pointer"
                  >
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={addSportPreference}
          className="flex-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Sport
        </Button>
        
        <Button
          onClick={generateMonthlyPlan}
          className="flex-1 pulse-gradient text-white font-semibold"
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate Monthly Plan"}
        </Button>
      </div>
    </div>
  )
}