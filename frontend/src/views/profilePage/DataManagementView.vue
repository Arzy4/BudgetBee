<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Database,
  Download,
  FileDown,
  ShieldCheck,
  Info,
  FileText,
  FileSpreadsheet,
  Share2,
  ChevronDown,
  Check,
} from 'lucide-vue-next'
import { getTransactions, type ApiTransaction } from '@/services/transactions/transactionService'
import { exportTransactionsToExcel } from '@/utils/exportExcel'
import { saveExportFile } from '@/utils/saveExportFile'
import CustomDatePicker from '@/components/profile/CustomDatePicker.vue'

import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const router = useRouter()

function goBack() {
  router.back()
}

type ChartPeriod = 'monthly' | 'yearly'

const chartPeriod = ref<ChartPeriod>('monthly')
const selectedYear = ref(new Date().getFullYear())

const transactions = ref<ApiTransaction[]>([])
const isLoadingChart = ref(true)
const chartError = ref('')

async function fetchChartTransactions() {
  isLoadingChart.value = true
  chartError.value = ''

  try {
    transactions.value = await getTransactions()
  } catch (error) {
    console.error('Failed to fetch chart transactions:', error)
    chartError.value = 'Unable to load your financial data.'
  } finally {
    isLoadingChart.value = false
  }
}

onMounted(() => {
  void fetchChartTransactions()
})

const availableYears = computed(() => {
  const years = new Set<number>([new Date().getFullYear()])

  transactions.value.forEach((transaction) => {
    const year = Number(transaction.date.slice(0, 4))

    if (Number.isInteger(year) && year > 0) {
      years.add(year)
    }
  })

  return Array.from(years).sort((a, b) => b - a)
})

const monthlyData = computed(() => {
  const income = Array<number>(12).fill(0)
  const expense = Array<number>(12).fill(0)

  transactions.value.forEach((transaction) => {
    const year = Number(transaction.date.slice(0, 4))
    const month = Number(transaction.date.slice(5, 7)) - 1
    const amount = Number(transaction.amount)

    if (year !== selectedYear.value || month < 0 || month > 11 || !Number.isFinite(amount)) {
      return
    }

    if (transaction.type === 'INCOME') {
      income[month] = (income[month] ?? 0) + amount
    } else if (transaction.type === 'EXPENSE') {
      expense[month] = (expense[month] ?? 0) + amount
    }
  })

  return { income, expense }
})

const yearlyData = computed(() => {
  const years = [...availableYears.value].sort((a, b) => a - b)

  const income = years.map(() => 0)
  const expense = years.map(() => 0)

  transactions.value.forEach((transaction) => {
    const year = Number(transaction.date.slice(0, 4))
    const amount = Number(transaction.amount)
    const index = years.indexOf(year)

    if (index === -1 || !Number.isFinite(amount)) return

    if (transaction.type === 'INCOME') {
      income[year] = (income[year] ?? 0) + amount
    } else if (transaction.type === 'EXPENSE') {
      expense[year] = (expense[year] ?? 0) + amount
    }
  })

  return {
    labels: years.map(String),
    income,
    expense,
  }
})

const chartData = computed<ChartData<'bar'>>(() => {
  const isMonthly = chartPeriod.value === 'monthly'

  return {
    labels: isMonthly
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : yearlyData.value.labels,

    datasets: [
      {
        label: 'Income',
        data: isMonthly ? monthlyData.value.income : yearlyData.value.income,
        backgroundColor: '#8C9B82',
        borderRadius: 5,
        maxBarThickness: 18,
      },
      {
        label: 'Expenses',
        data: isMonthly ? monthlyData.value.expense : yearlyData.value.expense,
        backgroundColor: '#FBBF24',
        borderRadius: 5,
        maxBarThickness: 18,
      },
    ],
  }
})

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID', {
    maximumFractionDigits: 2,
  })}`
}

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false,
    },

    datalabels: {
      display: false,
    },

    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.parsed.x ?? 0
          return `${context.dataset.label}: ${formatRupiah(value)}`
        },
      },
    },
  },

  scales: {
    x: {
      beginAtZero: true,
      grid: {
        color: 'rgba(120, 113, 108, 0.12)',
      },
      ticks: {
        color: '#78716C',
        font: {
          size: 10,
        },
        callback: (value) => {
          const amount = Number(value)

          if (amount >= 1_000_000) {
            return `Rp ${amount / 1_000_000}M`
          }

          if (amount >= 1_000) {
            return `Rp ${amount / 1_000}K`
          }

          return `Rp ${amount}`
        },
      },
    },

    y: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#78716C',
        font: {
          size: 10,
        },
        autoSkip: false,
      },
    },
  },
}))

// Export Data
type ExportRange = 'all' | 'month' | 'custom'
type ExportFormat = 'csv' | 'xlsx'

const exportRange = ref<ExportRange>('all')
const exportFormat = ref<ExportFormat>('xlsx')
const exportStartDate = ref('')
const exportEndDate = ref('')

const isExporting = ref(false)
const exportError = ref('')

const isCustomRangeInvalid = computed(() => {
  if (exportRange.value !== 'custom') return false

  if (!exportStartDate.value || !exportEndDate.value) {
    return true
  }

  return exportStartDate.value > exportEndDate.value
})

function getTransactionDate(date: string): string {
  return date.slice(0, 10)
}

function filterExportTransactions(transactions: ApiTransaction[]): ApiTransaction[] {
  if (exportRange.value === 'all') {
    return transactions
  }

  if (exportRange.value === 'month') {
    const now = new Date()

    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    return transactions.filter((transaction) => {
      const transactionDate = getTransactionDate(transaction.date)
      const [year, month] = transactionDate.split('-').map(Number)

      return year === currentYear && month === currentMonth
    })
  }

  return transactions.filter((transaction) => {
    const date = getTransactionDate(transaction.date)

    return date >= exportStartDate.value && date <= exportEndDate.value
  })
}

function escapeCsvValue(value: string | number | null | undefined): string {
  const text = String(value ?? '')

  // Prevent spreadsheet applications from interpreting values as formulas.
  const safeText = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text

  return `"${safeText.replace(/"/g, '""')}"`
}

