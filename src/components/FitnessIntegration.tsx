
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Activity, Smartphone, Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSamsungHealth } from "@/hooks/useSamsungHealth"

interface FitnessProvider {
  id: string
  name: string
  icon: React.ReactNode
  status: 'connected' | 'disconnected' | 'connecting'
  lastSync?: string
  dataTypes: string[]
}

export function FitnessIntegration() {
  const { toast } = useToast()
  const { 
    isConnected, 
    isLoading, 
    healthData, 
    checkConnection, 
    requestPermissions, 
    fetchHealthData 
  } = useSamsungHealth()

  const [providers, setProviders] = useState<FitnessProvider[]>([
    {
      id: 'samsung-health',
      name: 'Samsung Health',
      icon: <Heart className="h-6 w-6" />,
      status: 'disconnected',
      dataTypes: ['Steps', 'Heart Rate', 'Sleep', 'Exercise Sessions']
    },
    {
      id: 'apple-health',
      name: 'Apple Health',
      icon: <Activity className="h-6 w-6" />,
      status: 'disconnected',
      dataTypes: ['Steps', 'Heart Rate', 'Sleep', 'Workouts']
    }
  ])

  useEffect(() => {
    setProviders(prev => prev.map(provider => 
      provider.id === 'samsung-health' 
        ? { ...provider, status: isConnected ? 'connected' : 'disconnected' }
        : provider
    ))
  }, [isConnected])

  const handleConnect = async (providerId: string) => {
    if (providerId === 'samsung-health') {
      if (isConnected) {
        // Already connected, fetch latest data
        await fetchHealthData()
        toast({
          title: "Data Synced",
          description: "Latest Samsung Health data has been synchronized.",
        })
      } else {
        // Request permissions and connect
        await requestPermissions()
      }
    } else {
      toast({
        title: "Coming Soon",
        description: `${providers.find(p => p.id === providerId)?.name} integration is coming soon!`,
      })
    }
  }

  const handleDisconnect = async (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, status: 'disconnected', lastSync: undefined }
        : provider
    ))
    
    toast({
      title: "Disconnected",
      description: `${providers.find(p => p.id === providerId)?.name} has been disconnected.`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Connecting...</Badge>
      default:
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Fitness Data Integration
          </CardTitle>
          <p className="text-muted-foreground">
            Connect your fitness trackers and health apps to sync your data automatically.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="data">Data Overview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="providers" className="space-y-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/30">
                        {provider.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{provider.name}</h3>
                          {getStatusIcon(provider.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {provider.dataTypes.join(', ')}
                        </p>
                        {provider.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {new Date(provider.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(provider.status)}
                      {provider.status === 'connected' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnect(provider.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Syncing...' : 'Sync Now'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnect(provider.id)}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(provider.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Connecting...' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="data" className="space-y-4">
              {healthData ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <h3 className="font-medium">Steps</h3>
                    </div>
                    <p className="text-2xl font-bold">{healthData.steps.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">steps today</p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <h3 className="font-medium">Heart Rate</h3>
                    </div>
                    <p className="text-2xl font-bold">{healthData.heartRate.average}</p>
                    <p className="text-sm text-muted-foreground">
                      avg bpm ({healthData.heartRate.min}-{healthData.heartRate.max})
                    </p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <h3 className="font-medium">Sleep</h3>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(healthData.sleep.total / 60)}h</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(healthData.sleep.deep / 60)}h deep, {Math.round(healthData.sleep.light / 60)}h light
                    </p>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No Data Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect a fitness provider to see your health data here.
                  </p>
                  {isConnected && (
                    <Button onClick={() => fetchHealthData()} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Fetch Data'}
                    </Button>
                  )}
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
