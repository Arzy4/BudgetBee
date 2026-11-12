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
  <!-- Reset / Change Password Card -->
  <section
    v-if="!isSuccess"
    class="rounded-[24px] border border-white/80 bg-white/55 px-5 py-6 shadow-xl shadow-amber-900/10 backdrop-blur-md sm:rounded-[32px] sm:px-8 sm:py-9"
  >
    <!-- Illustration -->
    <div class="mb-5 flex justify-center sm:mb-7">
      <div
        class="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 sm:h-24 sm:w-24"
      >
        <LockKeyhole
          :size="36"
          class="text-amber-700 sm:size-[42px]"
        />
      </div>
    </div>

    <!-- Heading -->
    <div class="mb-6 text-center sm:mb-8">
      <h2
        class="text-[23px] font-extrabold leading-tight text-stone-900 sm:text-[27px]"
      >
        {{ isChangeMode ? 'Change Password' : 'Create New Password' }}
      </h2>

      <p
        class="mt-3 text-[13px] leading-[1.6] text-stone-500 sm:text-sm sm:leading-6"
      >
        {{
          isChangeMode
            ? 'Update your password to keep your BudgetBee account secure.'
            : 'Your email has been verified. Create a new password to secure your BudgetBee account.'
        }}
      </p>
    </div>

    <!-- Password Form -->
    <form
      class="space-y-4 sm:space-y-5"
      @submit.prevent="handleSubmit"
    >
      <!-- Current Password (Change mode only) -->
      <div v-if="isChangeMode">
        <label
          class="mb-2 block text-[13px] font-semibold text-stone-800 sm:text-sm"
        >
          Current Password
        </label>

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
        <label
          class="mb-2 block text-[13px] font-semibold text-stone-800 sm:text-sm"
        >
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
        <label
          class="mb-2 block text-[13px] font-semibold text-stone-800 sm:text-sm"
        >
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
        class="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600 sm:px-4 sm:py-3 sm:text-sm"
      >
        {{ validationError || errorMessage }}
      </p>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isLoading"
        class="flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#F9C846] px-4 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/20 transition-all hover:bg-[#F5BD28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[56px]"
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
        class="mx-auto mt-4 flex min-h-11 items-center justify-center gap-2 text-[13px] font-semibold transition-colors hover:text-amber-600 sm:mt-7 sm:text-sm"
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
    class="rounded-[24px] border border-white/80 bg-white/55 px-5 py-7 text-center shadow-xl shadow-amber-900/10 backdrop-blur-md sm:rounded-[32px] sm:px-8 sm:py-9"
  >
    <!-- Illustration -->
    <div
      class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 sm:mb-7 sm:h-24 sm:w-24"
    >
      <CheckCircle2
        :size="40"
        class="text-amber-700 sm:size-[46px]"
      />
    </div>

    <!-- Heading -->
    <h2
      class="text-[23px] font-extrabold leading-tight text-stone-900 sm:text-[27px]"
    >
      {{
        isChangeMode
          ? 'Password Changed Successfully!'
          : 'Password Reset Successful!'
      }}
    </h2>

    <!-- Success Message -->
    <p
      class="mt-3 text-[13px] leading-[1.6] text-stone-500 sm:text-sm sm:leading-6"
    >
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
      class="mt-6 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#F9C846] px-4 text-sm font-bold text-stone-900 transition-all hover:bg-[#F5BD28] active:scale-[0.98] sm:mt-8 sm:h-[56px]"
      @click="emit('back-to-login')"
    >
      Back to Login
    </button>
  </section>
</template>
