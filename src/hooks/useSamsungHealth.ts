
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import SamsungHealth from '@/plugins/samsung-health';
import { supabase } from '@/integrations/supabase/client';

interface SamsungHealthData {
  steps: number;
  heartRate: {
    average: number;
    max: number;
    min: number;
  };
  sleep: {
    total: number;
    deep: number;
    light: number;
    rem: number;
  };
}

export const useSamsungHealth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState<SamsungHealthData | null>(null);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const result = await SamsungHealth.checkConnection();
      setIsConnected(result.isConnected);
      return result;
    } catch (error) {
      console.error('Error checking Samsung Health connection:', error);
      setIsConnected(false);
      return { isConnected: false, status: 'error' as const, error: 'Connection failed' };
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      const result = await SamsungHealth.requestPermissions();
      
      if (result.success) {
        toast({
          title: "Permissions Granted",
          description: "Samsung Health permissions have been granted successfully.",
        });
        await checkConnection();
      } else {
        toast({
          title: "Permission Error",
          description: result.error || "Failed to grant Samsung Health permissions.",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Samsung Health.",
        variant: "destructive",
      });
      return { success: false, error: 'Permission request failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHealthData = async (date: string = new Date().toISOString().split('T')[0]) => {
    try {
      setIsLoading(true);

      const [stepsResult, heartRateResult, sleepResult] = await Promise.all([
        SamsungHealth.getStepsData({ date }),
        SamsungHealth.getHeartRateData({ date }),
        SamsungHealth.getSleepData({ date })
      ]);

      const data: SamsungHealthData = {
        steps: stepsResult.success ? stepsResult.totalSteps || 0 : 0,
        heartRate: {
          average: heartRateResult.success ? heartRateResult.averageHeartRate || 0 : 0,
          max: heartRateResult.success ? heartRateResult.maxHeartRate || 0 : 0,
          min: heartRateResult.success ? heartRateResult.minHeartRate || 0 : 0,
        },
        sleep: {
          total: sleepResult.success ? sleepResult.totalSleepMinutes || 0 : 0,
          deep: sleepResult.success ? sleepResult.deepSleepMinutes || 0 : 0,
          light: sleepResult.success ? sleepResult.lightSleepMinutes || 0 : 0,
          rem: sleepResult.success ? sleepResult.remSleepMinutes || 0 : 0,
        }
      };

      setHealthData(data);

      // Store data in Supabase with proper JSON serialization
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('smartwatch_data')
          .upsert({
            user_id: user.id,
            data: {
              date,
              samsung_health: data,
              source: 'samsung_health'
            } as any
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error storing Samsung Health data:', error);
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast({
        title: "Data Error",
        description: "Failed to fetch health data from Samsung Health.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return {
    isConnected,
    isLoading,
    healthData,
    checkConnection,
    requestPermissions,
    fetchHealthData,
  };
};
