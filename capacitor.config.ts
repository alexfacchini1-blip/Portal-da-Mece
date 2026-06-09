import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.escolaministros.app',
  appName: 'Escala de Ministros',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
