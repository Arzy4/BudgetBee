<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'

import AuthLayout from '@/layouts/AuthLayout.vue'
import PageLayout from '@/layouts/PageLayout.vue'

const route = useRoute()
const direction = ref('fade')

// Select layout
const isAuthPage = computed(
  () => route.meta.background === 'auth'
)

const currentLayout = computed(() =>
  isAuthPage.value ? AuthLayout : PageLayout
)

// Main navigation order
const navigationOrder = [
  '/dashboard',
  '/budgets',
  '/histories',
  '/profile',
]

// Determine animation direction
watch(
  () => route.path,
  (to, from) => {
    // Login → Register / Login → Forgot Password / Forgot Password → Password Form
    if (
      from === '/login' && to === '/register' || from === '/login' && to === '/forgot-password') {
      direction.value = 'slide-left'
      return
    }

    // Register → Login
    if (from === '/register' && to === '/login' || from === '/forgot-password' && to === '/login') {
      direction.value = 'slide-right'
      return
    }

    const fromIndex = navigationOrder.indexOf(from)
    const toIndex = navigationOrder.indexOf(to)

    if (fromIndex !== -1 && toIndex !== -1) {
      direction.value =
        toIndex > fromIndex
          ? 'slide-left'
          : 'slide-right'
      return
    }

    direction.value = 'fade'
  },
  { flush: 'sync' }
)
</script>

<template>
  <component :is="currentLayout">
    <RouterView v-slot="{ Component, route }">
      <div class="page-transition-container">
        <Transition :name="direction">
          <div
            :key="route.path"
            class="page-transition-item"
          >
            <component :is="Component" />
          </div>
        </Transition>
      </div>
    </RouterView>
  </component>
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

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
