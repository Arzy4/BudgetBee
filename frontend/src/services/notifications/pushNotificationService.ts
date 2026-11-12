import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { registerDeviceToken } from './deviceService'
import { useNotificationBannerStore } from '@/stores/notificationBannerStore'
import { acknowledgeForegroundNotification } from './notificationService'

let initialized = false

export async function initializePushNotifications() {
  console.log('[FCM] Initialization requested')

  console.log('[FCM] Platform:', Capacitor.getPlatform())

  console.log('[FCM] Is native:', Capacitor.isNativePlatform())

  if (!Capacitor.isNativePlatform()) {
    console.warn('[FCM] Skipped: Not running on native Android')
    return
  }

  if (initialized) {
    console.log('[FCM] Already initialized')
    return
  }

  initialized = true

  try {
    // Listen for successful registration
    await PushNotifications.addListener('registration', (token) => {
      console.log('FCM registration successful')

      void registerDeviceToken(token.value)
        .then(() => {
          console.log('FCM token registered with BudgetBee backend')
        })
        .catch((error) => {
          console.error('Failed to register FCM token with backend:', error)
        })
    })

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('FCM registration failed:', error.error)
    })

    // Listen for incoming notifications
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification)

      const bannerStore = useNotificationBannerStore()

      // Capacitor's notification.id is not necessarily
      // the PostgreSQL notification ID.
      const rawNotificationId = notification.data?.notificationId

      const notificationId = Number(rawNotificationId)

      // Acknowledge budget notifications in the backend.
      if (
        rawNotificationId !== undefined &&
        Number.isSafeInteger(notificationId) &&
        notificationId > 0
      ) {
        void acknowledgeForegroundNotification(notificationId)
          .then(() => {
            console.log('Foreground notification acknowledged:', notificationId)
          })
          .catch((error) => {
            console.error('Failed to acknowledge foreground notification:', error)
          })
      }

      // Show the existing custom banner.
      bannerStore.showNotification({
        id: notification.id,
        title: notification.title ?? 'BudgetBee Notification',
        message: notification.body ?? '',
      })
    })

    // Listen for notification taps
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification tapped:', action.notification)
    })

    // Check notification permissions
    let permission = await PushNotifications.checkPermissions()

    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions()
    }

    if (permission.receive !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    // Register with Firebase
    await PushNotifications.register()
  } catch (error) {
    initialized = false
    console.error('Failed to initialize push notifications:', error)
  }
}
