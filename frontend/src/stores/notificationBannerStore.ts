import { defineStore } from 'pinia'
import { ref } from 'vue'

type BannerNotification = {
  id: string
  title: string
  message: string
}

export const useNotificationBannerStore = defineStore(
  'notificationBanner',
  () => {
    const notification = ref<BannerNotification | null>(null)

    function showNotification(
      newNotification: BannerNotification
    ) {
      notification.value = newNotification
    }

    function dismissNotification() {
      notification.value = null
    }

    return {
      notification,
      showNotification,
      dismissNotification,
    }
  }
)
