<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import PasswordForm from '@/layouts/PasswordForm.vue'
import { changePassword } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSuccess = ref(false)

function goToProfile() {
  router.push('/profile')
}

async function handleChangePassword(payload: {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}) {
  if (isLoading.value) return

  errorMessage.value = ''
  successMessage.value = ''

  if (!payload.currentPassword) {
    errorMessage.value = 'Please enter your current password.'
    return
  }

  if (payload.newPassword !== payload.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    const response = await changePassword(payload.currentPassword, payload.newPassword)

    if (!response.success) {
      errorMessage.value = response.message || 'Unable to change your password.'
      return
    }

    // The backend has revoked the user's sessions.
    // Clear the frontend authentication state as well.
    authStore.clearAuth()

    successMessage.value = 'Your password has been changed successfully. Please log in again.'

    isSuccess.value = true
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      errorMessage.value =
        error.response?.data?.message ?? 'Unable to change your password. Please try again.'
    } else {
      errorMessage.value =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="relative flex min-h-svh w-full flex-col items-center justify-center px-5 py-12">
    <div class="w-full max-w-md">
      <PasswordForm
        mode="change"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :success-message="successMessage"
        :is-success="isSuccess"
        @submit="handleChangePassword"
        @back-to-profile="goToProfile"
      />
    </div>
  </main>
</template>
