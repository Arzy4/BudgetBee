<script setup lang="ts">
import { ref } from 'vue'
import { LockKeyhole, CheckCircle2 } from 'lucide-vue-next'

import AuthInput from '@/components/auth/AuthInput.vue'

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

const newPassword = ref('')
const confirmPassword = ref('')

function handleSubmit() {
  emit('submit', {
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  })
}
</script>

<template>
  <!-- Reset Password Card -->
  <section
    v-if="!isSuccess"
    class="rounded-[32px] border border-white/80 bg-white/55 px-6 py-9 shadow-xl shadow-amber-900/10 backdrop-blur-md sm:px-8"
  >
    <!-- Illustration -->
    <div class="mb-7 flex justify-center">
      <div class="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
        <LockKeyhole :size="42" class="text-amber-700" />
      </div>
    </div>

    <!-- Heading -->
    <div class="mb-8 text-center">
      <h2 class="text-[27px] font-extrabold text-stone-900">Create New Password</h2>

      <p class="mt-3 text-sm leading-6 text-stone-500">
        Your email has been verified. Create a new password to secure your BudgetBee account.
      </p>
    </div>

    <!-- Password Form -->
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- New Password -->
      <div>
        <label for="newPassword" class="mb-2 block text-sm font-semibold text-stone-800">
          New Password
        </label>

        <AuthInput
          v-model="newPassword"
          type="password"
          icon="password"
          placeholder="Enter your new password"
          autocomplete="new-password"
          required
        />
      </div>

      <!-- Confirm Password -->
      <div>
        <label for="confirmPassword" class="mb-2 block text-sm font-semibold text-stone-800">
          Confirm New Password
        </label>

        <AuthInput
          v-model="confirmPassword"
          type="password"
          icon="password"
          placeholder="Confirm your new password"
          autocomplete="new-password"
          required
        />
      </div>

      <!-- Error Message -->
      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ errorMessage }}
      </p>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full rounded-2xl bg-[#F9C846] px-5 py-4 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/20 transition-all hover:bg-[#F5BD28] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isLoading ? 'Resetting Password...' : 'Reset Password' }}
      </button>
    </form>
  </section>

  <!-- Success Card -->
  <section
    v-else
    class="rounded-[32px] border border-white/80 bg-white/55 px-6 py-9 text-center shadow-xl shadow-amber-900/10 backdrop-blur-md sm:px-8"
  >
    <div class="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
      <CheckCircle2 :size="46" class="text-amber-700" />
    </div>

    <h2 class="text-[27px] font-extrabold text-stone-900">Password Reset Successful!</h2>

    <p class="mt-3 text-sm leading-6 text-stone-500">
      {{ successMessage || 'Your password has been updated successfully.' }}
    </p>

    <button
      type="button"
      class="mt-8 w-full rounded-2xl bg-[#F9C846] px-5 py-4 text-sm font-bold text-stone-900 transition-all hover:bg-[#F5BD28]"
      @click="emit('back-to-login')"
    >
      Back to Login
    </button>
  </section>
</template>
