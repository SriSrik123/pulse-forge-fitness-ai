import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Bell, Smartphone, Activity, Target, LogOut, RotateCcw, AlertTriangle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "./ThemeProvider"
import { useAuth } from "@/hooks/useAuth"
import { useSportProfile } from "@/hooks/useSportProfile"
import { supabase } from "@/integrations/supabase/client"
import { FitnessIntegration } from "./FitnessIntegration"
import { TestDailyGeneration } from "./TestDailyGeneration"
import { useOnboarding } from "@/hooks/useOnboarding"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [notifications, setNotifications] = useState(true)
  const [smartwatchEnabled, setSmartwatchEnabled] = useState(false)
  const [primarySport, setPrimarySport] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [competitiveLevel, setCompetitiveLevel] = useState("")
  const [trainingFrequency, setTrainingFrequency] = useState([3])
  const [sessionDuration, setSessionDuration] = useState([60])
  const [currentGoals, setCurrentGoals] = useState("")
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    workout_reminders: true,
    achievement_alerts: true,
    progress_updates: true,
    rest_day_reminders: true,
    reminder_time: "09:00",
    frequency: "daily"
  })
  
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user, signOut } = useAuth()
  const { profile, saveProfile, loading } = useSportProfile()
  const { resetOnboarding } = useOnboarding()
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    if (profile.primarySport) {
      setPrimarySport(profile.primarySport)
      setExperienceLevel(profile.experienceLevel)
      setCompetitiveLevel(profile.competitiveLevel)
      setTrainingFrequency([profile.trainingFrequency])
      setSessionDuration([profile.sessionDuration])
      setCurrentGoals(profile.currentGoals)
    }
    
    // Load smartwatch setting from localStorage
    const savedSmartwatchSetting = localStorage.getItem('smartwatch-enabled')
    if (savedSmartwatchSetting) {
      setSmartwatchEnabled(JSON.parse(savedSmartwatchSetting))
    }
    
    // Load notification preferences from user profile
    loadNotificationPreferences()
  }, [profile])

  const loadNotificationPreferences = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      if (data?.notification_preferences && typeof data.notification_preferences === 'object') {
        setNotificationPrefs(prev => ({ ...prev, ...data.notification_preferences as object }))
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    }
  }

  const saveNotificationPreferences = async (newPrefs: any) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: newPrefs })
        .eq('id', user.id)
      
      if (error) throw error
      
      setNotificationPrefs(newPrefs)
      toast({
        title: "Notification Settings Saved",
        description: "Your notification preferences have been updated."
      })
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      })
    }
  }

  const saveSportProfile = async () => {
    const success = await saveProfile({
      primarySport,
      experienceLevel,
      competitiveLevel,
      trainingFrequency: trainingFrequency[0],
      sessionDuration: sessionDuration[0],
      currentGoals
    })
    
    if (success) {
      toast({
        title: "Sport Profile Saved",
        description: "Your sport profile has been updated successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to save sport profile. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
  }

  const handleResetApp = async () => {
    setResetLoading(true)
    try {
      const success = await resetOnboarding()
      if (success) {
        toast({
          title: "App Reset Complete",
          description: "Your app has been reset. You'll be taken through the setup process again.",
        })
        // The app will automatically redirect to onboarding
      } else {
        throw new Error("Reset failed")
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Unable to reset the app. Please try again.",
        variant: "destructive"
      })
    } finally {
      setResetLoading(false)
    }
  }

  const handleSmartwatchToggle = (enabled: boolean) => {
    setSmartwatchEnabled(enabled)
    localStorage.setItem('smartwatch-enabled', JSON.stringify(enabled))
    toast({
      title: enabled ? "Smartwatch Enabled" : "Smartwatch Disabled",
      description: enabled 
        ? "You can now manually enter data from your smartwatch." 
        : "Smartwatch data entry has been disabled.",
    })
  }

  const selectedSport = SPORTS.find(sport => sport.value === primarySport)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Customize your PulseTrack experience</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="fitness">Fitness Apps</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
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

                  <Button onClick={saveSportProfile} className="w-full" disabled={loading}>
                    <Target className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Save Sport Profile"}
                  </Button>
                </>
              )}
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
                <Switch 
                  checked={notificationPrefs.workout_reminders} 
                  onCheckedChange={(checked) => 
                    saveNotificationPreferences({ ...notificationPrefs, workout_reminders: checked })
                  } 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Achievement Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you earn new achievements
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.achievement_alerts} 
                  onCheckedChange={(checked) => 
                    saveNotificationPreferences({ ...notificationPrefs, achievement_alerts: checked })
                  } 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Progress Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly progress summaries and milestone notifications
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.progress_updates} 
                  onCheckedChange={(checked) => 
                    saveNotificationPreferences({ ...notificationPrefs, progress_updates: checked })
                  } 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rest Day Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders to take rest days for recovery
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.rest_day_reminders} 
                  onCheckedChange={(checked) => 
                    saveNotificationPreferences({ ...notificationPrefs, rest_day_reminders: checked })
                  } 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Reminder Time
                </Label>
                <Input
                  type="time"
                  value={notificationPrefs.reminder_time}
                  onChange={(e) => 
                    saveNotificationPreferences({ ...notificationPrefs, reminder_time: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select 
                  value={notificationPrefs.frequency} 
                  onValueChange={(value) => 
                    saveNotificationPreferences({ ...notificationPrefs, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Smartwatch Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable manual data entry from your smartwatch
                  </p>
                </div>
                <Switch checked={smartwatchEnabled} onCheckedChange={handleSmartwatchToggle} />
              </div>
            </CardContent>
          </Card>
          
          <TestDailyGeneration />
        </TabsContent>

        <TabsContent value="fitness">
          <FitnessIntegration />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account ID:</strong> {user?.id.slice(0, 8)}...</p>
              </div>
              <Separator />
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Reset App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reset all your preferences and start fresh with the onboarding process.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reset App
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset App?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all your preferences, sport profile, and settings. 
                      Your workout history will be preserved. You'll need to go through 
                      the setup process again. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetApp}
                      disabled={resetLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {resetLoading ? "Resetting..." : "Yes, Reset App"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                Your data is securely stored and protected.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
