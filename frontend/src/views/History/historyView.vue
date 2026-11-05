<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import {
  History,
  Search,
  CalendarDays,
  SlidersHorizontal,
  UtensilsCrossed,
  Wallet,
  CarFront,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-vue-next'
import { getTransactions } from '@/services/transactions/transactionService'
import type { ApiTransaction } from '@/services/transactions/transactionService'

type TransactionType = 'INCOME' | 'EXPENSE'
type TransactionFilter = 'ALL' | TransactionType

interface HistoryTransaction {
  id: number
  title: string
  category: string
  amount: number
  type: TransactionType
  date: string
  paymentMethod: string
  description?: string
  createdAt: string
}

interface AdvancedFilters {
  category: string
  paymentMethod: string
  minAmount: string
  maxAmount: string
}

const router = useRouter()

const transactions = ref<HistoryTransaction[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const mapTransaction = (transaction: ApiTransaction): HistoryTransaction => ({
  id: transaction.id,
  title: transaction.title,
  category: transaction.category.name,
  amount: Number(transaction.amount),
  type: transaction.type,
  date: transaction.date,
  paymentMethod: transaction.paymentMethod,
  description: transaction.description ?? undefined,
  createdAt: transaction.createdAt,
})

const fetchTransactions = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await getTransactions()

    transactions.value = result.map(mapTransaction)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)

    errorMessage.value = 'Unable to load transactions. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTransactions)

const searchQuery = ref('')
const activeFilter = ref<TransactionFilter>('ALL')
const selectedTransaction = ref<HistoryTransaction | null>(null)

const filters: { label: string; value: TransactionFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
]

const filteredTransactions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const advanced = appliedAdvancedFilters.value

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    month: 'numeric',
    year: 'numeric',
  })

  return transactions.value
    .filter((transaction) => {
      const matchesType = activeFilter.value === 'ALL' || transaction.type === activeFilter.value

      const matchesSearch =
        !query ||
        transaction.title.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query)

      const dateParts = dateFormatter.formatToParts(new Date(transaction.date))

      const month = Number(dateParts.find((part) => part.type === 'month')?.value)
      const year = Number(dateParts.find((part) => part.type === 'year')?.value)

      const matchesPeriod = month === selectedMonth.value && year === selectedYear.value

      const matchesCategory =
        advanced.category === 'ALL' || transaction.category === advanced.category

      const matchesPayment =
        advanced.paymentMethod === 'ALL' || transaction.paymentMethod === advanced.paymentMethod

      const matchesMin =
        advanced.minAmount === '' || transaction.amount >= Number(advanced.minAmount)

      const matchesMax =
        advanced.maxAmount === '' || transaction.amount <= Number(advanced.maxAmount)

      return (
        matchesType &&
        matchesSearch &&
        matchesPeriod &&
        matchesCategory &&
        matchesPayment &&
        matchesMin &&
        matchesMax
      )
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatPaymentMethod = (method: string) => method.replaceAll('_', ' ')

const getCategoryIcon = (category: string) => {
  const name = category.toLowerCase()

  if (name.includes('food') || name.includes('drink')) {
    return UtensilsCrossed
  }

  if (name.includes('transport')) {
    return CarFront
  }

  return Wallet
}

const openTransactionDetails = (transaction: HistoryTransaction) => {
  router.push({
    name: 'transaction-detail',
    params: { id: transaction.id },
  })
}

const closeTransactionDetails = () => {
  selectedTransaction.value = null
}

const getCurrentPeriod = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date())

  return {
    month: Number(parts.find((part) => part.type === 'month')?.value),
    year: Number(parts.find((part) => part.type === 'year')?.value),
  }
}

const currentPeriod = getCurrentPeriod()
const selectedMonth = ref(currentPeriod.month)
const selectedYear = ref(currentPeriod.year)
const temporaryMonth = ref(currentPeriod.month)
const temporaryYear = ref(currentPeriod.year)

const isCalendarOpen = ref(false)

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const monthOptions = months.map((name, index) => ({
  label: name,
  value: index + 1,
}))

const yearOptions = Array.from({ length: 11 }, (_, index) => currentPeriod.year - 5 + index)

const selectedPeriodLabel = computed(
  () => `${months[selectedMonth.value - 1]} ${selectedYear.value}`,
)

const openCalendar = () => {
  temporaryMonth.value = selectedMonth.value
  temporaryYear.value = selectedYear.value
  closeDropdown()
  isCalendarOpen.value = true
}

