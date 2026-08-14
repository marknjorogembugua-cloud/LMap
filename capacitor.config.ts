import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.linkmeapp.app',
  appName: 'LinkMeApp',
  webDir: 'public',
  server: {
    url: 'https://linkmeapp-test.vercel.app',
    cleartext: false
  }
};

export default config;
