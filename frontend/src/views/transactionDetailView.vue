<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ReceiptText,
  UtensilsCrossed,
  Wallet,
  CarFront,
  CalendarDays,
  CreditCard,
  LayoutGrid,
  Hash,
  FileImage,
  ExternalLink,
  Pencil,
  Trash2,
  X,
} from 'lucide-vue-next'

import { getTransactions } from '@/services/transactions/transactionService'
import type { ApiTransaction } from '@/services/transactions/transactionService'

const route = useRoute()
const router = useRouter()

const transaction = ref<ApiTransaction | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const transactionId = computed(() => Number(route.params.id))

const fetchTransaction = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (!Number.isInteger(transactionId.value) || transactionId.value <= 0) {
      throw new Error('Invalid transaction ID')
    }

    const transactions = await getTransactions()

    transaction.value = transactions.find((item) => item.id === transactionId.value) ?? null

    if (!transaction.value) {
      errorMessage.value = 'Transaction not found.'
    }
  } catch (error) {
    console.error('Failed to load transaction:', error)
    errorMessage.value = 'Unable to load transaction details.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTransaction)

const isIncome = computed(() => transaction.value?.type === 'INCOME')

const formatCurrency = (amount: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount))

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

const goBack = () => {
  router.push('/histories')
}

// Receipt image is not yet available from the current API.
// receiptKey will later be resolved to an accessible image URL.
const receiptImageUrl = ref<string | null>(null)

// Edit and delete actions will be connected in the next step.
const handleEdit = () => {
  console.log('Edit transaction:', transaction.value?.id)
}

const handleDelete = () => {
  console.log('Delete transaction:', transaction.value?.id)
}
</script>

<template>
  <main
    class="flex h-dvh w-full flex-col overflow-hidden bg-[#FBF3E6] bg-cover bg-center bg-no-repeat px-4 pt-4 pb-4"
    style="background-image: url('/images/dashboard-bg.png')"
  >
    <div class="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
      <!-- Fixed Header -->
      <header class="mb-4 shrink-0">
        <!-- Navigation Icons -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back to transaction history"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm"
            @click="goBack"
          >
            <ArrowLeft :size="23" />
          </button>

          <div class="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <ReceiptText :size="21" />
          </div>
        </div>

        <!-- Page Title -->
        <div class="mt-4 text-center">
          <h1 class="text-xl font-bold text-stone-900">Transaction Details</h1>

          <p class="mt-1 text-xs text-stone-500">View and manage your transaction</p>
        </div>
      </header>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-6">
        <!-- Loading -->
        <div v-if="isLoading" class="rounded-3xl bg-white/70 p-8 text-center shadow-sm">
          <p class="text-sm text-stone-500">Loading transaction details...</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorMessage" class="rounded-3xl bg-white/70 p-8 text-center shadow-sm">
          <p class="text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <button
            type="button"
            class="mt-4 rounded-full bg-[#FFBA08] px-6 py-3 text-sm font-semibold"
            @click="fetchTransaction"
          >
            Try Again
          </button>
        </div>

        <template v-else-if="transaction">
          <!-- Transaction Summary -->
          <section
            class="rounded-3xl border border-white/80 bg-white/70 px-5 py-7 text-center shadow-sm backdrop-blur-md"
          >
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              :class="isIncome ? 'bg-green-100' : 'bg-amber-100'"
            >
              <component
                :is="getCategoryIcon(transaction.category.name)"
                :size="29"
                :class="isIncome ? 'text-green-700' : 'text-amber-600'"
              />
            </div>

            <h2 class="text-xl font-bold text-stone-900">
              {{ transaction.title }}
            </h2>

            <p class="mt-1 text-sm text-stone-500">
              {{ isIncome ? 'Income Transaction' : 'Expense Transaction' }}
            </p>

            <p
              class="mt-5 text-3xl font-extrabold"
              :class="isIncome ? 'text-green-700' : 'text-red-600'"
            >
              {{ isIncome ? '+' : '−' }}{{ formatCurrency(transaction.amount) }}
            </p>

            <span
              class="mt-4 inline-flex rounded-full px-5 py-1.5 text-xs font-bold"
              :class="isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
            >
              {{ transaction.type }}
            </span>
          </section>

          <!-- Transaction Information -->
          <section
            class="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-md"
          >
            <h2 class="mb-3 text-base font-bold text-stone-900">Transaction Information</h2>

            <div class="divide-y divide-stone-200/70">
              <div class="flex items-center justify-between gap-3 py-4">
                <div class="flex items-center gap-3 text-stone-500">
                  <LayoutGrid :size="19" />
                  <span class="text-sm">Category</span>
                </div>

                <span class="text-right text-sm font-semibold text-stone-800">
                  {{ transaction.category.name }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-3 py-4">
                <div class="flex items-center gap-3 text-stone-500">
                  <CreditCard :size="19" />
                  <span class="text-sm">Payment Method</span>
                </div>

                <span class="text-right text-sm font-semibold text-stone-800">
                  {{ formatPaymentMethod(transaction.paymentMethod) }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-3 py-4">
                <div class="flex items-center gap-3 text-stone-500">
                  <CalendarDays :size="19" />
                  <span class="text-sm">Transaction Date</span>
                </div>

                <span class="text-right text-sm font-semibold text-stone-800">
                  {{ formatDate(transaction.date) }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-3 py-4">
                <div class="flex items-center gap-3 text-stone-500">
                  <Hash :size="19" />
                  <span class="text-sm">Transaction ID</span>
                </div>

                <span class="text-sm font-semibold text-stone-800"> #{{ transaction.id }} </span>
              </div>
            </div>
          </section>

          <!-- Description -->
          <section
            class="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-md"
          >
            <h2 class="mb-3 text-base font-bold text-stone-900">Description</h2>

            <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">
              {{ transaction.description || 'No description provided.' }}
            </p>
          </section>

          <!-- Transaction Screenshot -->
          <section
            class="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-md"
          >
            <h2 class="mb-4 text-base font-bold text-stone-900">Transaction Screenshot</h2>

            <div v-if="receiptImageUrl" class="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
              <img
                :src="receiptImageUrl"
                alt="Transaction receipt screenshot"
                class="h-20 w-24 shrink-0 rounded-xl object-cover"
              />

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-stone-800">Transaction receipt</p>
                <p class="mt-1 text-xs text-stone-500">Attached image</p>
              </div>

              <a
                :href="receiptImageUrl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View transaction screenshot"
                class="rounded-xl bg-amber-100 p-3 text-amber-700"
              >
                <ExternalLink :size="19" />
              </a>
            </div>

            <div
              v-else
              class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/40 px-4 py-7 text-center"
            >
              <FileImage :size="28" class="text-stone-400" />

              <p class="mt-3 text-sm font-medium text-stone-600">
                No transaction screenshot available
              </p>

              <p class="mt-1 text-xs text-stone-400">Attached receipts will appear here.</p>
            </div>
          </section>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-2xl bg-[#FFBA08] px-3 py-4 text-xs font-bold text-stone-900 transition-colors hover:bg-amber-400"
              @click="handleEdit"
            >
              <Pencil :size="18" />
              Edit Transaction
            </button>

            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-2xl bg-red-100 px-3 py-4 text-xs font-bold text-red-600 transition-colors hover:bg-red-200"
              @click="handleDelete"
            >
              <Trash2 :size="18" />
              Delete Transaction
            </button>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
