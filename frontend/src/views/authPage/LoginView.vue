<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { login } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import AuthInput from '@/components/auth/AuthInput.vue'
import AuthButton from '@/components/auth/AuthButton.vue'
import { initializePushNotifications } from '@/services/notifications/pushNotificationService'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const authStore = useAuthStore()

async function handleLogin() {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await login(email.value, password.value)

    // Save authenticated user and access token in Pinia
    authStore.setAuth(result.user, result.accessToken)

    // Initialize push notifications after successful login
    try {
      await initializePushNotifications()
    } catch (pushError) {
      console.error('Push notification initialization failed:', pushError)
    }

    // Get the destination from the redirect query parameter
    const redirect = route.query.redirect

    // Only accept internal application paths
    const destination =
      typeof redirect === 'string' &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//') &&
      !redirect.startsWith('/\\')
        ? redirect
        : '/dashboard'

    // Navigate to the intended destination
    await router.replace(destination)
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? 'Unable to log in.'
    } else {
      errorMessage.value = 'Something went wrong. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Page Container -->
  <main
    class="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 sm:max-w-[520px] sm:px-10 md:max-w-[600px] md:px-12"
  >
    <!-- Centered Content -->
    <div class="flex flex-1 flex-col justify-center py-6 sm:py-10 md:py-12">
      <!-- Heading -->
      <header>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#918A7E] sm:text-xs sm:tracking-[0.32em]"
        >
          Welcome back
        </p>

        <h1
          class="mt-3 text-[30px] leading-[1.15] font-bold tracking-[-0.045em] text-stone-900 sm:mt-4 sm:text-[38px] md:text-[44px]"
        >
          Good to<br />
          see you again!
        </h1>

        <div class="mt-4 h-1 w-9 rounded-full bg-[#F7C64B] sm:mt-5 sm:w-11"></div>

        <p
          class="mt-4 max-w-[240px] text-[13px] leading-[1.6] text-[#8D857B] sm:mt-5 sm:max-w-[310px] sm:text-[15px] md:text-base"
        >
          Log in to continue your budget tracking journey.
        </p>
      </header>

      <!-- Login Form -->
      <form class="mt-7 space-y-3 sm:mt-9 sm:space-y-4 md:mt-10" @submit.prevent="handleLogin">
        <!-- Email -->
        <AuthInput
          v-model="email"
          type="email"
          icon="email"
          placeholder="Email address"
          autocomplete="email"
          required
        />

        <!-- Password -->
        <AuthInput
          v-model="password"
          type="password"
          icon="password"
          placeholder="Password"
          autocomplete="current-password"
          required
        />

        <!-- Forgot Password -->
        <div class="flex justify-end pt-8 sm:pt-5">
          <RouterLink
            to="/forgot-password"
            class="text-xs font-semibold text-stone-800 hover:underline sm:text-sm"
          >
            Forgot password?
          </RouterLink>
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" role="alert" class="text-center text-xs text-red-600 sm:text-sm">
          {{ errorMessage }}
        </p>

        <!-- Login Button -->
        <AuthButton type="submit" :loading="isLoading" class="mt-5 sm:mt-7">
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </AuthButton>
      </form>
    </div>

    <!-- Footer -->
    <footer class="shrink-0 pb-6 pt-3 text-center sm:pb-8 sm:pt-4">
      <p class="text-xs text-[#777168] sm:text-sm">
        Don't have an account?

        <RouterLink to="/register" class="ml-1 font-semibold text-[#C9900B]">
          Create one
        </RouterLink>
      </p>
    </footer>
  </main>
</template>