function buildCsv(transactions: ApiTransaction[]): string {
  const headers = [
    'ID',
    'Date',
    'Title',
    'Description',
    'Type',
    'Category',
    'Payment Method',
    'Amount (IDR)',
  ]

  const rows = transactions.map((transaction) => [
    transaction.id,
    getTransactionDate(transaction.date),
    transaction.title,
    transaction.description ?? '',
    transaction.type,
    transaction.category.name,
    transaction.paymentMethod,
    transaction.amount,
  ])

  return [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\r\n')
}

type ExportAction = 'download' | 'share'

async function handleExportTransactions(action: ExportAction) {
  exportError.value = ''

  if (isCustomRangeInvalid.value) {
    exportError.value = 'Please select a valid start and end date.'
    return
  }

  isExporting.value = true

  try {
    const transactions = await getTransactions()

    const filteredTransactions = filterExportTransactions(transactions)

    if (filteredTransactions.length === 0) {
      exportError.value = 'No transactions found for the selected date range.'
      return
    }

    if (exportFormat.value === 'xlsx') {
      await exportTransactionsToExcel(filteredTransactions, action)
      return
    }

    const csvContent = '\uFEFF' + buildCsv(filteredTransactions)

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    await saveExportFile(
      blob,
      `budgetbee-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      action,
    )
  } catch (error) {
    console.error('Failed to export transactions:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    exportError.value = `Export failed: ${errorMessage}`
  } finally {
    isExporting.value = false
  }
}

// Customized Year Dropdown
const isYearDropdownOpen = ref(false)

function selectYear(year: number) {
  selectedYear.value = year
  isYearDropdownOpen.value = false
}

function closeYearDropdown(event: MouseEvent) {
  const target = event.target

  if (target instanceof Node && !yearDropdownRef.value?.contains(target)) {
    isYearDropdownOpen.value = false
  }
}

const yearDropdownRef = ref<HTMLElement | null>(null)

onMounted(() => {
  document.addEventListener('click', closeYearDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeYearDropdown)
})
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
          <h1 class="text-[20px] font-bold text-stone-900 phone:text-[24px]">Data Management</h1>

          <p class="mt-1 text-[11px] text-stone-500 phone:text-[12px]">
            Manage and export your financial records
          </p>
        </div>

        <!-- Scrollable Content -->
        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain">
          <!-- Financial Data Section -->
          <section
            class="rounded-3xl border border-white/80 bg-white/20 p-5 shadow-sm backdrop-blur-sm"
          >
            <!-- Section Header -->
            <div class="mb-4 flex items-center gap-2">
              <Database :size="20" class="text-amber-600" />

              <h2 class="text-[14px] font-bold text-stone-900 phone:text-[16px]">
                Your Financial Data
              </h2>
            </div>

            <!-- Monthly / Yearly Toggle -->
            <div class="mb-4 flex rounded-full bg-amber-100/70 p-1">
              <button
                type="button"
                class="flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors"
                :class="
                  chartPeriod === 'monthly'
                    ? 'bg-amber-400 text-stone-900 shadow-sm'
                    : 'text-stone-500'
                "
                @click="chartPeriod = 'monthly'"
              >
                Monthly
              </button>

              <button
                type="button"
                class="flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors"
                :class="
                  chartPeriod === 'yearly'
                    ? 'bg-amber-400 text-stone-900 shadow-sm'
                    : 'text-stone-500'
                "
                @click="chartPeriod = 'yearly'"
              >
                Yearly
              </button>
            </div>

            <!-- Chart Subtitle and Year Selector -->
            <div class="mb-3 flex items-center justify-between gap-2">
              <p class="text-[11px] text-stone-500">
                {{
                  chartPeriod === 'monthly'
                    ? 'Monthly income & expenses'
                    : 'Annual income & expenses'
                }}
              </p>

              <div v-if="chartPeriod === 'monthly'" ref="yearDropdownRef" class="relative shrink-0">
                <!-- Dropdown trigger -->
                <button
                  type="button"
                  aria-label="Select chart year"
                  :aria-expanded="isYearDropdownOpen"
                  aria-haspopup="listbox"
                  class="flex min-w-[100px] items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-[11px] font-semibold text-stone-800 shadow-sm backdrop-blur-md transition-all hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                  @click="isYearDropdownOpen = !isYearDropdownOpen"
                >
                  <span>{{ selectedYear }}</span>

                  <ChevronDown
                    :size="15"
                    class="text-stone-500 transition-transform duration-200"
                    :class="{ 'rotate-180': isYearDropdownOpen }"
                  />
                </button>

                <!-- Dropdown menu -->
                <Transition
                  enter-active-class="transition duration-150 ease-out"
                  enter-from-class="translate-y-[-5px] opacity-0"
                  enter-to-class="translate-y-0 opacity-100"
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="translate-y-0 opacity-100"
                  leave-to-class="translate-y-[-5px] opacity-0"
                >
                  <div
                    v-if="isYearDropdownOpen"
                    role="listbox"
                    aria-label="Chart year"
                    class="absolute right-0 top-full z-50 mt-2 max-h-48 min-w-full overflow-y-auto rounded-xl border border-white/80 bg-[#FFF9ED] p-1.5 shadow-xl"
                  >
                    <button
                      v-for="year in availableYears"
                      :key="year"
                      type="button"
                      role="option"
                      :aria-selected="selectedYear === year"
                      class="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-[11px] font-medium transition-colors"
                      :class="
                        selectedYear === year
                          ? 'bg-amber-200/80 text-stone-900'
                          : 'text-stone-600 hover:bg-amber-100/70'
                      "
                      @click="selectYear(year)"
                    >
                      <span>{{ year }}</span>

                      <Check v-if="selectedYear === year" :size="14" class="text-amber-700" />
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Custom Legend -->
            <div class="mb-4 flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-sm 0 bg-[#8C9B82]"></span>
                <span class="text-[11px] text-stone-600">Income</span>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-sm bg-amber-400"></span>
                <span class="text-[11px] text-stone-600">Expenses</span>
              </div>
            </div>

            <!-- Bar Chart -->
            <div
              class="relative w-full"
              :class="
                chartPeriod === 'monthly'
                  ? 'h-[380px] phone:h-[460px]'
                  : 'h-[240px] phone:h-[280px]'
              "
            >
              <div
                v-if="isLoadingChart"
                class="flex h-full items-center justify-center text-[12px] text-stone-500"
              >
                Loading financial data...
              </div>

              <div
                v-else-if="chartError"
                role="alert"
                class="flex h-full items-center justify-center text-center text-[12px] text-red-600"
              >
                {{ chartError }}
              </div>

              <div
                v-else-if="transactions.length === 0"
                class="flex h-full items-center justify-center text-center text-[12px] text-stone-500"
              >
                No transactions recorded yet.
              </div>

              <Bar v-else :data="chartData" :options="chartOptions" />
            </div>

            <p class="mt-3 text-center text-[10px] text-stone-400">
              Financial activity based on your recorded transactions
            </p>
          </section>

          <!-- Export Transactions -->
          <section
            class="rounded-3xl border border-white/80 bg-white/20 p-5 shadow-sm backdrop-blur-sm"
          >
            <!-- Header -->
            <div class="mb-4 flex items-center gap-2">
              <FileDown :size="20" class="text-amber-600" />

              <h2 class="text-[14px] font-bold text-stone-900 phone:text-[16px]">
                Export Transactions
              </h2>
            </div>

            <p class="mb-5 text-[11px] text-stone-500 phone:text-[12px]">
              Download a copy of your income and expense history.
            </p>

            <!-- Date Range -->
            <div class="space-y-3">
              <p class="text-[12px] font-semibold text-stone-800">Date Range</p>

              <label
                v-for="option in [
                  { value: 'all', label: 'All Transactions' },
                  { value: 'month', label: 'This Month' },
                  { value: 'custom', label: 'Custom Date Range' },
                ]"
                :key="option.value"
                class="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2"
              >
                <input
                  v-model="exportRange"
                  type="radio"
                  name="exportRange"
                  :value="option.value"
                  class="size-4 accent-amber-500"
                />

                <span class="text-[12px] text-stone-700 phone:text-[13px]">
                  {{ option.label }}
                </span>
              </label>
            </div>

            <!-- Custom Date Range -->
            <div v-if="exportRange === 'custom'" class="mt-4 grid grid-cols-2 gap-3">
              <!-- Start Date -->
              <div class="min-w-0 space-y-2">
                <label for="export-start-date" class="text-[11px] font-semibold text-stone-700">
                  Start Date
                </label>

                <CustomDatePicker
                  id="export-start-date"
                  v-model="exportStartDate"
                  placeholder="Start date"
                />
              </div>

              <!-- End Date -->
              <div class="min-w-0 space-y-2">
                <label for="export-end-date" class="text-[11px] font-semibold text-stone-700">
                  End Date
                </label>

                <CustomDatePicker
                  id="export-end-date"
                  v-model="exportEndDate"
                  :min="exportStartDate || undefined"
                  placeholder="End date"
                />
              </div>
            </div>

            <!-- File Format -->
            <div class="mt-5 space-y-3">
              <p class="text-[12px] font-semibold text-stone-800">File Format</p>

              <div class="grid grid-cols-2 gap-3">
                <!-- CSV Format -->
                <label
                  class="flex cursor-pointer flex-col gap-2 rounded-2xl border p-3 transition-colors"
                  :class="
                    exportFormat === 'csv'
                      ? 'border-amber-400 bg-amber-100/70'
                      : 'border-white/80 bg-white/30'
                  "
                >
                  <div class="flex items-center justify-between">
                    <FileText :size="20" class="text-amber-600" />

                    <input
                      v-model="exportFormat"
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      class="size-4 accent-amber-500"
                    />
                  </div>

                  <div>
                    <p class="text-[12px] font-bold text-stone-900">CSV (.csv)</p>

                    <p class="mt-1 text-[10px] text-stone-500">Raw transaction data</p>
                  </div>
                </label>

                <!-- Excel Format -->
                <label
                  class="flex cursor-pointer flex-col gap-2 rounded-2xl border p-3 transition-colors"
                  :class="
                    exportFormat === 'xlsx'
                      ? 'border-amber-400 bg-amber-100/70'
                      : 'border-white/80 bg-white/30'
                  "
                >
                  <div class="flex items-center justify-between">
                    <FileSpreadsheet :size="20" class="text-amber-600" />

                    <input
                      v-model="exportFormat"
                      type="radio"
                      name="exportFormat"
                      value="xlsx"
                      class="size-4 accent-amber-500"
                    />
                  </div>

                  <div>
                    <p class="text-[12px] font-bold text-stone-900">Excel (.xlsx)</p>

                    <p class="mt-1 text-[10px] text-stone-500">Formatted financial report</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Export Error -->
            <p v-if="exportError" role="alert" class="mt-4 text-[11px] font-medium text-red-600">
              {{ exportError }}
            </p>

            <!-- Export Button -->
            <div class="grid grid-cols-2 gap-3 mt-4">
              <!-- Download Button -->
              <button
                type="button"
                :disabled="isExporting || isCustomRangeInvalid"
                @click="handleExportTransactions('download')"
                class="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-stone-900 disabled:opacity-50"
              >
                <Download :size="18" />
                {{ isExporting ? 'Processing...' : 'Download' }}
              </button>

              <!-- Share Button -->
              <button
                type="button"
                :disabled="isExporting || isCustomRangeInvalid"
                @click="handleExportTransactions('share')"
                class="flex items-center justify-center gap-2 rounded-xl border border-amber-400 px-4 py-3 font-semibold text-stone-800 disabled:opacity-50"
              >
                <Share2 :size="18" />
                Share
              </button>
            </div>
          </section>

          <!-- Data & Privacy Section -->
          <section
            class="rounded-3xl border border-white/80 bg-white/20 p-5 shadow-sm backdrop-blur-sm"
          >
            <!-- Section Header -->
            <div class="mb-3 flex items-center gap-2">
              <ShieldCheck :size="20" class="text-amber-600" />

              <h2 class="text-[14px] font-bold text-stone-900 phone:text-[16px]">Data & Privacy</h2>
            </div>

            <!-- Privacy Description -->
            <p class="text-[11px] leading-relaxed text-stone-500 phone:text-[12px]">
              Exported files may contain sensitive financial information. Keep your downloaded
              records in a secure location.
            </p>
          </section>

          <!-- Export Reminder -->
          <div
            class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-100/70 p-4"
          >
            <Info :size="18" class="mt-0.5 shrink-0 text-amber-600" />

            <p class="text-[11px] leading-relaxed text-amber-800 phone:text-[12px]">
              Export your financial records regularly if you want an offline backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
