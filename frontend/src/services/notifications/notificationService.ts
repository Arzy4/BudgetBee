import api from '@/services/api.js'

type NotificationResponse = {
  message: string
}

export const acknowledgeForegroundNotification = async (
  notificationId: number,
): Promise<void> => {
  await api.delete<NotificationResponse>(
    `/notifications/${notificationId}/foreground`,
  )
}
