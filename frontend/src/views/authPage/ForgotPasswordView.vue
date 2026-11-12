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
  currentStep.value = 'email'
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
  <main
    class="relative flex min-h-dvh w-full flex-col items-center justify-center px-5 py-6 sm:px-8 sm:py-12"
  >
    <div class="w-full max-w-md">
      <Transition name="slide-left" mode="out-in">
        <!-- Forgot Password Card -->
        <section
          v-if="currentStep === 'email'"
          class="rounded-[24px] border border-white/80 bg-white/55 px-5 py-7 shadow-xl shadow-amber-900/10 backdrop-blur-md sm:rounded-[32px] sm:px-8 sm:py-9"
        >
          <!-- Illustration -->
          <div class="mb-5 flex justify-center sm:mb-7">
            <div
              class="relative flex h-24 w-24 items-center justify-center rounded-full bg-amber-100/70 sm:h-28 sm:w-28"
            >
              <div
                class="flex h-[68px] w-[68px] items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFE19A] to-[#F9C846] shadow-md shadow-amber-500/20 sm:h-20 sm:w-20"
              >
                <Mail :size="34" :stroke-width="1.6" class="text-amber-950 sm:size-10" />
              </div>

              <!-- Small lock badge -->
              <div
                class="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-[#FFF9EF] bg-white shadow-sm sm:h-11 sm:w-11"
              >
                <LockKeyhole :size="19" :stroke-width="2" class="text-amber-600 sm:size-[21px]" />
              </div>
            </div>
          </div>

          <!-- Heading -->
          <div class="mb-6 text-center sm:mb-8">
            <h2 class="text-[24px] font-extrabold tracking-tight text-stone-900 sm:text-[28px]">
              Forgot Password?
            </h2>

            <p
              class="mx-auto mt-3 max-w-xs text-[13px] leading-[1.6] text-stone-500 sm:text-sm sm:leading-6"
            >
              Enter your registered email address to receive a verification code.
            </p>
          </div>

          <!-- Email Form -->
          <form class="space-y-4 sm:space-y-5" @submit.prevent="handleRequestPasswordReset">
            <div>
              <label
                for="email"
                class="mb-2 block text-[13px] font-semibold text-stone-800 sm:text-sm"
              >
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
                  class="h-[52px] w-full rounded-2xl border border-stone-200 bg-white/70 pl-12 pr-4 text-base text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 disabled:opacity-60 sm:h-[56px]"
                />
              </div>
            </div>

            <!-- Error Message -->
            <p
              v-if="errorMessage"
              role="alert"
              class="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600 sm:px-4 sm:py-3 sm:text-sm"
            >
              {{ errorMessage }}
            </p>

            <!-- Success Message -->
            <p
              v-if="successMessage"
              role="status"
              class="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-[13px] text-green-700 sm:px-4 sm:py-3 sm:text-sm"
            >
              {{ successMessage }}
            </p>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F9C846] px-3 text-[13px] font-bold text-stone-900 shadow-md shadow-amber-500/20 transition-all hover:bg-[#F5BD28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[56px] sm:gap-3 sm:px-5 sm:text-sm"
            >
              <Send v-if="!isLoading" :size="17" class="shrink-0 sm:size-[18px]" />

              <span>
                {{ isLoading ? 'Sending Code...' : 'Send Verification Code' }}
              </span>

              <ArrowRight v-if="!isLoading" :size="17" class="shrink-0 sm:size-[18px]" />
            </button>
          </form>

          <!-- Back to Login -->
          <button
            type="button"
            class="mx-auto mt-5 flex min-h-11 items-center justify-center gap-2 text-[13px] font-semibold transition-colors hover:text-amber-600 sm:mt-7 sm:text-sm"
            @click="goToLogin"
          >
            <ArrowLeft :size="17" />
            Back to Login
          </button>
        </section>

        <!-- Reset Password / Success Screen -->
        <ResetPasswordView
          v-else-if="currentStep === 'reset' || currentStep === 'success'"
          :is-loading="isLoading"
          :error-message="errorMessage"
          :success-message="successMessage"
          :is-success="currentStep === 'success'"
          @submit="handleConfirmPasswordReset"
          @back-to-login="goToLogin"
        />
      </Transition>
    </div>
  </main>

  <!-- Verification Code Modal -->
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
