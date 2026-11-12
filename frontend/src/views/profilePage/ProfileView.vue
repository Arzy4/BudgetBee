<script setup lang="ts">
import {
  Settings,
  UserRound,
  UserRoundPen,
  CalendarDays,
  ReceiptText,
  LockKeyhole,
  Bell,
  Database,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next'

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'
import { getTransactions } from '@/services/transactions/transactionService'

const router = useRouter()

const authStore = useAuthStore()
const isLoading = ref(true)
const errorMessage = ref('')
const totalTransactions = ref<number | null>(null)

const settings = [
  {
    label: 'Edit Profile',
    describe: 'Personal Information',
    icon: UserRoundPen,
    route: '/profile/edit',
  },
  {
    label: 'Change Password',
    describe: 'Account Security',
    icon: LockKeyhole,
    route: '/profile/change-password',
  },
  {
    label: 'Notifications',
    describe: 'Notification Preferences',
    icon: Bell,
    route: '/profile/notifications',
  },
  {
    label: 'Data Management',
    describe: 'Charts, Exports and Financial Records',
    icon: Database,
    route: '/profile/data-management',
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
    class="relative h-dvh w-full overflow-hidden px-4 pt-8 pb-[calc(80px+env(safe-area-inset-bottom)+16px)] phone:px-6 phone:pt-10 phone:pb-[calc(80px+env(safe-area-inset-bottom)+20px)]"
  >
    <div
      class="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-3 phone:gap-4 sm:gap-5"
    >
      <!-- Fixed Header -->
      <header class="flex shrink-0 items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-[20px] font-bold leading-tight text-stone-800 phone:text-[24px]">
            My Profile
          </h1>

          <p class="mt-1 text-[11px] leading-5 text-stone-500 phone:text-[12px]">
            Manage your account and preferences
          </p>
        </div>

        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm xs:size-11 phone:size-12"
        >
          <Settings class="size-[22px] text-amber-600 phone:size-[28px]" :stroke-width="1.9" />
        </div>
      </header>

      <!-- Scrollable Profile Content -->
      <div
        class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-3 phone:space-y-6 phone:pb-4"
      >
        <!-- Profile Error Message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-center phone:px-4"
        >
          <p class="text-[12px] font-medium text-red-600 phone:text-[14px]">
            {{ errorMessage }}
          </p>
        </div>

        <!-- User Information -->
        <section
          class="flex flex-col items-center rounded-3xl border border-white/80 bg-white/20 px-4 py-5 text-center shadow-sm backdrop-blur-sm phone:px-5 phone:py-7"
        >
          <!-- Avatar -->
          <div
            class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-amber-400 phone:size-24"
          >
            <img
              v-if="authStore.user?.profileImage"
              :src="authStore.user.profileImage"
              alt="Profile picture"
              class="h-full w-full object-cover"
            />

            <UserRound v-else class="size-10 text-stone-900 phone:size-11" :stroke-width="1.7" />
          </div>

          <!-- Full Name -->
          <h2
            class="mt-3 max-w-full break-words text-[18px] font-bold text-stone-900 phone:mt-4 phone:text-[20px]"
          >
            {{ isLoading ? 'Loading...' : (user?.fullName ?? 'Your Name') }}
          </h2>

          <!-- Email -->
          <p class="mt-1 max-w-full break-all text-[12px] text-stone-500 phone:text-[14px]">
            {{ isLoading ? 'Loading...' : (user?.email ?? 'No email available') }}
          </p>

          <!-- Membership Badge -->
          <span
            class="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-[11px] font-bold text-amber-700 phone:mt-4 phone:px-4 phone:text-[12px]"
          >
            <UserRound class="size-[13px] phone:size-[14px]" />
            BudgetBee Member
          </span>
        </section>

        <!-- Account Summary -->
        <section class="grid grid-cols-2 gap-2 phone:gap-3">
          <!-- Member Since -->
          <div
            class="flex min-w-0 flex-col rounded-3xl border border-white/80 bg-white/20 p-3 shadow-sm backdrop-blur-sm phone:p-4"
          >
            <div
              class="mb-3 flex size-9 items-center justify-center rounded-xl bg-amber-100 phone:size-10"
            >
              <CalendarDays class="size-[20px] text-amber-600 phone:size-[22px]" />
            </div>

            <p class="text-[11px] text-stone-400 phone:text-[12px]">Member Since</p>

            <p class="mt-1 break-words text-[12px] font-bold text-stone-900 phone:text-[14px]">
              {{ isLoading ? 'Loading...' : memberSince }}
            </p>
          </div>

          <!-- Total Transactions -->
          <div
            class="flex min-w-0 flex-col rounded-3xl border border-white/80 bg-white/20 p-3 shadow-sm backdrop-blur-sm phone:p-4"
          >
            <div
              class="mb-3 flex size-9 items-center justify-center rounded-xl bg-amber-100 phone:size-10"
            >
              <ReceiptText class="size-[20px] text-amber-600 phone:size-[22px]" />
            </div>

            <p class="text-[11px] text-stone-400 phone:text-[12px]">Transactions</p>

            <p class="mt-1 break-words text-[12px] font-bold text-stone-900 phone:text-[14px]">
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
          <h3
            class="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#918A7E] phone:mb-4 phone:text-[11px]"
          >
            Account Settings
          </h3>

          <div
            class="overflow-hidden rounded-3xl border border-white/80 bg-white/20 px-3 shadow-sm backdrop-blur-sm phone:px-4"
          >
            <button
              v-for="(item, index) in settings"
              :key="item.label"
              type="button"
              class="flex w-full items-center gap-2 py-3 text-left transition-colors hover:bg-white/30 phone:gap-3 phone:py-4"
              :class="index !== settings.length - 1 ? 'border-b border-[#F0E9E0]' : ''"
              @click="handleSettingClick(item.route)"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF5DB] phone:size-10"
              >
                <component :is="item.icon" class="size-[18px] text-[#C9900B] phone:size-[20px]" />
              </span>

              <div class="flex min-w-0 flex-1 flex-col">
                <span class="text-[12px] font-semibold phone:text-[14px]">
                  {{ item.label }}
                </span>

                <span class="text-[11px] text-stone-500 phone:text-[12px]">
                  {{ item.describe }}
                </span>
              </div>

              <ChevronRight class="ml-auto size-[16px] shrink-0 text-[#A9A29A] phone:size-[18px]" />
            </button>
          </div>
        </section>

        <!-- Logout -->
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-100 px-4 py-3 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-200 phone:py-4 phone:text-[14px]"
          @click="handleLogout"
        >
          <LogOut class="size-[17px] phone:size-[19px]" />
          Log Out
        </button>

        <!-- Footer -->
        <footer class="pt-4 text-center phone:pt-6">
          <p class="text-[11px] text-[#A49B8E] phone:text-[12px]">BudgetBee • Version 1.0</p>
        </footer>
      </div>
    </div>
  </main>
</template>
