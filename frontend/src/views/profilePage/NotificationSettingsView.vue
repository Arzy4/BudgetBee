<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  BellRing,
  Wallet,
  CalendarClock,
  ShieldCheck,
  Info,
  Check,
} from 'lucide-vue-next'

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/services/notifications/notificationPreferences.service'

const router = useRouter()

const preferences = ref<NotificationPreferences>({
  pushNotifications: true,
  budgetAlerts: false,
  budgetWarning: false,
  budgetExceeded: false,
  monthlyReminders: true,
  securityAlerts: true,
})

const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')

async function loadPreferences() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getNotificationPreferences()

    preferences.value = { ...data }
    savedPreferences.value = { ...data }
  } catch (error) {
    console.error('Failed to load notification preferences:', error)
    errorMessage.value = 'Failed to load notification preferences.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPreferences)

const savedPreferences = ref<NotificationPreferences>({
  ...preferences.value,
})

const hasChanges = computed(
  () => JSON.stringify(preferences.value) !== JSON.stringify(savedPreferences.value),
)

const showSaveMessage = ref(false)

function togglePreference(key: keyof NotificationPreferences) {
  if ((key === 'budgetWarning' || key === 'budgetExceeded') && !preferences.value.budgetAlerts) {
    return
  }

  preferences.value[key] = !preferences.value[key]
  showSaveMessage.value = false
}

async function savePreferences() {
  if (isSaving.value || isLoading.value || !hasChanges.value) return

  isSaving.value = true
  showSaveMessage.value = false
  errorMessage.value = ''

  try {
    const updated = await updateNotificationPreferences({
      ...preferences.value,
    })

    preferences.value = { ...updated }
    savedPreferences.value = { ...updated }

    showSaveMessage.value = true
  } catch (error) {
    console.error('Failed to save notification preferences:', error)
    errorMessage.value = 'Failed to save preferences. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <main class="flex h-svh flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-5 pt-9 pb-10">
    <div class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <!-- Fixed Header -->
      <header class="flex shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label="Go back"
          class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-lg"
          @click="goBack"
        >
          <ArrowLeft :size="22" class="text-stone-800" />
        </button>
      </header>

      <!-- Page Content -->
      <div class="flex min-h-0 flex-1 flex-col">
        <!-- Page Title -->
        <div class="shrink-0 pb-6 text-center">
          <h1 class="text-[20px] phone:text-[24px] font-bold text-stone-900">Notifications</h1>

          <p class="mt-1 text-[11px] phone:text-[12px] text-stone-500">
            Manage your notification preferences
          </p>
        </div>

        <!-- Scrollable Content -->
        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-4">
          <!-- General Preferences -->
          <section
            class="rounded-3xl border border-white/80 bg-white/40 p-4 shadow-sm backdrop-blur-sm phone:p-5"
          >
            <div class="mb-5 flex items-center gap-2">
              <BellRing class="size-5 text-amber-600" />
              <h2 class="text-[14px] font-bold text-stone-900">General Preferences</h2>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-stone-800">Push Notifications</p>
                <p class="mt-1 text-[11px] leading-4 text-stone-500">
                  Receive alerts on your device
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Push Notifications"
                :aria-checked="preferences.pushNotifications"
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
                :class="preferences.pushNotifications ? 'bg-amber-400' : 'bg-stone-300'"
                @click="togglePreference('pushNotifications')"
              >
                <span
                  class="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="preferences.pushNotifications ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </section>

          <!-- Budget Alerts -->
          <section
            class="rounded-3xl border border-white/80 bg-white/40 p-4 shadow-sm backdrop-blur-sm phone:p-5"
          >
            <div class="mb-5 flex items-center gap-2">
              <Wallet class="size-5 text-amber-600" />
              <h2 class="text-[14px] font-bold text-stone-900">Budget Alerts</h2>
            </div>

            <!-- Master Budget Switch -->
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-stone-800">Enable Budget Alerts</p>
                <p class="mt-1 text-[11px] leading-4 text-stone-500">
                  Stay informed about your spending
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Enable Budget Alerts"
                :aria-checked="preferences.budgetAlerts"
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
                :class="preferences.budgetAlerts ? 'bg-amber-400' : 'bg-stone-300'"
                @click="togglePreference('budgetAlerts')"
              >
                <span
                  class="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="preferences.budgetAlerts ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <div class="my-4 border-t border-stone-200/70" />

            <!-- 80% Warning -->
            <div
              class="flex items-center justify-between gap-3"
              :class="{ 'opacity-40': !preferences.budgetAlerts }"
            >
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-stone-800">Budget Warning (80%)</p>
                <p class="mt-1 text-[11px] leading-4 text-stone-500">
                  Alert when spending reaches 80%
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Budget Warning"
                :aria-checked="preferences.budgetWarning"
                :disabled="!preferences.budgetAlerts"
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed"
                :class="preferences.budgetWarning ? 'bg-amber-400' : 'bg-stone-300'"
                @click="togglePreference('budgetWarning')"
              >
                <span
                  class="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="preferences.budgetWarning ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <div class="my-4 border-t border-stone-200/70" />

            <!-- 100% Exceeded -->
            <div
              class="flex items-center justify-between gap-3"
              :class="{ 'opacity-40': !preferences.budgetAlerts }"
            >
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-stone-800">Budget Limit Reached (100%)</p>
                <p class="mt-1 text-[11px] leading-4 text-stone-500">
                  Alert when spending reaches your limit
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Budget Limit Reached"
                :aria-checked="preferences.budgetExceeded"
                :disabled="!preferences.budgetAlerts"
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed"
                :class="preferences.budgetExceeded ? 'bg-amber-400' : 'bg-stone-300'"
                @click="togglePreference('budgetExceeded')"
              >
                <span
                  class="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="preferences.budgetExceeded ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </section>

          <!-- Reminders and Security -->
          <section
            class="rounded-3xl border border-white/80 bg-white/40 p-4 shadow-sm backdrop-blur-sm phone:p-5"
          >
            <div class="mb-5 flex items-center gap-2">
              <CalendarClock class="size-5 text-amber-600" />
              <h2 class="text-[14px] font-bold text-stone-900">Reminders & Security</h2>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-stone-800">Monthly Reminders</p>
                <p class="mt-1 text-[11px] leading-4 text-stone-500">
                  Remind me to review my monthly budget
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Monthly Reminders"
                :aria-checked="preferences.monthlyReminders"
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
                :class="preferences.monthlyReminders ? 'bg-amber-400' : 'bg-stone-300'"
                @click="togglePreference('monthlyReminders')"
              >
                <span
                  class="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="preferences.monthlyReminders ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <div class="my-4 border-t border-stone-200/70" />

            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-[13px] font-semibold text-stone-800">Security Alerts</p>
                  <ShieldCheck class="size-4 text-amber-600" />
                </div>
                <p class="mt-1 text-[11px] leading-4 text-stone-500">
                  Important account activity updates
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-label="Security Alerts"
                :aria-checked="preferences.securityAlerts"
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
                :class="preferences.securityAlerts ? 'bg-amber-400' : 'bg-stone-300'"
                @click="togglePreference('securityAlerts')"
              >
                <span
                  class="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="preferences.securityAlerts ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </section>

          <!-- Information -->
          <div
            class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-100/70 p-4"
          >
            <Info class="mt-0.5 size-5 shrink-0 text-amber-700" />
            <p class="text-[11px] leading-5 text-amber-900">
              Notifications received while BudgetBee is open appear as temporary banners. Background
              notifications are saved in Notification Center.
            </p>
          </div>

          <!-- Save Button -->
          <button
            type="button"
            :disabled="!hasChanges || isLoading || isSaving"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3.5 text-[13px] font-bold text-stone-900 transition hover:bg-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            @click="savePreferences"
          >
            <Check :size="18" />
            {{ isSaving ? 'Saving...' : 'Save Preferences' }}
          </button>

          <p v-if="showSaveMessage" class="text-center text-[11px] font-semibold text-green-700">
            Preferences saved successfully!
          </p>

          <p
            v-if="errorMessage"
            class="text-center text-[11px] font-semibold text-red-600"
            role="alert"
          >
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
