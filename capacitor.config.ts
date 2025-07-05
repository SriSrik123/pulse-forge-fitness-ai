
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.a0147a6942cb4db7a4a4a13287c24c96',
  appName: 'PulseTrack',
  webDir: 'dist',
  server: {
    url: 'https://a0147a69-42cb-4db7-a4a4-a13287c24c96.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f23',
      showSpinner: false
    }
  }
};

export default config;
