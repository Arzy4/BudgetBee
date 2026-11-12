<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import BottomNavbar from '@/components/layout/BottomNavbar.vue'

const route = useRoute()

// Select background based on current route
const backgroundImage = computed(() => {
  if (route.name === 'transaction-detail') {
    return '/images/profile-bg.png'
  }

  switch (route.path) {
    case '/dashboard':
    case '/budgets':
    case '/histories':
    case '/profile':
      return '/images/dashboard-bg.png'

    case '/transactions/add':
    case '/profile/edit':
    case '/profile/change-password':
    case '/profile/notifications':
    case '/profile/data-management':
      return '/images/profile-bg.png'

    default:
      return ''
  }
})

// Show navbar only on main pages
const showNavbar = computed(() =>
  ['/dashboard', '/budgets', '/histories', '/profile'].includes(route.path),
)
</script>

<template>
  <div class="relative min-h-svh overflow-x-hidden bg-[#FBF3E6]">
    <!-- Shared background -->
    <div
      class="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
      :style="{
        backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none',
      }"
    ></div>

    <!-- Animated pages -->
    <main class="relative z-10 min-h-svh">
      <slot />
    </main>

    <!-- Fixed bottom navbar -->
    <BottomNavbar v-if="showNavbar" />
  </div>
</template>
