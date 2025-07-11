import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Activity, Smartphone, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FitnessProvider {
  id: string
  name: string
  icon: React.ReactNode
  status: 'connected' | 'disconnected' | 'connecting'
  lastSync?: string
  dataTypes: string[]
}

interface HealthKitConfig {
  enabled: boolean
  permissions: string[]
}

interface SamsungHealthConfig {
  enabled: boolean
  permissions: string[]
}

export function FitnessIntegration() {
  const [providers, setProviders] = useState<FitnessProvider[]>([
    {
      id: 'apple-health',
      name: 'Apple Health',
      icon: <Heart className="h-5 w-5" />,
      status: 'disconnected',
      dataTypes: ['Heart Rate', 'Steps', 'Workouts', 'Sleep']
    },
    {
      id: 'samsung-health',
      name: 'Samsung Health',
      icon: <Smartphone className="h-5 w-5" />,
      status: 'disconnected',
      dataTypes: ['Heart Rate', 'Steps', 'Workouts', 'Stress']
    }
  ])
  
  const [healthKitConfig, setHealthKitConfig] = useState<HealthKitConfig>({
    enabled: false,
    permissions: ['Heart Rate', 'Steps', 'Workouts', 'Sleep']
  })
  
  const [samsungHealthConfig, setSamsungHealthConfig] = useState<SamsungHealthConfig>({
    enabled: false,
    permissions: ['Heart Rate', 'Steps', 'Workouts', 'Stress']
  })
  
  const [syncEnabled, setSyncEnabled] = useState(false)
  const { toast } = useToast()

  // Load saved configurations
  useEffect(() => {
    const savedHealthKit = localStorage.getItem('healthkit-config')
    if (savedHealthKit) {
      setHealthKitConfig(JSON.parse(savedHealthKit))
    }
    
    const savedSamsungHealth = localStorage.getItem('samsung-health-config')
    if (savedSamsungHealth) {
      setSamsungHealthConfig(JSON.parse(savedSamsungHealth))
    }
  }, [])

  const handleConnectHealthKit = async () => {
    try {
      // This would be the actual Apple HealthKit integration
      setHealthKitConfig(prev => ({ ...prev, enabled: true }))
      localStorage.setItem('healthkit-config', JSON.stringify({...healthKitConfig, enabled: true}))
      
      // Update Apple Health provider
      setProviders(prev => prev.map(p => 
        p.id === 'apple-health' 
          ? { ...p, status: 'connected' as const, lastSync: new Date().toLocaleString() }
          : p
      ))

      toast({
        title: "Apple HealthKit Connected",
        description: "Successfully connected to Apple HealthKit.",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Apple HealthKit.",
        variant: "destructive"
      })
    }
  }

  const handleConnectSamsungHealth = async () => {
    try {
      // This would be the actual Samsung Health SDK integration
      setSamsungHealthConfig(prev => ({ ...prev, enabled: true }))
      localStorage.setItem('samsung-health-config', JSON.stringify({...samsungHealthConfig, enabled: true}))
      
      // Update Samsung Health provider
      setProviders(prev => prev.map(p => 
        p.id === 'samsung-health' 
          ? { ...p, status: 'connected' as const, lastSync: new Date().toLocaleString() }
          : p
      ))

      toast({
        title: "Samsung Health Connected",
        description: "Successfully connected to Samsung Health SDK.",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Samsung Health SDK.",
        variant: "destructive"
      })
    }
  }

  const handleDisconnectHealthKit = () => {
    setHealthKitConfig(prev => ({ ...prev, enabled: false }))
    localStorage.setItem('healthkit-config', JSON.stringify({...healthKitConfig, enabled: false}))
    
    setProviders(prev => prev.map(p => 
      p.id === 'apple-health' 
        ? { ...p, status: 'disconnected' as const, lastSync: undefined }
        : p
    ))
    
    toast({
      title: "Disconnected",
      description: "Apple HealthKit has been disconnected.",
    })
  }

  const handleDisconnectSamsungHealth = () => {
    setSamsungHealthConfig(prev => ({ ...prev, enabled: false }))
    localStorage.setItem('samsung-health-config', JSON.stringify({...samsungHealthConfig, enabled: false}))
    
    setProviders(prev => prev.map(p => 
      p.id === 'samsung-health' 
        ? { ...p, status: 'disconnected' as const, lastSync: undefined }
        : p
    ))
    
    toast({
      title: "Disconnected",
      description: "Samsung Health SDK has been disconnected.",
    })
  }

  const handleConnect = async (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, status: 'connecting' as const } : p
    ))

    try {
      // Simulate direct provider connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: 'connected' as const, lastSync: new Date().toLocaleString() }
          : p
      ))
      
      toast({
        title: "Connected Successfully",
        description: `${providers.find(p => p.id === providerId)?.name} has been connected directly.`,
      })
    } catch (error) {
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, status: 'disconnected' as const } : p
      ))
      
      toast({
        title: "Connection Failed",
        description: "Unable to connect to the fitness provider. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDisconnect = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, status: 'disconnected' as const, lastSync: undefined }
        : p
    ))
    
    toast({
      title: "Disconnected",
      description: `${providers.find(p => p.id === providerId)?.name} has been disconnected.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="native" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="native">Native SDKs</TabsTrigger>
          <TabsTrigger value="direct">Direct Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="native" className="space-y-4">
          <div className="grid gap-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Apple HealthKit
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect to Apple HealthKit for comprehensive health data access
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={healthKitConfig.enabled ? "default" : "secondary"}>
                      {healthKitConfig.enabled ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  {healthKitConfig.enabled ? (
                    <Button onClick={handleDisconnectHealthKit} variant="destructive" size="sm">
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={handleConnectHealthKit} size="sm">
                      Connect HealthKit
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Permissions: {healthKitConfig.permissions.join(', ')}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Samsung Health SDK
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect to Samsung Health SDK for fitness and health tracking
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={samsungHealthConfig.enabled ? "default" : "secondary"}>
                      {samsungHealthConfig.enabled ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  {samsungHealthConfig.enabled ? (
                    <Button onClick={handleDisconnectSamsungHealth} variant="destructive" size="sm">
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={handleConnectSamsungHealth} size="sm">
                      Connect Samsung Health
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Permissions: {samsungHealthConfig.permissions.join(', ')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="direct" className="space-y-4">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Direct Provider Connections
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect directly to individual fitness providers
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-sync Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync workout data from connected devices
                  </p>
                </div>
                <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="glass border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/30">
                        {provider.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{provider.name}</h4>
                          <div className="flex items-center gap-1">
                            {provider.status === 'connected' ? (
                              <Wifi className="h-3 w-3 text-green-500" />
                            ) : (
                              <WifiOff className="h-3 w-3 text-gray-500" />
                            )}
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(provider.status)} text-white text-xs`}
                            >
                              {provider.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {provider.dataTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                        {provider.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {provider.lastSync}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {provider.status === 'connected' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisconnect(provider.id)}
                          disabled={false}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          disabled={provider.status === 'connecting'}
                          onClick={() => handleConnect(provider.id)}
                        >
                          {provider.status === 'connecting' ? 'Connecting...' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm">How to Connect Real Devices</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• <strong>Current Status:</strong> This is a demo interface. Real SDK integration requires native development.</p>
          <p>• <strong>Samsung Health:</strong> Requires Samsung Health SDK approval and Android development</p>
          <p>• <strong>Apple HealthKit:</strong> Requires iOS app with HealthKit entitlements</p>
          <p>• See SAMSUNG_HEALTH_INTEGRATION.md for detailed setup instructions</p>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm">Privacy & Data Usage</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• Your fitness data is encrypted and stored securely</p>
          <p>• Data is only used to personalize your workout recommendations</p>
          <p>• You can disconnect any provider at any time</p>
          <p>• No data is shared with third parties without your consent</p>
        </CardContent>
      </Card>
    </div>
  )
}