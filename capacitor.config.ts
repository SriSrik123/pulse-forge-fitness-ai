
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'add.coached.a0147a6942cb4db7a4a4a13287c24c96',
  appName: 'Coached',
  webDir: 'dist',
  plugins: {
    SamsungHealth: {
      appId: 'app.coachme.a0147a6942cb4db7a4a4a13287c24c96'
    }
  }
};

export default config;
