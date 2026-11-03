<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTransactionStore } from '@/stores/transactions'

import {
  BriefcaseBusiness,
  Gift,
  HeartPulse,
  Utensils,
  CarFront,
  ShoppingBag,
  ChevronRight,
} from 'lucide-vue-next'

// Access the transaction store
const transactionStore = useTransactionStore()

const { monthlyTransactions, isLoading, errorMessage } =
  storeToRefs(transactionStore)

const recentTransactions = computed(() => {
  return [...monthlyTransactions.value]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    )
    .slice(0, 2)
})

// Format currency
const formatCurrency = (amount: string) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount))

// Format transaction date
const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))

// Choose icon based on category
const getTransactionIcon = (category: string) => {
  switch (category) {
    case 'Salary':
      return BriefcaseBusiness
    case 'Bonus':
      return Gift
    case 'Health':
      return HeartPulse
    case 'Food & Drinks':
      return Utensils
    case 'Transportation':
      return CarFront
    case 'Fashion':
      return ShoppingBag
    default:
      return BriefcaseBusiness
  }
}

// Choose icon background based on category
const getIconStyle = (category: string) => {
  switch (category) {
    case 'Salary':
      return {
        backgroundColor: '#DDF4E5',
        color: '#16A36B',
      }
    case 'Bonus':
      return {
        backgroundColor: '#FFF0CE',
        color: '#F2A900',
      }
    case 'Health':
      return {
        backgroundColor: '#FFE1DD',
        color: '#EF4444',
      }
    case 'Food & Drinks':
      return {
        backgroundColor: '#FFEAD6',
        color: '#FF872A',
      }
    case 'Transportation':
      return {
        backgroundColor: '#FFE6D5',
        color: '#E8792D',
      }
    case 'Fashion':
      return {
        backgroundColor: '#F1E5FF',
        color: '#9333EA',
      }
    default:
      return {
        backgroundColor: '#F3E9D7',
        color: '#8C7D65',
      }
  }
}
</script>

<template>
  <section
    class="w-full rounded-3xl border border-white/40 bg-white/40 p-4 shadow-lg shadow-amber-900/5 backdrop-blur-md h-[25svh]"
  >
    <!-- Header -->
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-bold text-stone-900">Recent Transactions</h2>

      <RouterLink
        to="/transactions"
        class="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
      >
        See all
        <ChevronRight :size="16" />
      </RouterLink>
    </div>

    <!-- Loading State -->
    <p v-if="isLoading" class="flex justify-center items-center h-full pb-17 text-center text-sm text-stone-500">Loading transactions...</p>

    <!-- Error State -->
    <p v-else-if="errorMessage" role="alert" class="py-8 text-center text-sm text-red-500">
      {{ errorMessage }}
    </p>

    <!-- Empty State -->
    <p v-else-if="recentTransactions.length === 0" class="py-8 text-center text-sm text-stone-500">
      No transactions yet.
    </p>

    <!-- Transaction List -->
    <div v-else class="divide-y divide-stone-200/60">
      <div
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
      >
        <!-- Category Icon -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full my-2"
          :style="getIconStyle(transaction.category.name)"
        >
          <component
            :is="getTransactionIcon(transaction.category.name)"
            :size="21"
            :stroke-width="1.8"
          />
        </div>

        <!-- Description -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-stone-900">
            {{ transaction.title || transaction.category.name }}
          </p>

          <p class="truncate text-xs text-stone-500">
            {{ transaction.category.name }} ·
            {{ transaction.type === 'INCOME' ? 'Income' : 'Expense' }}
          </p>
        </div>

        <!-- Amount and Date -->
        <div class="shrink-0 text-right">
          <p
            class="text-sm font-semibold"
            :class="transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'"
          >
            {{ transaction.type === 'INCOME' ? '+' : '−' }}{{ formatCurrency(transaction.amount) }}
          </p>

          <p class="mt-1 text-xs text-stone-400">
            {{ formatDate(transaction.date) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
