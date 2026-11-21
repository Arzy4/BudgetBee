import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSplashStore = defineStore('splash', () => {
  const isSplashComplete = ref(false)

  function completeSplash() {
    isSplashComplete.value = true
  }

  function resetSplash() {
    isSplashComplete.value = false
  }

  return {
    isSplashComplete,
    completeSplash,
    resetSplash,
  }
})