import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caballusapp.app',
  appName: 'Caballus',
  webDir: 'dist/apps/ion-caballus',
  bundledWebRuntime: false,
  // Temporary fix for safe areas. This is a bit over-aggressive but is needed
  // for the also temporary gps configuration menu to be usable
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: false
    }
  }
};

export default config;
