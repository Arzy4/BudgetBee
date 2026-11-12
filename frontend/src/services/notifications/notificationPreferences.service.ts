import api from '@/services/api.js'

export type NotificationPreferences = {
  pushNotifications: boolean
  budgetAlerts: boolean
  budgetWarning: boolean
  budgetExceeded: boolean
  monthlyReminders: boolean
  securityAlerts: boolean
}

type PreferencesResponse = {
  message: string
  data: NotificationPreferences
}

function pickPreferences(
  data: NotificationPreferences,
): NotificationPreferences {
  return {
    pushNotifications: data.pushNotifications,
    budgetAlerts: data.budgetAlerts,
    budgetWarning: data.budgetWarning,
    budgetExceeded: data.budgetExceeded,
    monthlyReminders: data.monthlyReminders,
    securityAlerts: data.securityAlerts,
  }
}

export async function getNotificationPreferences() {
  const response = await api.get<PreferencesResponse>(
    '/notifications/preferences',
  )

  return pickPreferences(response.data.data)
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
) {
  const response = await api.patch<PreferencesResponse>(
    '/notifications/preferences',
    pickPreferences(preferences),
  )

  return pickPreferences(response.data.data)
}
