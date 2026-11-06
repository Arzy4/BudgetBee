<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthInput from '@/components/auth/AuthInput.vue'
import AuthButton from '@/components/auth/AuthButton.vue'

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

function handleRegister() {
  // Registration API integration will be added later.
}
</script>

<template>
  <div class="relative z-10 mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-7">
    <!-- Main Content -->
    <div class="flex flex-1 flex-col justify-center py-10">
      <!-- Heading -->
      <header>
        <p class="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#918A7E]">
          Get started
        </p>

        <h1 class="mt-4 text-[34px] font-bold leading-[1.13] tracking-[-0.045em]">
          Create your<br />
          account!
        </h1>

        <div class="mt-5 h-1 w-9 rounded-full bg-[#F7C64B]"></div>

        <p class="mt-5 max-w-[240px] text-[14px] leading-6 text-[#8D857B]">
          Start your journey toward smarter money management.
        </p>
      </header>

      <!-- Register Form -->
      <form class="mt-10 space-y-3" @submit.prevent="handleRegister">
        <AuthInput
          v-model="fullName"
          type="text"
          icon="user"
          placeholder="Full name"
          autocomplete="name"
          required
        />

        <AuthInput
          v-model="email"
          type="email"
          icon="email"
          placeholder="Email address"
          autocomplete="email"
          required
        />

        <AuthInput
          v-model="password"
          type="password"
          icon="password"
          placeholder="Password"
          autocomplete="new-password"
          required
        />

        <AuthInput
          v-model="confirmPassword"
          type="password"
          icon="password"
          placeholder="Confirm password"
          autocomplete="new-password"
          required
        />

        <AuthButton type="submit" class="mt-7"> Create Account </AuthButton>
      </form>
    </div>

    <!-- Footer -->
    <footer class="pb-8 pt-4 text-center">
      <p class="text-sm text-[#777168]">
        Already have an account?

        <RouterLink
          to="/login"
          class="ml-1 font-semibold text-[#C9900B] underline underline-offset-4"
        >
          Log In
        </RouterLink>
      </p>
    </footer>
  </div>
</template>
