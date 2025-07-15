
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a0147a6942cb4db7a4a4a13287c24c96',
  appName: 'pulse-forge-fitness-ai',
  webDir: 'dist',
  server: {
    url: 'https://a0147a69-42cb-4db7-a4a4-a13287c24c96.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SamsungHealth: {
      appId: 'com.yourcompany.pulsetrack'
    }
  }
};

export default config;
