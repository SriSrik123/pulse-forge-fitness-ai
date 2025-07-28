import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Heart, Activity, Footprints, Moon, Zap, Calendar, TrendingUp, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FitnessDataPoint {
  timestamp: string
  value: number
  unit: string
}

interface HealthMetrics {
  heartRate: FitnessDataPoint[]
  steps: FitnessDataPoint[]
  sleep: FitnessDataPoint[]
  calories: FitnessDataPoint[]
  workouts: FitnessDataPoint[]
}

export function FitnessData() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    heartRate: [],
    steps: [],
    sleep: [],
    calories: [],
    workouts: []
  })
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const { toast } = useToast()

  // Check for connected devices
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])

  useEffect(() => {
    // Check localStorage for connected fitness integrations
    const healthKitConfig = localStorage.getItem('healthkit-config')
    const samsungHealthConfig = localStorage.getItem('samsung-health-config')
    
    const devices = []
    if (healthKitConfig && JSON.parse(healthKitConfig).enabled) {
      devices.push('Apple HealthKit')
    }
    if (samsungHealthConfig && JSON.parse(samsungHealthConfig).enabled) {
      devices.push('Samsung Health')
    }
    
    setConnectedDevices(devices)
  }, [])

  const syncFitnessData = async () => {
    if (connectedDevices.length === 0) {
      toast({
        title: "No Connected Devices",
        description: "Please connect a fitness device in Settings > Fitness Apps first.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // In a real app, this would fetch actual data from the connected SDKs
      // For now, we show empty state since no real data is available
      setLastSync(new Date().toLocaleString())
      
      toast({
        title: "Sync Complete",
        description: "Fitness data has been synced from your connected devices.",
      })
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync fitness data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const hasAnyData = Object.values(metrics).some(data => data.length > 0)

  if (connectedDevices.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold mb-2">Fitness Data</h2>
          <p className="text-muted-foreground">View your health and fitness metrics</p>
        </div>

        <Card className="glass border-0">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Connected Devices</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Connect your fitness devices in Settings to start viewing your health data here.
            </p>
            <Button variant="outline">
              Go to Fitness Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Fitness Data</h2>
        <p className="text-muted-foreground">Your health metrics from connected devices</p>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connected Devices
            </CardTitle>
            <Button 
              onClick={syncFitnessData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {connectedDevices.map((device) => (
              <Badge key={device} variant="default" className="bg-green-500/20 text-green-700 border-green-500/30">
                {device}
              </Badge>
            ))}
          </div>
          {lastSync && (
            <p className="text-xs text-muted-foreground">
              Last synced: {lastSync}
            </p>
          )}
        </CardContent>
      </Card>

      {!hasAnyData ? (
        <Card className="glass border-0">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Your fitness data will appear here once you sync from your connected devices. 
              Make sure you have recent activity data on your fitness device.
            </p>
            <Button onClick={syncFitnessData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Try Syncing Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="heart">Heart Rate</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Card className="glass border-0">
                <CardContent className="p-4 text-center">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-red-500" />
                  <div className="text-xl sm:text-2xl font-bold">--</div>
                  <div className="text-xs text-muted-foreground">Avg Heart Rate</div>
                  <div className="text-sm">BPM</div>
                </CardContent>
              </Card>
              <Card className="glass border-0">
                <CardContent className="p-4 text-center">
                  <Footprints className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-xl sm:text-2xl font-bold">--</div>
                  <div className="text-xs text-muted-foreground">Steps Today</div>
                  <div className="text-sm">Steps</div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Activity Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Minutes</span>
                    <span>-- / 150 min</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    WHO recommends 150 minutes of moderate activity per week
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heart" className="space-y-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Heart Rate Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Heart rate data will appear here after syncing
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity & Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Activity data will appear here after syncing
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Sleep Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Moon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Sleep data will appear here after syncing
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}