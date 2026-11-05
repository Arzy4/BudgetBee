<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Send } from 'lucide-vue-next'
import VerificationCodeModal from '@/components/auth/VerificationCodeModal.vue'
import ResetPasswordView from '@/components/auth/ResetPasswordView.vue'

import {
  requestPasswordReset,
  verifyPasswordReset,
  confirmPasswordReset,
} from '@/services/auth/passwordResetService'

type ForgotPasswordStep = 'email' | 'verify' | 'reset' | 'success'

const router = useRouter()

const currentStep = ref<ForgotPasswordStep>('email')

const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const requestId = ref('')
const resetToken = ref('')

const isVerificationModalOpen = ref(false)
const isVerifying = ref(false)
const isResending = ref(false)
const verificationError = ref('')

const verificationModalRef = ref<InstanceType<typeof VerificationCodeModal> | null>(null)

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function goToLogin() {
  router.push('/login')
}

function openVerificationModal() {
  clearMessages()
  verificationError.value = ''
  isVerificationModalOpen.value = true
  currentStep.value = 'verify'
}

function closeVerificationModal() {
  isVerificationModalOpen.value = false
  currentStep.value = 'email'
  verificationError.value = ''
}

function changeEmailAddress() {
  closeVerificationModal()
}

async function handleRequestPasswordReset() {
  clearMessages()

  const normalizedEmail = email.value.trim().toLowerCase()

  if (!normalizedEmail) {
    errorMessage.value = 'Please enter your email address.'
    return
  }

  if (isLoading.value) return

  isLoading.value = true

  try {
    const response = await requestPasswordReset(normalizedEmail)

    email.value = normalizedEmail

    // Save the request ID for code verification.
    requestId.value = response.requestId ?? ''

    if (!requestId.value) {
      errorMessage.value =
        'If this email is registered, check your inbox. If no code arrives, please try again.'
      return
    }

    // Open the verification popup after the API succeeds.
    openVerificationModal()
  } catch (error: unknown) {
    console.error('Failed to request password reset:', error)

    if (axios.isAxiosError(error)) {
      errorMessage.value =
        error.response?.data?.message ?? 'Unable to send verification code. Please try again.'
    } else {
      errorMessage.value = 'Something went wrong. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

async function handleVerifyCode(code: string) {
  if (isVerifying.value) return

  verificationError.value = ''

  if (!requestId.value) {
    verificationError.value = 'Verification request not found. Please request a new code.'
    return
  }

  isVerifying.value = true

  try {
    const response = await verifyPasswordReset(requestId.value, code)

    if (!response.success || !response.resetToken) {
      throw new Error('Verification was not successful.')
    }

    verificationCode.value = code
    resetToken.value = response.resetToken

    // Close the verification popup.
    isVerificationModalOpen.value = false

    // Move to the new-password screen.
    currentStep.value = 'reset'
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      verificationError.value =
        error.response?.data?.message ?? 'Invalid or expired verification code.'
    } else {
      verificationError.value =
        error instanceof Error ? error.message : 'Unable to verify the code. Please try again.'
    }
  } finally {
    isVerifying.value = false
  }
}

async function handleConfirmPasswordReset(payload: {
  newPassword: string
  confirmPassword: string
}) {
  clearMessages()

  if (isLoading.value) return

  if (!resetToken.value) {
    errorMessage.value = 'Your reset session is missing. Please request a new code.'
    return
  }

  if (payload.newPassword.length < 8) {
    errorMessage.value = 'Password must contain at least 8 characters.'
    return
  }

  if (payload.newPassword !== payload.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    const response = await confirmPasswordReset(resetToken.value, payload.newPassword)

    if (!response.success) {
      throw new Error(response.message || 'Unable to reset password.')
    }

    resetToken.value = ''
    verificationCode.value = ''
    requestId.value = ''

    successMessage.value = response.message
    currentStep.value = 'success'
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? 'Unable to reset your password.'
    } else {
      errorMessage.value =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

async function handleResendCode() {
  if (isResending.value) return

  isResending.value = true
  verificationError.value = ''

  try {
    const response = await requestPasswordReset(email.value)

    if (!response.success || !response.requestId) {
      throw new Error('Unable to request another verification code.')
    }

    // Replace the previous request ID.
    requestId.value = response.requestId

    // Restart the popup countdown after a successful request.
    verificationModalRef.value?.restartCountdown()
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      verificationError.value =
        error.response?.data?.message ?? 'Unable to resend the verification code.'
    } else {
      verificationError.value =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
    }
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <main class="relative flex min-h-svh w-full flex-col items-center justify-center px-5 py-12">
    <div class="w-full max-w-md">
      <!-- Forgot Password Card -->
      <section
        v-if="currentStep === 'email'"
        class="rounded-[32px] border border-white/80 bg-white/55 px-6 py-9 shadow-xl shadow-amber-900/10 backdrop-blur-md sm:px-8"
      >
        <!-- Illustration -->
        <div class="mb-7 flex justify-center">
          <div
            class="relative flex h-28 w-28 items-center justify-center rounded-full bg-amber-100/70"
          >
            <div
              class="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFE19A] to-[#F9C846] shadow-md shadow-amber-500/20"
            >
              <Mail :size="39" :stroke-width="1.6" class="text-amber-950" />
            </div>

            <!-- Small lock badge -->
            <div
              class="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-2xl border-4 border-[#FFF9EF] bg-white shadow-sm"
            >
              <LockKeyhole :size="21" :stroke-width="2" class="text-amber-600" />
            </div>
          </div>
        </div>

        <!-- Heading -->
        <div class="mb-8 text-center">
          <h2 class="text-[27px] font-extrabold tracking-tight text-stone-900">Forgot Password?</h2>

          <p class="mx-auto mt-3 max-w-xs text-sm leading-6 text-stone-500">
            Enter your registered email address to receive a verification code.
          </p>
        </div>

        <!-- Email Form -->
        <form class="space-y-5" @submit.prevent="handleRequestPasswordReset">
          <div>
            <label for="email" class="mb-2 block text-sm font-semibold text-stone-800">
              Email Address
            </label>

            <div class="relative">
              <Mail
                :size="19"
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                :disabled="isLoading"
                placeholder="Enter your email address"
                class="w-full rounded-2xl border border-stone-200 bg-white/70 py-3.5 pl-12 pr-4 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 disabled:opacity-60"
              />
            </div>
          </div>

          <!-- Error Message -->
          <p
            v-if="errorMessage"
            role="alert"
            class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ errorMessage }}
          </p>

          <!-- Success Message -->
          <p
            v-if="successMessage"
            role="status"
            class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {{ successMessage }}
          </p>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F9C846] px-5 py-4 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/20 transition-all hover:bg-[#F5BD28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send v-if="!isLoading" :size="18" />

            <span>
              {{ isLoading ? 'Sending Code...' : 'Send Verification Code' }}
            </span>

            <ArrowRight v-if="!isLoading" :size="18" />
          </button>
        </form>

        <!-- Back to Login -->
        <button
          type="button"
          class="mx-auto mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-amber-900 transition-colors hover:text-amber-600"
          @click="goToLogin"
        >
          <ArrowLeft :size="17" />
          Back to Login
        </button>
      </section>

      <ResetPasswordView
        v-else-if="currentStep === 'reset' || currentStep === 'success'"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :success-message="successMessage"
        :is-success="currentStep === 'success'"
        @submit="handleConfirmPasswordReset"
        @back-to-login="goToLogin"
      />
    </div>
  </main>

  <VerificationCodeModal
    ref="verificationModalRef"
    :open="isVerificationModalOpen"
    :email="email"
    :loading="isVerifying"
    :resend-loading="isResending"
    :error="verificationError"
    @close="closeVerificationModal"
    @change-email="changeEmailAddress"
    @verify="handleVerifyCode"
    @resend="handleResendCode"
  />
</template>
