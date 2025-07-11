import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.pulsetrack', // <--- Change this to your desired ID
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