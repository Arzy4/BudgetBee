<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

import AuthLayout from '@/layouts/AuthLayout.vue'
import PageLayout from '@/layouts/PageLayout.vue'
import { useNotificationBannerStore } from '@/stores/notificationBannerStore'
import InAppNotificationBanner from '@/components/notifications/InAppNotificationBanner.vue'
import SplashScreen from '@/components/splash/SplashScreen.vue'
import { useSplashStore } from '@/stores/splashStore'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

const direction = ref('fade')
const isStartupNavigation = ref(true)

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
    // Disable page transitions during startup.
    if (isStartupNavigation.value) {
      direction.value = 'none'
      return
    }

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

const splashStore = useSplashStore()
const authStore = useAuthStore()

const showSplash = ref(true)
const isExiting = ref(false)

const MASCOT_DURATION = 3600
const WORDMARK_DURATION = 800
const SPLASH_HOLD_DURATION = 1500

const SPLASH_EXIT_DELAY = MASCOT_DURATION + WORDMARK_DURATION + SPLASH_HOLD_DURATION

const isLoginPage = computed(() => route.path === '/login')

let splashTimer: ReturnType<typeof setTimeout> | undefined
let isUnmounted = false

async function startSplashSequence() {
  splashStore.resetSplash()

  // Start the splash timer immediately.
  const animationPromise = new Promise<void>((resolve) => {
    splashTimer = setTimeout(resolve, SPLASH_EXIT_DELAY)
  })

  // Wait for the router's initial navigation.
  // Your navigation guard already restores the session.
  await router.isReady()

  // Ensure authentication initialization is complete.
  if (!authStore.isInitialized) {
    await authStore.restoreSession()
  }

  // Wait until the splash animation and authentication
  // initialization have both finished.
  await animationPromise

  if (isUnmounted) return

  // Always choose Dashboard for authenticated users,
  // regardless of the previous route.
  const destination = authStore.isAuthenticated ? '/dashboard' : '/login'

  // Prepare the correct page behind the splash.
  if (route.path !== destination) {
    await router.replace(destination)
  }

  if (isUnmounted) return

  // Begin the existing yellow-screen slide-out.
  isExiting.value = true
}

onMounted(() => {
  void startSplashSequence()
})

onUnmounted(() => {
  isUnmounted = true

  if (splashTimer) {
    clearTimeout(splashTimer)
  }
})

function handleSplashExit() {
  showSplash.value = false

  // Enable normal page transitions after startup.
  isStartupNavigation.value = false

  // Allow Dashboard loading to begin.
  splashStore.completeSplash()
}
</script>

<template>
  <div
    class="app-content"
    :class="{
      'login-waiting': showSplash && isLoginPage && !isExiting,
      'login-entering': isLoginPage && isExiting,
    }"
  >
    <component :is="currentLayout">
      <RouterView v-slot="{ Component, route }">
        <div class="page-transition-container">
          <Transition :name="isStartupNavigation ? undefined : direction">
            <div :key="route.path" class="page-transition-item">
              <component :is="Component" />
            </div>
          </Transition>
        </div>
      </RouterView>
    </component>
  </div>

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

  <!-- Splash overlay -->
  <SplashScreen v-if="showSplash" :is-exiting="isExiting" @exit-complete="handleSplashExit" />
</template>

<style>
html,
body,
#app {
  width: 100%;
  min-height: 100%;
  overflow-x: clip;
}

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

.app-content {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  transform: translateX(0);
}

.app-content.login-waiting {
  transform: translateX(100%);
}

.app-content.login-entering {
  animation: login-slide-in 750ms cubic-bezier(0.76, 0, 0.24, 1) both;
}

@keyframes login-slide-in {
  from {
    transform: translateX(100%);
  }

  to {
    transform: translateX(0);
  }
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
