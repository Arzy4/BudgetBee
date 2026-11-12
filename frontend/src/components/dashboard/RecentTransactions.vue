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

const { monthlyTransactions, isLoading, errorMessage } = storeToRefs(transactionStore)

const recentTransactions = computed(() => {
  return [...monthlyTransactions.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[22px] border border-white/40 bg-white/40 px-3 pt-6 shadow-lg shadow-amber-900/5 backdrop-blur-md sm:px-4"
  >
    <!-- Header -->
    <div class="mb-2 flex shrink-0 items-center justify-between">
      <h2 class="text-[14px] phone:text-[16px] font-bold text-stone-900">Recent Transactions</h2>

      <RouterLink
        to="/histories"
        class="flex items-center gap-1 text-[11px] phone:text-[12px] font-semibold text-amber-600"
      >
        See all
        <ChevronRight :size="14" />
      </RouterLink>
    </div>

    <!-- Loading State -->
    <p v-if="isLoading" class="h-full flex justify-center items-center pb-12 text-[14px] phone:text-[16px] text-stone-500">Loading transactions...</p>

    <p v-else-if="errorMessage" role="alert" class="h-full flex justify-center items-center pb-12 text-[14px] phone:text-[16px] text-red-500">
      {{ errorMessage }}
    </p>

    <p v-else-if="recentTransactions.length === 0" class="h-full flex justify-center items-center pb-12 text-[14px] phone:text-[16px] text-stone-500">
      No transactions yet.
    </p>

    <!-- Transaction List -->
    <div v-else class="min-h-0 flex-1 overflow-y-auto divide-y divide-stone-200/60">
      <div
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        class="flex min-w-0 items-center gap-2 py-4"
      >
        <!-- Category Icon -->
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          :style="getIconStyle(transaction.category.name)"
        >
          <component :is="getTransactionIcon(transaction.category.name)" :size="17" />
        </div>

        <!-- Title -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-[11px] phone:text-[12px] font-semibold text-stone-900">
            {{ transaction.title}}
          </p>
          <p class="truncate text-[10px] phone:text-[11px] text-stone-500">
            {{ transaction.category.name }}
          </p>
        </div>

        <!-- Amount -->
        <div class="shrink-0 text-right">
          <p
            class="text-[11px] phone:text-[12px] font-semibold"
            :class="transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'"
          >
            {{ transaction.type === 'INCOME' ? '+' : '−' }}{{ formatCurrency(transaction.amount) }}
          </p>
          <p class="text-[10px] phone:text-[11px] text-stone-400">
            {{ formatDate(transaction.date) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
