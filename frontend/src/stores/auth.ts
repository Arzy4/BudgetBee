import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser } from '@/services/auth'
import { getCurrentUser } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => {
    return user.value !== null && accessToken.value !== null
  })

  // Actions
  function setAuth(authenticatedUser: AuthUser, token: string) {
    user.value = authenticatedUser
    accessToken.value = token
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
  }

  async function fetchCurrentUser() {
    if (!accessToken.value) {
      throw new Error('No access token available')
    }

    const currentUser = await getCurrentUser(accessToken.value)

    user.value = currentUser

    return currentUser
  } 

  return {
    user,
    accessToken,
    isAuthenticated,
    setAuth,
    clearAuth,
    fetchCurrentUser,
  }
})
