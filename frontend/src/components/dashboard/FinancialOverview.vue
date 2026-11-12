<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Bell,
  BellOff,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDown,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useTransactionStore } from '@/stores/transactions'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)

const transactionStore = useTransactionStore()

const isNotificationOpen = ref(false)

// Temporary value until we connect the notification API
const unreadNotificationCount = ref(0)

const toggleNotification = () => {
  isNotificationOpen.value = !isNotificationOpen.value
}

const closeNotification = () => {
  isNotificationOpen.value = false
}

const { selectedMonth, monthlyTransactions } = storeToRefs(transactionStore)
/* Month display */
const formattedMonth = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)

  const date = new Date(Date.UTC(year!, month! - 1, 1))

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
})

/* Previous month */
const previousMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)

  const date = new Date(Date.UTC(year!, month! - 2, 1))

  selectedMonth.value = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
  ].join('-')
}

/* Next month */
const nextMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)

  const date = new Date(Date.UTC(year!, month!, 1))

  selectedMonth.value = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
  ].join('-')
}

const totalIncome = computed(() => {
  return monthlyTransactions.value
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
})

const totalExpenses = computed(() => {
  return monthlyTransactions.value
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
})

const categoryColors = ['#FFC83D', '#FF914D', '#F36B32', '#F3E9D7', '#9DBF8B', '#A78BFA']

const categories = computed(() => {
  const categoryTotals = new Map<number, { name: string; amount: number }>()

  monthlyTransactions.value
    .filter((transaction) => transaction.type === 'EXPENSE')
    .forEach((transaction) => {
      const categoryId = transaction.categoryId
      const categoryName = transaction.category.name
      const amount = Number(transaction.amount)

      const existing = categoryTotals.get(categoryId)

      if (existing) {
        existing.amount += amount
      } else {
        categoryTotals.set(categoryId, {
          name: categoryName,
          amount,
        })
      }
    })

  return Array.from(categoryTotals.values()).map((category, index) => ({
    ...category,
    color: categoryColors[index % categoryColors.length]!,
  }))
})

const netIncome = computed(() => totalIncome.value - totalExpenses.value)

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: categories.value.map((category) => category.name),
  datasets: [
    {
      data: categories.value.map((category) => category.amount),
      backgroundColor: categories.value.map((category) => category.color),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      callbacks: {
        label: (context) => {
          const amount = Number(context.raw)
          return `${context.label}: ${formatCurrency(amount)}`
        },
      },
    },

    // Display percentages inside the doughnut chart
    datalabels: {
      display: (context) => {
        const value = Number(context.dataset.data[context.dataIndex] ?? 0)
        return value > 0
      },

      color: (context) => {
        // Dark text on the light "Other" segment
        return context.dataIndex === 3 ? '#57534E' : '#FFFFFF'
      },

      font: {
        size: 11,
        weight: 'bold',
      },

      anchor: 'center',
      align: 'center',

      formatter: (value: number) => {
        const total = categories.value.reduce((sum, category) => sum + category.amount, 0)

        if (total === 0) return ''

        const percentage = (value / total) * 100

        return `${Math.round(percentage)}%`
      },
    },
  },
}
</script>

