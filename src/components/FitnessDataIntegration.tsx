
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Activity, Watch, Smartphone, Wifi, WifiOff, Zap, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FitnessProvider {
  id: string
  name: string
  icon: React.ReactNode
  status: 'connected' | 'disconnected' | 'connecting'
  lastSync?: string
  dataTypes: string[]
}

interface SpikeConfig {
  apiKey: string
  enabled: boolean
}

export function FitnessDataIntegration() {
  const [providers, setProviders] = useState<FitnessProvider[]>([
    {
      id: 'apple-health',
      name: 'Apple Health',
      icon: <Heart className="h-5 w-5" />,
      status: 'disconnected',
      dataTypes: ['Heart Rate', 'Steps', 'Workouts', 'Sleep']
    },
    {
      id: 'google-fit',
      name: 'Google Fit',
      icon: <Activity className="h-5 w-5" />,
      status: 'disconnected',
      dataTypes: ['Heart Rate', 'Steps', 'Distance', 'Calories']
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      icon: <Watch className="h-5 w-5" />,
      status: 'disconnected',
      dataTypes: ['Heart Rate', 'Steps', 'Sleep', 'Active Minutes']
    },
    {
      id: 'samsung-health',
      name: 'Samsung Health',
      icon: <Smartphone className="h-5 w-5" />,
      status: 'disconnected',
      dataTypes: ['Heart Rate', 'Steps', 'Workouts', 'Stress']
    }
  ])
  
  const [spikeConfig, setSpikeConfig] = useState<SpikeConfig>({
    apiKey: '',
    enabled: false
  })
  
  const [syncEnabled, setSyncEnabled] = useState(false)
  const { toast } = useToast()

  // Load saved Spike API configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('spike-api-config')
    if (savedConfig) {
      setSpikeConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleSpikeConfig = () => {
    localStorage.setItem('spike-api-config', JSON.stringify(spikeConfig))
    toast({
      title: "Spike API Configured",
      description: "Your Spike API settings have been saved.",
    })
  }

  const handleConnectSpike = async () => {
    if (!spikeConfig.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Spike API key first.",
        variant: "destructive"
      })
      return
    }

    try {
      // This would be the actual Spike API integration
      // For now, we'll simulate the connection
      setSpikeConfig(prev => ({ ...prev, enabled: true }))
      
      // Update all providers to connected status via Spike
      setProviders(prev => prev.map(p => ({
        ...p,
        status: 'connected' as const,
        lastSync: new Date().toLocaleString()
      })))

      toast({
        title: "Connected via Spike API",
        description: "Successfully connected to all available fitness providers through Spike.",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect via Spike API. Please check your API key.",
        variant: "destructive"
      })
    }
  }

  const handleDisconnectSpike = () => {
    setSpikeConfig(prev => ({ ...prev, enabled: false }))
    setProviders(prev => prev.map(p => ({
      ...p,
      status: 'disconnected' as const,
      lastSync: undefined
    })))
    
    toast({
      title: "Disconnected",
      description: "Spike API integration has been disconnected.",
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
      <Tabs defaultValue="spike" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="spike">Spike API</TabsTrigger>
          <TabsTrigger value="direct">Direct Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="spike" className="space-y-4">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Spike API Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect to all fitness providers through Spike API for unified data access
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spike-api-key">Spike API Key</Label>
                <Input
                  id="spike-api-key"
                  type="password"
                  placeholder="Enter your Spike API key"
                  value={spikeConfig.apiKey}
                  onChange={(e) => setSpikeConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://spikeapi.com" target="_blank" rel="noopener noreferrer" className="text-pulse-blue hover:underline">spikeapi.com</a>
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSpikeConfig} variant="outline">
                  Save Configuration
                </Button>
                {spikeConfig.enabled ? (
                  <Button onClick={handleDisconnectSpike} variant="destructive">
                    Disconnect Spike
                  </Button>
                ) : (
                  <Button onClick={handleConnectSpike} disabled={!spikeConfig.apiKey}>
                    Connect via Spike
                  </Button>
                )}
              </div>

              {spikeConfig.enabled && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Connected via Spike API</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    All supported fitness providers are now accessible through your Spike integration
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                          disabled={spikeConfig.enabled}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          disabled={provider.status === 'connecting' || spikeConfig.enabled}
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
