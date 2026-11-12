<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthInput from '@/components/auth/AuthInput.vue'
import AuthButton from '@/components/auth/AuthButton.vue'

const fullName = ref('')
const email = ref('')
const phoneNumber = ref('')
const password = ref('')
const confirmPassword = ref('')

function handleRegister() {
  // Registration API integration will be added later.
}
</script>

<template>
  <!-- Page Container -->
  <main
    class="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 sm:max-w-[520px] sm:px-10 md:max-w-[600px] md:px-12"
  >
    <!-- Main Content -->
    <div class="flex flex-1 flex-col justify-center py-5 sm:py-10 md:py-12">
      <!-- Heading -->
      <header>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#918A7E] sm:text-xs sm:tracking-[0.32em]"
        >
          Get started
        </p>

        <h1
          class="mt-3 text-[30px] font-bold leading-[1.15] tracking-[-0.045em] text-stone-900 sm:mt-4 sm:text-[38px] md:text-[44px]"
        >
          Create your<br />
          account!
        </h1>

        <div
          class="mt-4 h-1 w-9 rounded-full bg-[#F7C64B] sm:mt-5 sm:w-11"
        ></div>

        <p
          class="mt-4 max-w-[240px] text-[13px] leading-[1.6] text-[#8D857B] sm:mt-5 sm:max-w-[310px] sm:text-[15px] md:text-base"
        >
          Start your journey toward smarter money management.
        </p>
      </header>

      <!-- Register Form -->
      <form
        class="mt-6 space-y-3 sm:mt-9 sm:space-y-4 md:mt-10"
        @submit.prevent="handleRegister"
      >
        <!-- Full Name -->
        <AuthInput
          v-model="fullName"
          type="text"
          icon="user"
          placeholder="Full name"
          autocomplete="name"
          required
        />

        <!-- Email -->
        <AuthInput
          v-model="email"
          type="email"
          icon="email"
          placeholder="Email address"
          autocomplete="email"
          required
        />

        <!-- Phone Number -->
        <AuthInput
          v-model="phoneNumber"
          type="tel"
          icon="phone"
          placeholder="Phone Number"
          autocomplete="tel"
          required
        />

        <!-- Password -->
        <AuthInput
          v-model="password"
          type="password"
          icon="password"
          placeholder="Password"
          autocomplete="new-password"
          required
        />

        <!-- Confirm Password -->
        <AuthInput
          v-model="confirmPassword"
          type="password"
          icon="password"
          placeholder="Confirm password"
          autocomplete="new-password"
          required
        />

        <!-- Register Button -->
        <div class="pt-2 sm:pt-3">
          <AuthButton type="submit">
            Create Account
          </AuthButton>
        </div>
      </form>
    </div>

    <!-- Footer -->
    <footer class="shrink-0 pb-6 pt-3 text-center sm:pb-8 sm:pt-4">
      <p class="text-xs text-[#777168] sm:text-sm">
        Already have an account?

        <RouterLink
          to="/login"
          class="ml-1 font-semibold text-[#C9900B] underline underline-offset-4"
        >
          Log In
        </RouterLink>
      </p>
    </footer>
  </main>
</template>
