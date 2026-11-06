<script setup lang="ts">
import PasswordForm from '@/layouts/PasswordForm.vue'

defineProps<{
  isLoading: boolean
  errorMessage: string
  successMessage: string
  isSuccess: boolean
}>()

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      newPassword: string
      confirmPassword: string
    },
  ): void
  (e: 'back-to-login'): void
}>()

function handleSubmit(payload: {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}) {
  emit('submit', {
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
  })
}
</script>

<template>
  <PasswordForm
    mode="reset"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :success-message="successMessage"
    :is-success="isSuccess"
    @submit="handleSubmit"
    @back-to-login="emit('back-to-login')"
  />
</template>