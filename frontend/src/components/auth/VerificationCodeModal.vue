<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import {
  ArrowLeft,
  Clock3,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    open: boolean
    email: string
    loading?: boolean
    error?: string
    resendLoading?: boolean
  }>(),
  {
    loading: false,
    error: '',
    resendLoading: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'verify', code: string): void
  (e: 'resend'): void
  (e: 'change-email'): void
}>()

const CODE_LENGTH = 6
const RESEND_SECONDS = 120

const digits = ref<string[]>(
  Array(CODE_LENGTH).fill(''),
)

const inputs = ref<HTMLInputElement[]>([])
const secondsRemaining = ref(RESEND_SECONDS)

let timer: ReturnType<typeof setInterval> | null = null

const verificationCode = computed(() => digits.value.join(''))

const isCodeComplete = computed(
  () => verificationCode.value.length === CODE_LENGTH,
)

const formattedTime = computed(() => {
  const minutes = Math.floor(secondsRemaining.value / 60)
  const seconds = secondsRemaining.value % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  stopTimer()
  secondsRemaining.value = RESEND_SECONDS

  timer = setInterval(() => {
    if (secondsRemaining.value > 0) {
      secondsRemaining.value--
    } else {
      stopTimer()
    }
  }, 1000)
}

function resetDigits() {
  digits.value = Array(CODE_LENGTH).fill('')
}

function focusInput(index: number) {
  nextTick(() => {
    inputs.value[index]?.focus()
  })
}

function setInputRef(
  element: Element | null,
  index: number,
) {
  if (element instanceof HTMLInputElement) {
    inputs.value[index] = element
  }
}

function applyDigits(value: string, startIndex: number) {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return

  const updated = [...digits.value]

  for (let index = 0; index < numbers.length; index++) {
    const target = startIndex + index

    if (target >= CODE_LENGTH) break

    updated[target] = numbers[index] ?? ''
  }

  digits.value = updated

  const nextIndex = Math.min(
    startIndex + numbers.length,
    CODE_LENGTH - 1,
  )

  focusInput(nextIndex)
}

function handleInput(event: Event, index: number) {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')

  if (!value) {
    digits.value[index] = ''
    target.value = ''
    return
  }

  applyDigits(value, index)
}

function handleKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace') {
    event.preventDefault()

    if (digits.value[index]) {
      digits.value[index] = ''
    } else if (index > 0) {
      digits.value[index - 1] = ''
      focusInput(index - 1)
    }
  }

  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusInput(index - 1)
  }

  if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
    event.preventDefault()
    focusInput(index + 1)
  }
}

function handlePaste(event: ClipboardEvent, index: number) {
  event.preventDefault()

  const pasted = event.clipboardData?.getData('text') ?? ''
  applyDigits(pasted, index)
}

function handleVerify() {
  if (!isCodeComplete.value || props.loading) return

  emit('verify', verificationCode.value)
}

function handleResend() {
  if (secondsRemaining.value > 0 || props.resendLoading) return

  emit('resend')
}

// Call this after the resend API succeeds.
function restartCountdown() {
  resetDigits()
  startTimer()
  focusInput(0)
}

defineExpose({
  restartCountdown,
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetDigits()
      startTimer()
      focusInput(0)
    } else {
      stopTimer()
    }
  },
  { immediate: true },
)

onUnmounted(stopTimer)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-4 py-6 backdrop-blur-[5px]"
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
      aria-describedby="verification-description"
      class="relative w-full max-w-md rounded-[32px] border border-white/80 bg-[#FFF9F1] px-5 py-8 shadow-2xl shadow-stone-900/20 sm:px-8"
    >
      <!-- Close button -->
      <button
        type="button"
        aria-label="Close verification popup"
        class="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-amber-900 transition-colors hover:bg-amber-100"
        @click="emit('close')"
      >
        <X :size="20" />
      </button>

      <!-- Illustration -->
      <div class="mb-6 flex justify-center">
        <div
          class="relative flex h-28 w-28 items-center justify-center rounded-full bg-amber-100/70"
        >
          <div
            class="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFE19A] to-[#F9C846] shadow-md shadow-amber-500/20"
          >
            <Mail :size="39" :stroke-width="1.6" class="text-amber-950" />
          </div>

          <div
            class="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-[#FFF9F1] bg-white shadow-sm"
          >
            <ShieldCheck :size="20" class="text-amber-600" />
          </div>
        </div>
      </div>

      <!-- Heading -->
      <div class="text-center">
        <h2
          id="verification-title"
          class="text-2xl font-extrabold tracking-tight text-stone-900"
        >
          Enter Verification Code
        </h2>

        <p
          id="verification-description"
          class="mx-auto mt-3 max-w-xs text-sm leading-6 text-stone-500"
        >
          We've sent a 6-digit verification code to
          <span class="font-semibold break-all text-stone-800">
            {{ email }}
          </span>.
          Please enter it below to continue.
        </p>
      </div>

      <!-- OTP Form -->
      <form class="mt-7" @submit.prevent="handleVerify">
        <div
          class="grid grid-cols-6 gap-2"
          aria-label="Six-digit verification code"
        >
          <input
            v-for="(_, index) in digits"
            :key="index"
            :ref="(element) => setInputRef(element as Element | null, index)"
            :value="digits[index]"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            autocomplete="one-time-code"
            :aria-label="`Verification digit ${index + 1}`"
            :disabled="loading"
            class="aspect-square min-w-0 w-full rounded-xl border border-stone-200 bg-white/80 text-center text-xl font-bold text-stone-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
            @input="handleInput($event, index)"
            @keydown="handleKeydown($event, index)"
            @paste="handlePaste($event, index)"
          />
        </div>

        <!-- Error -->
        <p
          v-if="error"
          role="alert"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600"
        >
          {{ error }}
        </p>

        <!-- Countdown -->
        <div class="mt-6 flex items-center justify-center gap-2 text-sm">
          <Clock3 :size="17" class="text-amber-700" />

          <template v-if="secondsRemaining > 0">
            <span class="text-stone-500">
              Resend code in
            </span>
            <span class="font-bold tabular-nums text-amber-800">
              {{ formattedTime }}
            </span>
          </template>

          <button
            v-else
            type="button"
            :disabled="resendLoading"
            class="font-semibold text-amber-800 underline underline-offset-4 hover:text-amber-600 disabled:opacity-50"
            @click="handleResend"
          >
            {{ resendLoading ? 'Resending...' : 'Resend Code' }}
          </button>
        </div>

        <!-- Verify -->
        <button
          type="submit"
          :disabled="!isCodeComplete || loading"
          class="mt-7 flex w-full items-center justify-center rounded-2xl bg-[#F9C846] px-5 py-4 text-sm font-bold text-stone-900 shadow-md shadow-amber-500/20 transition-all hover:bg-[#F5BD28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
      </form>

      <!-- Change email -->
      <button
        type="button"
        class="mx-auto mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-amber-900 hover:text-amber-600"
        @click="emit('change-email')"
      >
        <ArrowLeft :size="16" />
        Change Email Address
      </button>
    </section>
  </div>
</template>