<template>
  <section class="flex h-full min-h-0 w-full flex-col">
    <!-- Header and Month Navigation -->
    <div class="mb-3 flex flex-col gap-2 sm:mb-4 sm:gap-3">
      <!-- Dashboard Header -->
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-[20px] phone:text-[24px] font-bold leading-tight text-stone-900">
            Financial Overview
          </h1>

          <p class="mt-1 text-[11px] phone:text-[12px] leading-4 text-stone-500 sm:text-sm">
            Here's your income and expenses this month
          </p>
        </div>

        <!-- Notification Button -->
        <button
          type="button"
          aria-label="Open notifications"
          :aria-expanded="isNotificationOpen"
          aria-haspopup="dialog"
          class="relative flex h-11 w-11 phone:h-12 phone:w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm transition-all hover:bg-amber-200 active:scale-95"
          @click="toggleNotification"
        >
          <Bell class="size-[22px] phone:size-[28px]" :stroke-width="1.9" />

          <span
            v-if="unreadNotificationCount > 0"
            class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {{ unreadNotificationCount > 9 ? '9+' : unreadNotificationCount }}
          </span>
        </button>
      </header>
    </div>

    <!-- Month Navigation -->
    <div class="mb-3 flex h-10 items-center justify-between px-4 sm:px-8">
      <button
        type="button"
        aria-label="Previous month"
        class="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-white/60"
        @click="previousMonth"
      >
        <ChevronLeft class="size-[21px] phone:size-[25px]" />
      </button>

      <h2 class="text-center text-[14px] phone:text-[16px] font-semibold text-stone-700">
        {{ formattedMonth }}
      </h2>

      <button
        type="button"
        aria-label="Next month"
        class="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-white/60"
        @click="nextMonth"
      >
        <ChevronRight class="size-[21pxpx] phone:size-[25px]" />
      </button>
    </div>

    <!-- Overview Card -->
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/40 bg-white/40 px-4 pt-3 pb-4 shadow-lg shadow-amber-900/5 backdrop-blur-md sm:px-5 sm:pt-4 sm:pb-5"
    >
      <!-- Income and Expenses -->
      <div class="grid shrink-0 grid-cols-2 gap-8 sm:gap-10 justify-items-center pb-2">
        <div class="flex min-w-0 items-center gap-2">
          <div
            class="flex h-7 w-7 phone:h-9 phone:w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"
          >
            <ArrowDown class="size-[14px] phone:size-[16px]" />
          </div>

          <div class="min-w-0">
            <p class="text-[10px] phone:text-[11px] text-stone-500">Total Income</p>
            <p
              class="break-words text-[12px] phone:text-[14px] font-bold leading-tight text-emerald-600"
            >
              {{ formatCurrency(totalIncome) }}
            </p>
          </div>
        </div>

        <div class="flex min-w-0 items-center gap-2">
          <div
            class="flex h-7 w-7 phone:h-9 phone:w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500"
          >
            <ArrowUpRight class="size-[14px] phone:size-[16px]" />
          </div>

          <div class="min-w-0">
            <p class="text-[10px] phone:text-[11px] text-stone-500">Total Expenses</p>
            <p
              class="break-words text-[12px] phone:text-[14px] font-bold leading-tight text-red-500"
            >
              {{ formatCurrency(totalExpenses) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Doughnut Chart -->
      <div
        class="relative mx-auto mt-2 h-[170px] w-[170px] shrink-0 phone:h-[200px] phone:w-[200px]"
      >
        <Doughnut v-if="totalExpenses > 0" :data="chartData" :options="chartOptions" />

        <div v-else class="absolute inset-0 rounded-full border-24 border-[#F3E9D7]/70"></div>

        <!-- Center Text -->
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <p class="text-[12px] phone:text-[14px] text-stone-500">Net Income</p>

          <div class="mt-1 flex items-center justify-center gap-1.5">
            <!-- Net Income Amount -->
            <p
              class="max-w-[110px] break-words text-center text-[11px] phone:text-[12px] font-bold leading-tight text-stone-900 sm:max-w-[140px] sm:text-sm"
            >
              {{ formatCurrency(netIncome) }}
            </p>

            <!-- Positive: Solid Green Triangle -->
            <span
              v-if="netIncome > 0"
              class="h-0 w-0 shrink-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-green-600"
            ></span>

            <!-- Negative: Solid Red Triangle -->
            <span
              v-else-if="netIncome < 0"
              class="h-0 w-0 shrink-0 border-x-[7px] border-t-[12px] border-x-transparent border-t-red-600"
            ></span>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="mt-2 flex min-h-0 flex-1 flex-col justify-start overflow-hidden pt-2">
        <!-- Category List -->
        <div
          class="grid max-h-full grid-cols-3 gap-x-2 gap-y-3 overflow-y-auto overscroll-contain px-1 pb-3 sm:grid-cols-4"
        >
          <div
            v-for="category in categories"
            :key="category.name"
            class="flex min-w-0 flex-col items-center gap-1 text-center"
          >
            <!-- Category Name -->
            <div class="flex min-w-0 max-w-full items-center justify-center gap-1">
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :style="{ backgroundColor: category.color }"
              ></span>

              <span
                class="min-w-0 break-words text-[9px] phone:text-[10px] font-medium leading-tight text-stone-500"
              >
                {{ category.name }}
              </span>
            </div>

            <!-- Category Amount -->
            <p
              class="max-w-full break-words text-[9px] phone:text-[10px] font-semibold leading-tight text-stone-800 sm:text-[10px]"
            >
              {{ formatCurrency(category.amount) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Notification Center Modal -->
  <Teleport to="body">
    <div
      v-if="isNotificationOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      @click.self="closeNotification"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
        class="flex w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-[#FFF9ED] shadow-2xl"
        style="max-height: min(80dvh, 600px)"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-amber-100 px-5 py-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
            >
              <Bell :size="21" />
            </div>

            <div>
              <h2 id="notification-title" class="text-[17px] font-bold text-stone-900">
                Notification Center
              </h2>

              <p class="text-xs text-stone-500">Stay updated with your finances</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close notifications"
            class="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-amber-100"
            @click="closeNotification"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Notification Content -->
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div
              class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600"
            >
              <BellOff :size="28" :stroke-width="1.7" />
            </div>

            <h3 class="text-[15px] font-semibold text-stone-800">No notifications yet</h3>

            <p class="mt-2 max-w-[240px] text-xs leading-5 text-stone-500">
              You're all caught up! Your budget alerts and important updates will appear here.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t border-amber-100 px-5 py-4">
          <button
            type="button"
            class="w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-500 active:scale-[0.98]"
            @click="closeNotification"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
