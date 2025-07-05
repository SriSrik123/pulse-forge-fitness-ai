
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Key, Shield, Bell, Smartphone, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "./ThemeProvider"

export function Settings() {
  const [apiKey, setApiKey] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [healthSync, setHealthSync] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Customize your PulseTrack experience</p>
      </div>

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
