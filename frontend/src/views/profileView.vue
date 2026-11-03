<script setup lang="ts">
import {
  Settings,
  UserRound,
  UserRoundPen,
  CalendarDays,
  ReceiptText,
  LockKeyhole,
  Bell,
  Palette,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next'

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'
import BottomNavbar from '@/components/layout/bottomNavbar.vue'
import { getTransactions } from '@/services/transactions/transactionService'

const router = useRouter()

const authStore = useAuthStore()
const isLoading = ref(true)
const errorMessage = ref('')
const totalTransactions = ref<number | null>(null)

const settings = [
  {
    label: 'Edit Profile',
    icon: UserRoundPen,
    route: '/profile/edit',
  },
  {
    label: 'Change Password',
    icon: LockKeyhole,
    route: '/profile/change-password',
  },
  {
    label: 'Notifications',
    icon: Bell,
    route: null,
  },
  {
    label: 'Appearance',
    icon: Palette,
    route: null,
  },
]

const user = computed(() => authStore.user)

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([authStore.fetchCurrentUser(), fetchTransactionCount()])
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    errorMessage.value = 'Unable to load your profile. Please try again.'
  } finally {
    isLoading.value = false
  }
})

const memberSince = computed(() => {
  if (!user.value?.createdAt) return 'Unknown'

  return new Date(user.value.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
})

async function fetchTransactionCount() {
  try {
    const transactions = await getTransactions()
    totalTransactions.value = transactions.length
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    totalTransactions.value = null
  }
}

async function handleLogout() {
  try {
    await authStore.logout()
    await router.replace('/login')
  } catch (error) {
    console.error('Logout request failed:', error)
    errorMessage.value = 'Unable to complete logout on the server. Please try again.'
    await router.replace('/login')
  }
}

function handleSettingClick(route: string | null) {
  if (!route) return

  router.push(route)
}
</script>

<template>
  <main
    class="relative flex h-dvh w-full flex-col overflow-hidden bg-[#FBF3E6] bg-cover bg-center bg-no-repeat px-5 pt-8"
    style="background-image: url('/images/profile-bg.png')"
  >
    <div class="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
      <!-- Fixed Header -->
      <header class="mb-4 shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-stone-900">My Profile</h1>

            <p class="mt-1 text-xs text-stone-500">Manage your account and preferences</p>
          </div>

          <div
            class="flex p-3 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm"
          >
            <Settings :size="22" />
          </div>
        </div>
      </header>

      <!-- Scrollable Profile Content -->
      <div class="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pb-28">
        <!-- Profile Error Message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center"
        >
          <p class="text-sm font-medium text-red-600">
            {{ errorMessage }}
          </p>
        </div>

        <!-- User Information -->
        <section
          class="flex flex-col items-center rounded-3xl border border-white/80 bg-white/20 px-5 py-7 text-center shadow-sm backdrop-blur-sm"
        >
          <!-- Avatar -->
          <div
            class="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFBA08] shadow-sm"
          >
            <UserRound :size="40" :stroke-width="1.7" class="text-stone-900" />
          </div>

          <!-- Full Name -->
          <h2 class="mt-4 text-xl font-bold text-stone-900">
            {{ isLoading ? 'Loading...' : (user?.fullName ?? 'Your Name') }}
          </h2>

          <!-- Email -->
          <p class="mt-1 max-w-full break-all text-sm text-stone-500">
            {{ isLoading ? 'Loading...' : (user?.email ?? 'No email available') }}
          </p>

          <!-- Membership Badge -->
          <span
            class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700"
          >
            <UserRound :size="14" />
            BudgetBee Member
          </span>
        </section>

        <!-- Account Summary -->
        <section class="grid grid-cols-2 gap-3">
          <!-- Member Since -->
          <div
            class="flex min-w-0 flex-col rounded-3xl border border-white/80 bg-white/20 p-4 shadow-sm backdrop-blur-sm"
          >
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <CalendarDays :size="22" class="text-amber-600" />
            </div>

            <p class="text-xs text-stone-400">Member Since</p>

            <p class="mt-1 break-words text-sm font-bold text-stone-900">
              {{ isLoading ? 'Loading...' : memberSince }}
            </p>
          </div>

          <!-- Total Transactions -->
          <div
            class="flex min-w-0 flex-col rounded-3xl border border-white/80 bg-white/20 p-4 shadow-sm backdrop-blur-sm"
          >
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <ReceiptText :size="22" class="text-amber-600" />
            </div>

            <p class="text-xs text-stone-400">Transactions</p>

            <p class="mt-1 break-words text-sm font-bold text-stone-900">
              {{
                isLoading
                  ? 'Loading...'
                  : totalTransactions === null
                    ? 'Unavailable'
                    : `${totalTransactions} recorded`
              }}
            </p>
          </div>
        </section>

        <!-- Account Settings -->
        <section>
          <h3 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#918A7E]">
            Account Settings
          </h3>

          <div
            class="overflow-hidden rounded-3xl border border-white/80 bg-white/20 px-4 shadow-sm backdrop-blur-sm"
          >
            <button
              v-for="(item, index) in settings"
              :key="item.label"
              type="button"
              class="flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-white/30"
              :class="index !== settings.length - 1 ? 'border-b border-[#F0E9E0]' : ''"
              @click="handleSettingClick(item.route)"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF5DB]"
              >
                <component :is="item.icon" :size="20" class="text-[#C9900B]" />
              </span>

              <span class="flex-1 text-sm font-semibold">
                {{ item.label }}
              </span>

              <ChevronRight :size="18" class="text-[#A9A29A]" />
            </button>
          </div>
        </section>

        <!-- Logout -->
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-100 px-4 py-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-200"
          @click="handleLogout"
        >
          <LogOut :size="19" />
          Log Out
        </button>

        <!-- Footer -->
        <footer class="mt-auto pt-10 text-center">
          <p class="text-xs text-[#A49B8E]">BudgetBee • Version 1.0</p>
        </footer>
      </div>
    </div>
  </main>

  <!-- Bottom Navbar -->
  <BottomNavbar />
</template>
