<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'
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

const { selectedMonth, monthlyTransactions } = storeToRefs(transactionStore)
const isMonthDropdownOpen = ref(false)

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const parseSelectedMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)

  const now = new Date()

  return {
    year: year && year > 0 ? year : now.getFullYear(),
    month: month && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1,
  }
}

const initialPeriod = parseSelectedMonth()

const temporaryMonth = ref(initialPeriod.month)
const temporaryYear = ref(initialPeriod.year)

const selectedPeriodLabel = computed(() => {
  const { year, month } = parseSelectedMonth()

  return `${months[month - 1]} ${year}`
})

const openMonthDropdown = () => {
  const { year, month } = parseSelectedMonth()

  temporaryMonth.value = month
  temporaryYear.value = year

  isMonthDropdownOpen.value = true
}

const closeMonthDropdown = () => {
  isMonthDropdownOpen.value = false
}

const toggleMonthDropdown = () => {
  if (isMonthDropdownOpen.value) {
    closeMonthDropdown()
  } else {
    openMonthDropdown()
  }
}

const applyMonth = () => {
  const month = String(temporaryMonth.value).padStart(2, '0')

  selectedMonth.value = `${temporaryYear.value}-${month}`

  closeMonthDropdown()
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
  <section class="w-full">
    <!-- Header -->
    <div class="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Financial Overview</h1>

        <p class="text-sm text-stone-500 max-w-[90%]">Here's your income and expenses this month</p>
      </div>

      <!-- Custom Month Selector -->
      <div class="relative shrink-0">
        <button
          type="button"
          aria-label="Select financial overview month"
          :aria-expanded="isMonthDropdownOpen"
          class="flex items-center gap-2 rounded-full bg-white/50 px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur-md transition-colors hover:bg-amber-100"
          @click="isMonthDropdownOpen ? closeMonthDropdown() : openMonthDropdown()"
        >
          <CalendarDays :size="15" class="shrink-0 text-amber-700" />

          <span class="whitespace-nowrap">
            {{ selectedPeriodLabel }}
          </span>

          <ChevronDown
            :size="15"
            class="shrink-0 text-amber-700 transition-transform"
            :class="isMonthDropdownOpen ? 'rotate-180' : ''"
          />
        </button>

        <!-- Dropdown Panel -->
        <div
          v-if="isMonthDropdownOpen"
          class="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/80 bg-[#FFF8ED] p-4 shadow-xl"
        >
          <!-- Year Navigation -->
          <div class="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous year"
              class="rounded-xl bg-white p-2 text-amber-700 hover:bg-amber-100"
              @click="temporaryYear--"
            >
              <ChevronLeft :size="18" />
            </button>

            <span class="text-sm font-bold text-stone-800">
              {{ temporaryYear }}
            </span>

            <button
              type="button"
              aria-label="Next year"
              class="rounded-xl bg-white p-2 text-amber-700 hover:bg-amber-100"
              @click="temporaryYear++"
            >
              <ChevronRight :size="18" />
            </button>
          </div>

          <!-- Month Grid -->
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(month, index) in months"
              :key="month"
              type="button"
              class="rounded-xl px-2 py-3 text-xs font-medium transition-colors"
              :class="
                temporaryMonth === index + 1
                  ? 'bg-[#FFBA08] font-bold text-stone-900'
                  : 'bg-white text-stone-600 hover:bg-amber-100'
              "
              @click="temporaryMonth = index + 1"
            >
              {{ month.slice(0, 3) }}
            </button>
          </div>

          <!-- Actions -->
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-full border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              @click="closeMonthDropdown"
            >
              Cancel
            </button>

            <button
              type="button"
              class="rounded-full bg-[#FFBA08] py-2.5 text-xs font-bold text-stone-900 hover:bg-amber-400"
              @click="applyMonth"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Card -->
    <div
      class="rounded-3xl border border-white/40 bg-white/40 p-4 shadow-lg shadow-amber-900/5 backdrop-blur-md h-[45svh]"
    >
      <!-- Income and Expenses -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"
          >
            ↓
          </div>

          <div>
            <p class="text-xs text-stone-500">Total Income</p>
            <p class="text-base font-bold text-emerald-600">
              {{ formatCurrency(totalIncome) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500"
          >
            ↗
          </div>

          <div>
            <p class="text-xs text-stone-500">Total Expenses</p>
            <p class="text-base font-bold text-red-500">
              {{ formatCurrency(totalExpenses) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Doughnut Chart -->
      <div class="relative mx-auto mt-2 h-50 w-50">
        <Doughnut v-if="totalExpenses > 0" :data="chartData" :options="chartOptions" />

        <div v-else class="absolute inset-0 rounded-full border-24 border-[#F3E9D7]/70"></div>

        <!-- Center Text -->
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <p class="text-xs text-stone-500">Net Income</p>

          <div class="mt-1 flex items-center justify-center gap-1.5">
            <!-- Net Income Amount -->
            <p class="text-sm font-bold text-stone-900">
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
      <div class="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-4 px-2">
        <div
          v-for="category in categories"
          :key="category.name"
          class="flex max-w-[120px] min-w-0 flex-col items-center gap-1 text-center"
        >
          <!-- Category Name -->
          <div class="flex min-w-0 max-w-full items-center justify-center gap-1.5">
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: category.color }"
            ></span>

            <span class="min-w-0 break-words text-[10px] leading-tight font-medium text-stone-500">
              {{ category.name }}
            </span>
          </div>

          <!-- Category Amount -->
          <p class="max-w-full break-words text-[10px] leading-tight font-semibold text-stone-800">
            {{ formatCurrency(category.amount) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