const closeCalendar = () => {
  closeDropdown()
  isCalendarOpen.value = false
}

const applyPeriod = () => {
  selectedMonth.value = temporaryMonth.value
  selectedYear.value = temporaryYear.value
  closeCalendar()
}

const createDefaultFilters = (): AdvancedFilters => ({
  category: 'ALL',
  paymentMethod: 'ALL',
  minAmount: '',
  maxAmount: '',
})

const isAdvancedFilterOpen = ref(false)
const appliedAdvancedFilters = ref<AdvancedFilters>(createDefaultFilters())
const temporaryAdvancedFilters = ref<AdvancedFilters>(createDefaultFilters())
const advancedFilterError = ref('')

const paymentMethodOptions = [
  { label: 'All Payment Methods', value: 'ALL' },
  { label: 'CASH', value: 'CASH' },
  { label: 'BANK TRANSFER', value: 'BANK_TRANSFER' },
  { label: 'E-WALLET', value: 'E_WALLET' },
  { label: 'CARD', value: 'CARD' },
]

const categoryOptions = computed(() => {
  const categories = [
    ...new Set(transactions.value.map((transaction) => transaction.category)),
  ].sort()

  return [
    { label: 'All Categories', value: 'ALL' },
    ...categories.map((category) => ({
      label: category,
      value: category,
    })),
  ]
})

const hasActiveAdvancedFilters = computed(() => {
  const filters = appliedAdvancedFilters.value

  return (
    filters.category !== 'ALL' ||
    filters.paymentMethod !== 'ALL' ||
    filters.minAmount !== '' ||
    filters.maxAmount !== ''
  )
})

const openAdvancedFilters = () => {
  temporaryAdvancedFilters.value = {
    ...appliedAdvancedFilters.value,
  }

  advancedFilterError.value = ''
  closeDropdown()
  isAdvancedFilterOpen.value = true
}

const closeAdvancedFilters = () => {
  closeDropdown()
  isAdvancedFilterOpen.value = false
  advancedFilterError.value = ''
}

const applyAdvancedFilters = () => {
  const filters = temporaryAdvancedFilters.value

  const min = filters.minAmount === '' ? null : Number(filters.minAmount)
  const max = filters.maxAmount === '' ? null : Number(filters.maxAmount)

  if (
    (min !== null && (!Number.isFinite(min) || min < 0)) ||
    (max !== null && (!Number.isFinite(max) || max < 0))
  ) {
    advancedFilterError.value = 'Enter valid non-negative amounts.'
    return
  }

  if (min !== null && max !== null && min > max) {
    advancedFilterError.value = 'Minimum amount cannot exceed maximum amount.'
    return
  }

  appliedAdvancedFilters.value = { ...filters }
  closeAdvancedFilters()
}

const resetAdvancedFilters = () => {
  temporaryAdvancedFilters.value = createDefaultFilters()
  appliedAdvancedFilters.value = createDefaultFilters()
  closeAdvancedFilters()
}

type DropdownName = 'month' | 'year' | 'category' | 'paymentMethod'

const activeDropdown = ref<DropdownName | null>(null)

