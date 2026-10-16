import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.escolaministros.app',
  appName: 'Portal do Mece',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
