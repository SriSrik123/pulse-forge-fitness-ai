
import { registerPlugin } from '@capacitor/core';

export interface SamsungHealthPlugin {
  checkConnection(): Promise<{
    isConnected: boolean;
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
  }>;
  
  requestPermissions(): Promise<{
    success: boolean;
    permissions?: string;
    error?: string;
  }>;
  
  getStepsData(options: { date: string }): Promise<{
    success: boolean;
    totalSteps?: number;
    hourlyData?: number;
    error?: string;
  }>;
  
  getHeartRateData(options: { date: string }): Promise<{
    success: boolean;
    averageHeartRate?: number;
    maxHeartRate?: number;
    minHeartRate?: number;
    error?: string;
  }>;
  
  getSleepData(options: { date: string }): Promise<{
    success: boolean;
    totalSleepMinutes?: number;
    deepSleepMinutes?: number;
    lightSleepMinutes?: number;
    remSleepMinutes?: number;
    error?: string;
  }>;
}

const SamsungHealth = registerPlugin<SamsungHealthPlugin>('SamsungHealth');

export default SamsungHealth;