const toggleDropdown = (name: DropdownName) => {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

const closeDropdown = () => {
  activeDropdown.value = null
}

const selectMonth = (month: number) => {
  temporaryMonth.value = month
  closeDropdown()
}

const selectYear = (year: number) => {
  temporaryYear.value = year
  closeDropdown()
}

const selectCategory = (category: string) => {
  temporaryAdvancedFilters.value.category = category
  closeDropdown()
}

const selectPaymentMethod = (method: string) => {
  temporaryAdvancedFilters.value.paymentMethod = method
  closeDropdown()
}

const selectedCategoryLabel = computed(
  () =>
    categoryOptions.value.find((option) => option.value === temporaryAdvancedFilters.value.category)
      ?.label ?? 'All Categories',
)

const selectedPaymentMethodLabel = computed(
  () =>
    paymentMethodOptions.find(
      (option) => option.value === temporaryAdvancedFilters.value.paymentMethod,
    )?.label ?? 'All Payment Methods',
)
</script>

<template>
  <main
    class="relative min-h-screen w-full px-5 pt-9 pb-28 flex h-dvh w-full flex-col overflow-hidden"
  >
    <div class="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col gap-5">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-stone-800">Transaction History</h1>
          <p class="mt-1 text-sm text-stone-500">Track every transaction</p>
        </div>

        <div class="flex p-3 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
          <History :size="22" class="text-amber-700" />
        </div>
      </header>

      <!-- Search -->
      <div class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
        <Search :size="19" class="shrink-0 text-stone-400" />

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search transactions..."
          aria-label="Search transactions"
          class="min-w-0 flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
        />
      </div>

      <!-- Quick Filters -->
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          class="rounded-full px-4 py-3 text-sm font-semibold transition-colors"
          :class="
            activeFilter === filter.value
              ? 'bg-[#FFBA08]/90 text-stone-900'
              : 'bg-white/40 text-stone-600 hover:bg-amber-50 backdrop-blur-md'
          "
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Month and Filter Controls -->
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-stone-700">
          {{ selectedPeriodLabel }}
        </h2>

        <div class="flex items-center gap-2">
          <button
            type="button"
            aria-label="Choose transaction dates"
            class="rounded-xl bg-amber-100 p-2 text-amber-700"
            @click="openCalendar"
          >
            <CalendarDays :size="20" />
          </button>

          <button
            type="button"
            aria-label="Advanced transaction filters"
            :aria-pressed="hasActiveAdvancedFilters"
            class="relative rounded-xl p-2 transition-colors"
            :class="
              hasActiveAdvancedFilters
                ? 'bg-[#FFBA08] text-stone-900'
                : 'bg-amber-100 text-amber-700'
            "
            @click="openAdvancedFilters"
          >
            <SlidersHorizontal :size="20" />

            <span
              v-if="hasActiveAdvancedFilters"
              class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500"
            ></span>
          </button>
        </div>
      </div>

      <!-- Transaction List -->
      <section class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center h-full pb-12">
          <p class="text-sm text-stone-500">Loading transactions...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMessage"
          class="rounded-2xl bg-white/40 p-8 text-center backdrop-blur-md"
        >
          <p class="text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <button
            type="button"
            class="mt-3 text-sm font-semibold text-amber-700"
            @click="fetchTransactions"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredTransactions.length === 0"
          class="flex justify-center items-center h-full pb-12"
        >
          <p class="text-sm text-stone-500">No transactions found.</p>
        </div>

        <!-- Transaction Cards -->
        <template v-else>
          <article
            v-for="transaction in filteredTransactions"
            :key="transaction.id"
            class="rounded-2xl bg-white/40 p-4 shadow-sm backdrop-blur-md"
          >
            <!-- Transaction Information -->
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                :class="transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-amber-100'"
              >
                <component
                  :is="getCategoryIcon(transaction.category)"
                  :size="21"
                  :class="transaction.type === 'INCOME' ? 'text-green-700' : 'text-amber-600'"
                />
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-semibold text-stone-800">
                  {{ transaction.title }}
                </h3>

                <p class="mt-1 truncate text-xs text-stone-500">
                  {{ transaction.category }}
                </p>
              </div>

              <p
                class="shrink-0 text-right text-sm font-semibold"
                :class="transaction.type === 'INCOME' ? 'text-green-700' : 'text-red-600'"
              >
                {{ transaction.type === 'INCOME' ? '+' : '−'
                }}{{ formatCurrency(transaction.amount) }}
              </p>
            </div>

            <div class="my-3 border-t border-stone-100"></div>

            <!-- Date and See Details -->
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-stone-400">
                {{ formatDate(transaction.date) }}
              </p>

              <button
                type="button"
                class="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                @click="openTransactionDetails(transaction)"
              >
                See Details
                <ChevronRight :size="16" />
              </button>
            </div>
          </article>
        </template>
      </section>
    </div>
  </main>

  <!-- Transaction Details Modal -->
  <div
    v-if="selectedTransaction"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="closeTransactionDetails"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-details-title"
      class="w-full max-w-md rounded-3xl bg-[#FFF8ED] p-5 shadow-xl"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2 id="transaction-details-title" class="text-lg font-bold text-stone-900">
          Transaction Details
        </h2>

        <button
          type="button"
          aria-label="Close transaction details"
          class="rounded-full p-1 text-stone-600 hover:bg-stone-100"
          @click="closeTransactionDetails"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Amount -->
      <div class="mb-5 text-center">
        <p
          class="text-2xl font-bold"
          :class="selectedTransaction.type === 'INCOME' ? 'text-green-700' : 'text-red-600'"
        >
          {{ selectedTransaction.type === 'INCOME' ? '+' : '−'
          }}{{ formatCurrency(selectedTransaction.amount) }}
        </p>

        <p class="mt-2 text-sm font-semibold text-stone-800">
          {{ selectedTransaction.title }}
        </p>
      </div>

      <div class="space-y-4 border-t border-stone-200 pt-4">
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-stone-500">Category</span>
          <span class="text-right font-medium text-stone-800">
            {{ selectedTransaction.category }}
          </span>
        </div>

        <div class="flex justify-between gap-4 text-sm">
          <span class="text-stone-500">Type</span>
          <span class="font-medium text-stone-800">
            {{ selectedTransaction.type }}
          </span>
        </div>

        <div class="flex justify-between gap-4 text-sm">
          <span class="text-stone-500">Date</span>
          <span class="text-right font-medium text-stone-800">
            {{ formatDate(selectedTransaction.date) }}
          </span>
        </div>

        <div class="flex justify-between gap-4 text-sm">
          <span class="text-stone-500">Payment Method</span>
          <span class="text-right font-medium text-stone-800">
            {{ formatPaymentMethod(selectedTransaction.paymentMethod) }}
          </span>
        </div>

        <div class="flex justify-between gap-4 text-sm">
          <span class="text-stone-500">Description</span>
          <span class="max-w-[60%] text-right font-medium break-words text-stone-800">
            {{ selectedTransaction.description || 'No description' }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="mt-6 w-full rounded-full bg-[#FFBA08] py-3 text-sm font-semibold text-stone-900 hover:bg-amber-400"
        @click="closeTransactionDetails"
      >
        Close Details
      </button>
    </div>
  </div>

  <!-- Calendar Period Modal -->
  <div
    v-if="isCalendarOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="closeCalendar"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      class="w-full max-w-sm rounded-3xl bg-[#FFF8ED] p-5 shadow-xl"
    >
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 id="calendar-modal-title" class="text-lg font-bold text-stone-900">Select Period</h2>

          <p class="mt-1 text-xs text-stone-500">Choose a month and year to view transactions.</p>
        </div>

        <button
          type="button"
          aria-label="Close calendar"
          class="rounded-full p-2 text-stone-600 hover:bg-amber-100"
          @click="closeCalendar"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Month Selection -->
      <div class="relative mb-4">
        <label class="mb-2 block text-sm font-medium text-stone-700"> Month </label>

        <button
          type="button"
          aria-label="Select transaction month"
          :aria-expanded="activeDropdown === 'month'"
          class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 transition-colors hover:border-amber-400"
          @click="toggleDropdown('month')"
        >
          <span>{{ months[temporaryMonth - 1] }}</span>

          <ChevronDown
            :size="18"
            class="text-amber-600 transition-transform"
            :class="activeDropdown === 'month' ? 'rotate-180' : ''"
          />
        </button>

        <div
          v-if="activeDropdown === 'month'"
          class="absolute inset-x-0 top-full z-50 mt-2 max-h-46 space-y-1 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
        >
          <button
            v-for="month in monthOptions"
            :key="month.value"
            type="button"
            class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
            :class="
              temporaryMonth === month.value
                ? 'bg-amber-100 font-semibold text-amber-800'
                : 'truncate text-sm font-medium text-stone-700'
            "
            @click="selectMonth(month.value)"
          >
            {{ month.label }}
          </button>
        </div>
      </div>

      <!-- Year Selection -->
      <div class="relative mb-6">
        <label class="mb-2 block text-sm font-medium text-stone-700"> Year </label>

        <button
          type="button"
          aria-label="Select transaction year"
          :aria-expanded="activeDropdown === 'year'"
          class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 transition-colors hover:border-amber-400"
          @click="toggleDropdown('year')"
        >
          <span>{{ temporaryYear }}</span>

          <ChevronDown
            :size="18"
            class="text-amber-600 transition-transform"
            :class="activeDropdown === 'year' ? 'rotate-180' : ''"
          />
        </button>

        <div
          v-if="activeDropdown === 'year'"
          class="absolute inset-x-0 top-full z-50 mt-2 max-h-46 space-y-1 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
        >
          <button
            v-for="year in yearOptions"
            :key="year"
            type="button"
            class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
            :class="
              temporaryYear === year
                ? 'bg-amber-100 font-semibold text-amber-800'
                : 'truncate text-sm font-medium text-stone-700'
            "
            @click="selectYear(year)"
          >
            {{ year }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-full border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          @click="closeCalendar"
        >
          Cancel
        </button>

        <button
          type="button"
          class="rounded-full bg-[#FFBA08] py-3 text-sm font-semibold text-stone-900 hover:bg-amber-400"
          @click="applyPeriod"
        >
          Apply Period
        </button>
      </div>
    </div>
  </div>

  <!-- Advanced Filters Modal -->
  <div
    v-if="isAdvancedFilterOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="closeAdvancedFilters"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advanced-filters-title"
      class="relative w-full max-w-sm overflow-visible rounded-3xl bg-[#FFF8ED] p-5 shadow-xl"
    >
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <div>
          <h2 id="advanced-filters-title" class="text-lg font-bold text-stone-900">
            Advanced Filters
          </h2>
          <p class="mt-1 text-xs text-stone-500">Refine your transaction history.</p>
        </div>

        <button
          type="button"
          aria-label="Close advanced filters"
          class="rounded-full p-2 text-stone-600 hover:bg-amber-100"
          @click="closeAdvancedFilters"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Filter Fields -->
      <div class="space-y-5 overflow-visible">
        <!-- Category -->
        <div class="relative">
          <label class="mb-2 block text-sm font-medium text-stone-700"> Category </label>

          <button
            type="button"
            aria-label="Select transaction category"
            :aria-expanded="activeDropdown === 'category'"
            class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 transition-colors hover:border-amber-400"
            @click="toggleDropdown('category')"
          >
            <span class="truncate">{{ selectedCategoryLabel }}</span>

            <ChevronDown
              :size="18"
              class="shrink-0 text-amber-600 transition-transform"
              :class="activeDropdown === 'category' ? 'rotate-180' : ''"
            />
          </button>

          <div
            v-if="activeDropdown === 'category'"
            class="absolute inset-x-0 top-full z-50 mt-2 max-h-46 space-y-1 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
          >
            <button
              v-for="category in categoryOptions"
              :key="category.value"
              type="button"
              class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
              :class="
                temporaryAdvancedFilters.category === category.value
                  ? 'bg-amber-100 font-semibold text-amber-800'
                  : 'text-stone-700 hover:bg-amber-50'
              "
              @click="selectCategory(category.value)"
            >
              {{ category.label }}
            </button>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="relative">
          <label class="mb-2 block text-sm font-medium text-stone-700"> Payment Method </label>

          <button
            type="button"
            aria-label="Select payment method"
            :aria-expanded="activeDropdown === 'paymentMethod'"
            class="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 transition-colors hover:border-amber-400"
            @click="toggleDropdown('paymentMethod')"
          >
            <span class="truncate">{{ selectedPaymentMethodLabel }}</span>

            <ChevronDown
              :size="18"
              class="shrink-0 text-amber-600 transition-transform"
              :class="activeDropdown === 'paymentMethod' ? 'rotate-180' : ''"
            />
          </button>

          <div
            v-if="activeDropdown === 'paymentMethod'"
            class="absolute inset-x-0 top-full z-50 mt-2 max-h-46 space-y-1 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
          >
            <button
              v-for="method in paymentMethodOptions"
              :key="method.value"
              type="button"
              class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
              :class="
                temporaryAdvancedFilters.paymentMethod === method.value
                  ? 'bg-amber-100 font-semibold text-amber-800'
                  : 'text-stone-700 hover:bg-amber-50'
              "
              @click="selectPaymentMethod(method.value)"
            >
              {{ method.label }}
            </button>
          </div>
        </div>

        <!-- Amount Range -->
        <div>
          <p class="mb-2 text-sm font-medium text-stone-700">Amount Range (IDR)</p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="filter-min-amount" class="mb-1 block text-xs text-stone-500">
                Minimum
              </label>

              <input
                id="filter-min-amount"
                v-model="temporaryAdvancedFilters.minAmount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                class="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-700 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label for="filter-max-amount" class="mb-1 block text-xs text-stone-500">
                Maximum
              </label>

              <input
                id="filter-max-amount"
                v-model="temporaryAdvancedFilters.maxAmount"
                type="number"
                min="0"
                step="1"
                placeholder="No limit"
                class="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-700 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <p v-if="advancedFilterError" class="text-xs text-red-600">
          {{ advancedFilterError }}
        </p>
      </div>

      <!-- Actions -->
      <div class="mt-6 grid shrink-0 grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-full border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          @click="resetAdvancedFilters"
        >
          Reset Filters
        </button>

        <button
          type="button"
          class="rounded-full bg-[#FFBA08] py-3 text-sm font-semibold text-stone-900 hover:bg-amber-400"
          @click="applyAdvancedFilters"
        >
          Apply Filters
        </button>
      </div>
    </div>
  </div>
</template>
