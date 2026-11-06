<script setup lang="ts">
import { ref, computed } from 'vue'
import { LockKeyhole, CheckCircle2, ArrowLeft } from 'lucide-vue-next'
import AuthInput from '@/components/auth/AuthInput.vue'

type PasswordMode = 'reset' | 'change'

const props = withDefaults(
  defineProps<{
    mode?: PasswordMode
    isLoading: boolean
    errorMessage: string
    successMessage: string
    isSuccess: boolean
  }>(),
  {
    mode: 'reset',
  },
)

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      currentPassword?: string
      newPassword: string
      confirmPassword: string
    },
  ): void
  (e: 'back-to-login'): void
  (e: 'back-to-profile'): void
}>()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const validationError = ref('')

const isChangeMode = computed(() => props.mode === 'change')

function handleBackNavigation() {
  if (isChangeMode.value) {
    emit('back-to-profile')
  } else {
    emit('back-to-login')
  }
}

function handleSubmit() {
  validationError.value = ''

  if (isChangeMode.value && !currentPassword.value) {
    validationError.value = 'Please enter your current password.'
    return
  }

  if (newPassword.value.length < 8) {
    validationError.value = 'Password must contain at least 8 characters.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    validationError.value = 'Passwords do not match.'
    return
  }

  if (isChangeMode.value && currentPassword.value === newPassword.value) {
    validationError.value = 'New password must be different from your current password.'
    return
  }

  emit('submit', {
    ...(isChangeMode.value ? { currentPassword: currentPassword.value } : {}),
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
      <h2 class="text-[27px] font-extrabold text-stone-900">
        {{ isChangeMode ? 'Change Password' : 'Create New Password' }}
      </h2>

      <p class="mt-3 text-sm leading-6 text-stone-500">
        {{
          isChangeMode
            ? 'Update your password to keep your BudgetBee account secure.'
            : 'Your email has been verified. Create a new password to secure your BudgetBee account.'
        }}
      </p>
    </div>

    <!-- Password Form -->
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Current Password (Change mode only) -->
      <div v-if="isChangeMode">
        <label class="mb-2 block text-sm font-semibold text-stone-800"> Current Password </label>

        <AuthInput
          v-model="currentPassword"
          type="password"
          icon="password"
          placeholder="Enter your current password"
          autocomplete="current-password"
          required
        />
      </div>

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
        v-if="validationError || errorMessage"
        role="alert"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ validationError || errorMessage }}
      </p>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full rounded-2xl bg-[#F9C846] px-5 py-4 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/20 transition-all hover:bg-[#F5BD28] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{
          isLoading
            ? isChangeMode
              ? 'Changing Password...'
              : 'Resetting Password...'
            : isChangeMode
              ? 'Change Password'
              : 'Reset Password'
        }}
      </button>

      <!-- Back Navigation -->
      <button
        type="button"
        class="mx-auto mt-7 flex items-center justify-center gap-2 text-sm font-semibold transition-colors hover:text-amber-600"
        @click="handleBackNavigation"
      >
        <ArrowLeft :size="17" />
        {{ isChangeMode ? 'Back to Profile' : 'Back to Login' }}
      </button>
    </form>
  </section>

  <!-- Success Card -->
  <section
    v-else
    class="rounded-[32px] border border-white/80 bg-white/55 px-6 py-9 text-center shadow-xl shadow-amber-900/10 backdrop-blur-md sm:px-8"
  >
    <!-- Illustration -->
    <div class="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
      <CheckCircle2 :size="46" class="text-amber-700" />
    </div>

    <!-- Heading -->
    <h2 class="text-[27px] font-extrabold text-stone-900">
      {{ isChangeMode ? 'Password Changed Successfully!' : 'Password Reset Successful!' }}
    </h2>

    <!-- Success Message -->
    <p class="mt-3 text-sm leading-6 text-stone-500">
      {{
        successMessage ||
        (isChangeMode
          ? 'Your password has been changed successfully. Please log in again.'
          : 'Your password has been updated successfully.')
      }}
    </p>

    <!-- Back to Login -->
    <button
      type="button"
      class="mt-8 w-full rounded-2xl bg-[#F9C846] px-5 py-4 text-sm font-bold text-stone-900 transition-all hover:bg-[#F5BD28]"
      @click="emit('back-to-login')"
    >
      Back to Login
    </button>
  </section>
</template>
