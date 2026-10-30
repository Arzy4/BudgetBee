<script setup lang="ts">
import {
  Settings,
  UserRound,
  UserRoundPen,
  Wallet,
  CalendarDays,
  LockKeyhole,
  Bell,
  Palette,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from "vue";

const accountCount = 0;
const authStore = useAuthStore();
const isLoading = ref(true);
const errorMessage = ref("");

const settings = [
  { label: 'Edit Profile', icon: UserRoundPen },
  { label: 'Change Password', icon: LockKeyhole },
  { label: 'Notifications', icon: Bell },
  { label: 'Appearance', icon: Palette },
]

const user = computed(() => authStore.user);

onMounted(async () => {
  try {
    await authStore.fetchCurrentUser();
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    errorMessage.value = "Unable to load your profile.";
  } finally {
    isLoading.value = false;
  }
});

const memberSince = computed(() => {
  if (!user.value?.createdAt) {
    return "Unknown";
  }

  return new Date(user.value.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
});

function handleLogout() {
  // Connect to logout API later.
}
</script>

<template>
  <main class="min-h-svh bg-[#FFF9F0] text-[#24211D]">
    <div class="mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-6 py-8">

      <!-- Page Header -->
      <header class="flex items-center justify-between">
        <h1 class="text-[28px] font-bold tracking-tight">My Profile</h1>

        <button
          type="button"
          aria-label="Settings"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Settings :size="21" />
        </button>
      </header>

      <!-- User Information -->
      <section class="mt-10 flex flex-col items-center text-center">
        <div class="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#F8C94F]">
          <UserRound :size="42" :stroke-width="1.6" />
        </div>

        <h2 class="mt-4 text-[22px] font-bold">
          {{ user?.fullName ?? "Your Name" }}
        </h2>

        <p class="mt-1 text-sm text-[#8D857B]">
          {{ user?.email ?? "No email available" }}
        </p>

        <span
          class="mt-3 rounded-full bg-[#FCEAB8] px-4 py-1.5 text-xs font-semibold text-[#8A6410]"
        >
          BudgetBee Member
        </span>
      </section>

      <!-- Account Summary -->
      <section class="mt-9 grid grid-cols-2 gap-3">
        <div class="rounded-2xl bg-white p-4">
          <Wallet :size="23" class="text-[#C9900B]" />

          <p class="mt-3 text-xs text-[#8D857B]">My Accounts</p>

          <p class="mt-1 text-[25px] font-bold">
            {{ accountCount }}
          </p>
        </div>

        <div class="rounded-2xl bg-white p-4">
          <CalendarDays :size="23" class="text-[#C9900B]" />

          <p class="mt-3 text-xs text-[#8D857B]">Member Since</p>

          <p class="mt-2 text-lg font-bold">
            {{ memberSince }}
          </p>
        </div>
      </section>

      <!-- Account Settings -->
      <section class="mt-9">
        <h3 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#918A7E]">
          Account Settings
        </h3>

        <div class="overflow-hidden rounded-2xl bg-white px-4">
          <button
            v-for="(item, index) in settings"
            :key="item.label"
            type="button"
            class="flex w-full items-center gap-3 py-4 text-left"
            :class="index !== settings.length - 1 ? 'border-b border-[#F0E9E0]' : ''"
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
        class="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#E9B5AE] font-semibold text-[#B94D41] transition-colors hover:bg-[#FFF0ED]"
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
  </main>
</template>
