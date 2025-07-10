
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a0147a6942cb4db7a4a4a13287c24c96',
  appName: 'PulseTrack',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f23',
      showSpinner: false
    }
  }
};

export default config;
