<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { House, List, Plus, ChartPie, UserRound } from 'lucide-vue-next'

const route = useRoute()

const activeRoute = computed(() => route.path)

const navigationItems = [
  {
    name: 'Home',
    path: '/dashboard',
    icon: House,
  },
  {
    name: 'Budgets',
    path: '/budgets',
    icon: ChartPie,
  },
  {
    name: 'History',
    path: '/histories',
    icon: List,
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: UserRound,
  },
]

const isActive = (path: string) =>
  activeRoute.value === path || activeRoute.value.startsWith(`${path}/`)
</script>

<template>
  <nav aria-label="Main navigation" class="fixed inset-x-0 bottom-0 z-50">
    <div
      class="mx-auto flex max-w-md items-center justify-around border border-white/60 bg-white/40 px-3 py-4 shadow-xl shadow-amber-900/10 backdrop-blur-md"
    >
      <!-- Home and History -->
      <RouterLink
        v-for="item in navigationItems.slice(0, 2)"
        :key="item.name"
        :to="item.path"
        class="flex min-w-12 flex-col items-center gap-1 transition-colors"
        :class="isActive(item.path) ? 'text-amber-500' : 'text-stone-500 hover:text-amber-600'"
      >
        <component :is="item.icon" :size="21" :stroke-width="2" />
        <span class="text-[10px] font-medium">
          {{ item.name }}
        </span>
      </RouterLink>

      <!-- Add Transaction -->
      <RouterLink
        to="/transactions/add"
        aria-label="Add transaction"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F9C846] text-stone-900 shadow-md shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95"
      >
        <Plus :size="26" :stroke-width="2.5" />
      </RouterLink>

      <!-- Budgets and Profile -->
      <RouterLink
        v-for="item in navigationItems.slice(2)"
        :key="item.name"
        :to="item.path"
        class="flex min-w-12 flex-col items-center gap-1 transition-colors"
        :class="isActive(item.path) ? 'text-amber-500' : 'text-stone-500 hover:text-amber-600'"
      >
        <component :is="item.icon" :size="21" :stroke-width="2" />
        <span class="text-[10px] font-medium">
          {{ item.name }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>
