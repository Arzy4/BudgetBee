<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const direction = ref('slide-left')

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))

watch(
  () => route.path,
  (to, from) => {
    if (from === '/login' && to === '/register') {
      direction.value = 'slide-left'
    } else if (from === '/register' && to === '/login') {
      direction.value = 'slide-right'
    } else {
      direction.value = 'fade'
    }
  },
)
</script>

<template>
  <AuthLayout v-if="isAuthPage">
    <RouterView v-slot="{ Component, route }">
      <Transition :name="direction" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </AuthLayout>

  <RouterView v-else />
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 350ms ease,
    opacity 350ms ease;
}

.slide-left-enter-from {
  transform: translateX(100px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100px);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: none;
  }
}
</style>
