<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { login } from '@/services/auth'
import { useAuthStore } from "@/stores/auth";
import axios from 'axios'
import AuthInput from '@/components/auth/AuthInput.vue'
import AuthButton from '@/components/auth/AuthButton.vue'

const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const authStore = useAuthStore();

async function handleLogin() {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  

  try {
    const result = await login(email.value, password.value)

    // Save authenticated user and access token in Pinia
    authStore.setAuth(result.user, result.accessToken);

    // Navigate to Profile
    await router.push("/profile");
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
  <div class="relative z-10 mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-7">
    <!-- Centered Content -->
    <div class="flex flex-1 flex-col justify-center py-10">
      <!-- Heading -->
      <header>
        <p class="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#918A7E]">
          Welcome back
        </p>

        <h1 class="mt-4 text-[34px] leading-[1.13] font-bold tracking-[-0.045em]">
          Good to<br />
          see you again!
        </h1>

        <div class="mt-5 h-1 w-9 rounded-full bg-[#F7C64B]"></div>

        <p class="mt-5 max-w-[210px] text-[14px] leading-6 text-[#8D857B]">
          Log in to continue your budget tracking journey.
        </p>
      </header>

      <!-- Login Form -->
      <form class="mt-10 space-y-3" @submit.prevent="handleLogin">
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
        <div class="flex justify-end pt-8">
          <span class="text-xs font-semibold"> Forgot password? </span>
        </div>

        <!-- Login Button -->
        <p v-if="errorMessage" role="alert" class="text-center text-sm text-red-600">
          {{ errorMessage }}
        </p>
        
        <AuthButton type="submit" :loading="isLoading" class="mt-7">
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </AuthButton>
      </form>
    </div>

    <!-- Footer -->
    <footer class="pb-8 pt-4 text-center">
      <p class="text-sm text-[#777168]">
        Don't have an account?

        <RouterLink
          to="/register"
          class="ml-1 font-semibold text-[#C9900B] underline underline-offset-4"
        >
          Create one
        </RouterLink>
      </p>
    </footer>
  </div>
</template>
