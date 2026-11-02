<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  History,
  Search,
  CalendarDays,
  SlidersHorizontal,
  UtensilsCrossed,
  Wallet,
  CarFront,
  ChevronRight,
  X,
} from 'lucide-vue-next'
import BottomNavbar from '@/components/layout/bottomNavbar.vue'

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
}

const transactions = ref<HistoryTransaction[]>([
  {
    id: 1,
    title: 'Lunch',
    category: 'Food & Drinks',
    amount: 45000,
    type: 'EXPENSE',
    date: '2026-11-02',
    paymentMethod: 'CASH',
    description: 'Lunch at a restaurant',
  },
  {
    id: 2,
    title: 'Salary',
    category: 'Income',
    amount: 5000000,
    type: 'INCOME',
    date: '2026-11-02',
    paymentMethod: 'BANK_TRANSFER',
    description: 'Monthly salary',
  },
  {
    id: 3,
    title: 'Transportation',
    category: 'Transport',
    amount: 25000,
    type: 'EXPENSE',
    date: '2026-11-01',
    paymentMethod: 'E_WALLET',
    description: 'Ride to the office',
  },
])

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

  return transactions.value
    .filter((transaction) => {
      const matchesType =
        activeFilter.value === 'ALL' ||
        transaction.type === activeFilter.value

      const matchesSearch =
        !query ||
        transaction.title.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query)

      return matchesType && matchesSearch
    })
    .sort((a, b) => b.date.localeCompare(a.date))
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatPaymentMethod = (method: string) =>
  method.replaceAll('_', ' ')

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
  selectedTransaction.value = transaction
}

const closeTransactionDetails = () => {
  selectedTransaction.value = null
}
</script>

<template>
  <main
    class="relative min-h-screen w-full bg-[#FBF3E6] bg-cover bg-center bg-no-repeat px-5 py-8 pb-28"
    style="background-image: url('/images/dashboard-bg.png')"
  >
    <div class="mx-auto max-w-lg space-y-5">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-stone-800">
            Transaction History
          </h1>
          <p class="mt-1 text-sm text-stone-500">
            Track every transaction
          </p>
        </div>

        <div class="rounded-2xl bg-amber-100 p-3">
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
              ? 'bg-[#FFBA08] text-stone-900'
              : 'bg-white text-stone-600 hover:bg-amber-50'
          "
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Month and Filter Controls -->
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-stone-700">
          November 2026
        </h2>

        <div class="flex items-center gap-2">
          <button
            type="button"
            aria-label="Choose transaction dates"
            class="rounded-xl bg-amber-100 p-2 text-amber-700"
          >
            <CalendarDays :size="20" />
          </button>

          <button
            type="button"
            aria-label="Advanced transaction filters"
            class="rounded-xl bg-amber-100 p-2 text-amber-700"
          >
            <SlidersHorizontal :size="20" />
          </button>
        </div>
      </div>

      <!-- Transaction List -->
      <section class="space-y-3">
        <div
          v-if="filteredTransactions.length === 0"
          class="rounded-2xl bg-white p-8 text-center"
        >
          <p class="text-sm text-stone-500">
            No transactions found.
          </p>
        </div>

        <article
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          class="rounded-2xl bg-white p-4 shadow-sm"
        >
          <!-- Transaction Information -->
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              :class="
                transaction.type === 'INCOME'
                  ? 'bg-green-100'
                  : 'bg-amber-100'
              "
            >
              <component
                :is="getCategoryIcon(transaction.category)"
                :size="21"
                :class="
                  transaction.type === 'INCOME'
                    ? 'text-green-700'
                    : 'text-amber-600'
                "
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
              :class="
                transaction.type === 'INCOME'
                  ? 'text-green-700'
                  : 'text-red-600'
              "
            >
              {{ transaction.type === 'INCOME' ? '+' : '−' }}{{ formatCurrency(transaction.amount) }}
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
        <h2
          id="transaction-details-title"
          class="text-lg font-bold text-stone-900"
        >
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
          :class="
            selectedTransaction.type === 'INCOME'
              ? 'text-green-700'
              : 'text-red-600'
          "
        >
          {{ selectedTransaction.type === 'INCOME' ? '+' : '−' }}{{ formatCurrency(selectedTransaction.amount) }}
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

  <BottomNavbar />
</template>
