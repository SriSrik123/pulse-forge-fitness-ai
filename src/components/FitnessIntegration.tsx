
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Heart, Activity, Watch, Smartphone, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FitnessProvider {
  id: string
  name: string
  icon: React.ReactNode
  status: 'connected' | 'disconnected' | 'connecting'
  lastSync?: string
  dataTypes: string[]
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
  
  const [syncEnabled, setSyncEnabled] = useState(false)
  const { toast } = useToast()

  const handleConnect = async (providerId: string) => {
    // Update status to connecting
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, status: 'connecting' as const } : p
    ))

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, we'll simulate successful connection
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: 'connected' as const, lastSync: new Date().toLocaleString() }
          : p
      ))
      
      toast({
        title: "Connected Successfully",
        description: `${providers.find(p => p.id === providerId)?.name} has been connected.`,
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
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fitness Data Integration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your fitness devices and apps to get personalized workout recommendations
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
