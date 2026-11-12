<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'

import AuthLayout from '@/layouts/AuthLayout.vue'
import PageLayout from '@/layouts/PageLayout.vue'
import { useNotificationBannerStore } from '@/stores/notificationBannerStore'
import InAppNotificationBanner from '@/components/notifications/InAppNotificationBanner.vue'

const route = useRoute()
const direction = ref('fade')
const bannerStore = useNotificationBannerStore()

// Select layout
const isAuthPage = computed(() => route.meta.background === 'auth')

const currentLayout = computed(() => (isAuthPage.value ? AuthLayout : PageLayout))

// Main navigation order
const navigationOrder = ['/dashboard', '/budgets', '/histories', '/profile']

// Determine animation direction
watch(
  () => route.path,
  (to, from) => {
    // Login → Register / Login → Forgot Password / Forgot Password → Password Form
    if (
      (from === '/login' && to === '/register') ||
      (from === '/login' && to === '/forgot-password')
    ) {
      direction.value = 'slide-left'
      return
    }

    // Register → Login
    if (
      (from === '/register' && to === '/login') ||
      (from === '/forgot-password' && to === '/login')
    ) {
      direction.value = 'slide-right'
      return
    }

    const fromIndex = navigationOrder.indexOf(from)
    const toIndex = navigationOrder.indexOf(to)

    if (fromIndex !== -1 && toIndex !== -1) {
      direction.value = toIndex > fromIndex ? 'slide-left' : 'slide-right'
      return
    }

    direction.value = 'fade'
  },
  { flush: 'sync' },
)
</script>

<template>
  <component :is="currentLayout">
    <RouterView v-slot="{ Component, route }">
      <div class="page-transition-container">
        <Transition :name="direction">
          <div :key="route.path" class="page-transition-item">
            <component :is="Component" />
          </div>
        </Transition>
      </div>
    </RouterView>
  </component>

  <!-- Global in-app notification banner -->
  <Transition name="notification-banner">
    <div
      v-if="bannerStore.notification"
      :key="bannerStore.notification.id"
      class="fixed inset-x-0 top-4 z-[9999] mx-auto w-full max-w-md px-4"
    >
      <InAppNotificationBanner
        :title="bannerStore.notification.title"
        :message="bannerStore.notification.message"
        @close="bannerStore.dismissNotification()"
      />
    </div>
  </Transition>
</template>

<style>
.page-transition-container {
  position: relative;
  width: 100%;
  min-height: 100svh;
  overflow: hidden;
}

.page-transition-item {
  width: 100%;
  min-height: 100svh;
}

/* Animate both incoming and outgoing pages */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 350ms ease-in-out;
}

/* Keep the outgoing page in the same position */
.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

/* Forward: Dashboard → Budget → History → Profile */
.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-enter-to {
  transform: translateX(0);
}

.slide-left-leave-from {
  transform: translateX(0);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

/* Backward: Profile → History → Budget → Dashboard */
.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-enter-to {
  transform: translateX(0);
}

.slide-right-leave-from {
  transform: translateX(0);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

/* Default fade for other pages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 500ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

/* Notification Banner Animation */
/* In-app notification banner animation */
.notification-banner-enter-active,
.notification-banner-leave-active {
  transition:
    opacity 250ms ease,
    transform 250ms ease;
}

.notification-banner-enter-from,
.notification-banner-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Delete Modal Animation */
.delete-modal-enter-active,
.delete-modal-leave-active {
  transition: opacity 200ms ease;
}

.delete-modal-enter-from,
.delete-modal-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }

  .notification-banner-enter-active,
  .notification-banner-leave-active {
    transition: none;
  }

  .delete-modal-enter-active,
  .delete-modal-leave-active {
    transition: none;
  }
}
</style>
