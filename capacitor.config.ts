import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.coached.a0147a6942cb4db7a4a4a13287c24c96',
  appName: 'Coached',
  webDir: 'dist',
  plugins: {
    SamsungHealth: {
      appId: 'app.coached.a0147a6942cb4db7a4a4a13287c24c96'
    },
    App: {
      deepLinkingEnabled: true,
      deepLinks: [
        {
          scheme: 'app.coached.a0147a6942cb4db7a4a4a13287c24c96',
          fallbackUrl: 'https://coached-woad.vercel.app'
        }
      ]
    }
  }
};

export default config;