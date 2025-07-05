import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Key, Shield, Bell, Smartphone, Activity, Target, Timer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "./ThemeProvider"

const SPORTS = [
  { value: "swimming", label: "Swimming", icon: "🏊‍♂️" },
  { value: "running", label: "Running", icon: "🏃‍♂️" },
  { value: "cycling", label: "Cycling", icon: "🚴‍♂️" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
  { value: "tennis", label: "Tennis", icon: "🎾" },
]

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner (0-1 years)" },
  { value: "novice", label: "Novice (1-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "advanced", label: "Advanced (5-10 years)" },
  { value: "expert", label: "Expert (10+ years)" },
]

export function Settings() {
  const [apiKey, setApiKey] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [healthSync, setHealthSync] = useState(false)
  const [primarySport, setPrimarySport] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [competitiveLevel, setCompetitiveLevel] = useState("")
  const [trainingFrequency, setTrainingFrequency] = useState([3])
  const [sessionDuration, setSessionDuration] = useState([60])
  const [currentGoals, setCurrentGoals] = useState("")
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key')
    const savedSport = localStorage.getItem('primary-sport')
    const savedExperience = localStorage.getItem('experience-level')
    const savedCompetitive = localStorage.getItem('competitive-level')
    const savedFrequency = localStorage.getItem('training-frequency')
    const savedDuration = localStorage.getItem('session-duration')
    const savedGoals = localStorage.getItem('current-goals')
    
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedSport) setPrimarySport(savedSport)
    if (savedExperience) setExperienceLevel(savedExperience)
    if (savedCompetitive) setCompetitiveLevel(savedCompetitive)
    if (savedFrequency) setTrainingFrequency([parseInt(savedFrequency)])
    if (savedDuration) setSessionDuration([parseInt(savedDuration)])
    if (savedGoals) setCurrentGoals(savedGoals)
  }, [])

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini-api-key', apiKey.trim())
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved securely.",
      })
    } else {
      localStorage.removeItem('gemini-api-key')
      toast({
        title: "API Key Removed",
        description: "Your API key has been removed.",
      })
    }
  }

  const saveSportProfile = () => {
    localStorage.setItem('primary-sport', primarySport)
    localStorage.setItem('experience-level', experienceLevel)
    localStorage.setItem('competitive-level', competitiveLevel)
    localStorage.setItem('training-frequency', trainingFrequency[0].toString())
    localStorage.setItem('session-duration', sessionDuration[0].toString())
    localStorage.setItem('current-goals', currentGoals)
    
    toast({
      title: "Sport Profile Saved",
      description: "Your sport profile has been updated successfully.",
    })

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('sportProfileUpdated'))
  }

  const selectedSport = SPORTS.find(sport => sport.value === primarySport)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Customize your PulseTrack experience</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sport Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Sport</Label>
            <Select value={primarySport} onValueChange={setPrimarySport}>
              <SelectTrigger>
                <SelectValue placeholder="Select your primary sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map(sport => (
                  <SelectItem key={sport.value} value={sport.value}>
                    <div className="flex items-center gap-2">
                      <span>{sport.icon}</span>
                      <span>{sport.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {primarySport && (
            <>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Competitive Level</Label>
                <Select value={competitiveLevel} onValueChange={setCompetitiveLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your competitive level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recreational">Recreational</SelectItem>
                    <SelectItem value="club">Club Level</SelectItem>
                    <SelectItem value="regional">Regional Competition</SelectItem>
                    <SelectItem value="national">National Level</SelectItem>
                    <SelectItem value="international">International Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Training Frequency: {trainingFrequency[0]} sessions/week</Label>
                <Slider
                  value={trainingFrequency}
                  onValueChange={setTrainingFrequency}
                  max={7}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Typical Session Duration: {sessionDuration[0]} minutes</Label>
                <Slider
                  value={sessionDuration}
                  onValueChange={setSessionDuration}
                  max={180}
                  min={30}
                  step={15}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Current Goals</Label>
                <Input
                  placeholder={`e.g., improve ${selectedSport?.label.toLowerCase()} technique, prepare for competition...`}
                  value={currentGoals}
                  onChange={(e) => setCurrentGoals(e.target.value)}
                />
              </div>

              <Button onClick={saveSportProfile} className="w-full">
                <Target className="mr-2 h-4 w-4" />
                Save Sport Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Gemini API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never shared. Get one from Google AI Studio.
            </p>
            <p className="text-xs text-orange-600">
              ⚠️ For better security, consider connecting to Supabase to store API keys on the backend.
            </p>
          </div>
          <Button onClick={saveApiKey} className="w-full">
            Save API Key
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Health Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sync with Health Apps</Label>
              <p className="text-sm text-muted-foreground">
                Connect to Apple Health, Google Fit, or Samsung Health
              </p>
            </div>
            <Switch checked={healthSync} onCheckedChange={setHealthSync} />
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="font-medium">Available Integrations</h4>
            {[
              { name: 'Apple Health', status: 'Not Connected', icon: '🍎' },
              { name: 'Google Fit', status: 'Not Connected', icon: '🟢' },
              { name: 'Samsung Health', status: 'Not Connected', icon: '📱' },
              { name: 'Fitbit', status: 'Not Connected', icon: '⌚' },
            ].map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span>{integration.icon}</span>
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-muted-foreground">{integration.status}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Workout Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about your scheduled workouts
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            About PulseTrack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Platform:</strong> Web App (iOS/Android Ready)</p>
            <p><strong>AI Engine:</strong> Google Gemini</p>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            PulseTrack uses AI to generate personalized workouts based on your preferences and goals.
            Your data is stored locally on your device for privacy and security.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
