<script setup lang="ts">
import { computed, ref } from 'vue'
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

        <p class="text-sm text-stone-500">Here's your income and expenses this month</p>
      </div>

      <input
        v-model="selectedMonth"
        type="month"
        aria-label="Select month"
        class="max-w-32 rounded-full bg-white/40 px-3 py-2 text-xs text-stone-800 outline-none backdrop-blur-md"
      />
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

          <p class="text-md font-bold text-stone-900">
            {{ formatCurrency(netIncome) }}
          </p>
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
