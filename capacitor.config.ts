
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a0147a6942cb4db7a4a4a13287c24c96',
  appName: 'CoachMe',
  webDir: 'dist',
  plugins: {
    SamsungHealth: {
      appId: 'com.yourcompany.pulsetrack'
    }
  }
};

export default config;
