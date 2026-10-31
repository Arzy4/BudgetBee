import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser } from '@/services/auth'
import { getCurrentUser, refreshAccessToken, logout as logoutRequest } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const isInitializing = ref(false)
  const isInitialized = ref(false)

  let restorationPromise: Promise<boolean> | null = null

  // Getters
  const isAuthenticated = computed(() => {
    return user.value !== null && accessToken.value !== null
  })

  // Actions
  function setAuth(authenticatedUser: AuthUser, token: string) {
    user.value = authenticatedUser
    accessToken.value = token
    isInitialized.value = true
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

  async function restoreSession(): Promise<boolean> {
    if (isAuthenticated.value) {
      return true
    }

    if (restorationPromise) {
      return restorationPromise
    }

    restorationPromise = (async () => {
      isInitializing.value = true

      try {
        // Request a new access token using the HTTP-only cookie
        const refreshed = await refreshAccessToken()

        // Retrieve user profile using the new access token
        const currentUser = await getCurrentUser(refreshed.accessToken)

        // Restore Pinia authentication state
        setAuth(currentUser, refreshed.accessToken)

        return true
      } catch (error) {
        clearAuth()
        console.error('Session restoration failed:', error)

        return false
      } finally {
        isInitializing.value = false
        isInitialized.value = true
      }
    })()

    try {
      return await restorationPromise
    } finally {
      restorationPromise = null
    }
  }

  async function logout() {
    try {
      // Revoke the refresh session and clear its cookie
      await logoutRequest()
    } finally {
      // Always clear the local authentication state
      clearAuth()
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isInitializing,
    isInitialized,
    setAuth,
    clearAuth,
    fetchCurrentUser,
    restoreSession,
    logout,
  }
})
