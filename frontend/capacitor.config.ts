import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.budgetbee.app',
  appName: 'BudgetBee',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      hidden: true,
    },
    PushNotifications: {
      presentationOptions: [],
    },
  },
}

export default config
