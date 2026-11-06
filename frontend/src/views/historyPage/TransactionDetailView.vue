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

import { getTransactionById, updateTransaction } from '@/services/transactions/transactionService'
import type { ApiTransaction } from '@/services/transactions/transactionService'

const route = useRoute()
const router = useRouter()

const transaction = ref<ApiTransaction | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const isEditing = ref(false)
const isSaving = ref(false)
const editErrorMessage = ref('')

interface EditTransactionForm {
  title: string
  description: string
  amount: string
  type: 'INCOME' | 'EXPENSE'
  categoryId: number
  paymentMethod: string
  date: string
}

const editForm = ref<EditTransactionForm>({
  title: '',
  description: '',
  amount: '',
  type: 'EXPENSE',
  categoryId: 0,
  paymentMethod: '',
  date: '',
})

const validPaymentMethods = ['CASH', 'BANK_TRANSFER', 'E_WALLET', 'CARD'] as const

const paymentMethodOptions = [
  { label: 'CASH', value: validPaymentMethods[0] },
  { label: 'BANK TRANSFER', value: validPaymentMethods[1] },
  { label: 'E-WALLET', value: validPaymentMethods[2] },
  { label: 'CARD', value: validPaymentMethods[3] },
]
const transactionId = computed(() => Number(route.params.id))

const fetchTransaction = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (!Number.isSafeInteger(transactionId.value) || transactionId.value <= 0) {
      throw new Error('Invalid transaction ID')
    }

    transaction.value = await getTransactionById(transactionId.value)
  } catch (error) {
    console.error('Failed to load transaction:', error)

    transaction.value = null
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

const formatDateForInput = (date: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(date))

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? ''

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
}

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
  if (!transaction.value) return

  const current = transaction.value

  editForm.value = {
    title: current.title,
    description: current.description ?? '',
    amount: String(current.amount),
    type: current.type,
    categoryId: current.categoryId,
    paymentMethod: current.paymentMethod,
    date: formatDateForInput(current.date),
  }

  editErrorMessage.value = ''
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editErrorMessage.value = ''
}

const saveTransaction = async () => {
  if (!transaction.value || isSaving.value) return

  editErrorMessage.value = ''

  const form = editForm.value
  const amount = Number(form.amount)

  if (!form.title.trim()) {
    editErrorMessage.value = 'Transaction title is required.'
    return
  }

  if (form.title.trim().length > 100) {
    editErrorMessage.value = 'Transaction title cannot exceed 100 characters.'
    return
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    editErrorMessage.value = 'Amount must be greater than zero.'
    return
  }

  if (Math.abs(amount * 100 - Math.round(amount * 100)) >= 1e-8) {
    editErrorMessage.value = 'Amount cannot have more than 2 decimal places.'
    return
  }

  if (form.categoryId <= 0) {
    editErrorMessage.value = 'Please select a category.'
    return
  }

  if (form.description.trim().length > 500) {
    editErrorMessage.value = 'Description cannot exceed 500 characters.'
    return
  }

  const paymentMethod = validPaymentMethods.find((method) => method === form.paymentMethod)

  if (!paymentMethod) {
    editErrorMessage.value = 'Please select a valid payment method.'
    return
  }

  isSaving.value = true

  try {
    const updatedTransaction = await updateTransaction(transaction.value.id, {
      title: form.title.trim(),
      amount,
      type: form.type,
      categoryId: form.categoryId,
      paymentMethod,
      description: form.description.trim(),
      date: `${form.date}T00:00:00+07:00`,
    })

    transaction.value = updatedTransaction
    isEditing.value = false
  } catch (error) {
    console.error('Failed to update transaction:', error)

    editErrorMessage.value = 'Unable to update transaction. Please try again.'
  } finally {
    isSaving.value = false
  }
}

const handleDelete = () => {
  console.log('Delete transaction:', transaction.value?.id)
}
</script>

<template>
  <main
    class="flex h-dvh w-full flex-col overflow-hidden bg-[#FBF3E6] bg-cover bg-center bg-no-repeat px-5 pt-9 pb-4"
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
            class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-lg"
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

        <!-- View / Edit Mode Switcher -->
        <div class="grid grid-cols-2 gap-3 mt-8">
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
            :class="
              !isEditing ? 'bg-[#FFBA08] text-stone-900 shadow-sm' : 'bg-white/40 text-stone-500'
            "
            :disabled="isSaving"
            @click="cancelEdit"
          >
            <ReceiptText :size="18" />
            View Mode
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
            :class="
              isEditing ? 'bg-[#FFBA08] text-stone-900 shadow-sm' : 'bg-white/40 text-stone-500'
            "
            :disabled="isSaving"
            @click="!isEditing && handleEdit()"
          >
            <Pencil :size="18" />
            Edit Mode
          </button>
        </div>
      </header>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-6">
        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center items-center h-full">
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
          <!-- Edit Transaction Mode -->
          <template v-if="isEditing">
            <form id="edit-transaction-form" class="space-y-4" @submit.prevent="saveTransaction">
              <!-- Transaction Summary -->
              <section
                class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
              >
                <h2 class="mb-5 text-base font-bold text-stone-900">Transaction Summary</h2>

                <!-- Transaction Title -->
                <div class="mb-4">
                  <label for="edit-title" class="mb-2 block text-sm font-medium text-stone-600">
                    Transaction Title
                  </label>

                  <input
                    id="edit-title"
                    v-model="editForm.title"
                    type="text"
                    maxlength="100"
                    required
                    placeholder="Enter transaction title"
                    class="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-amber-400"
                  />
                </div>

                <!-- Transaction Amount -->
                <div>
                  <label for="edit-amount" class="mb-2 block text-sm font-medium text-stone-600">
                    Amount (IDR)
                  </label>

                  <input
                    id="edit-amount"
                    v-model="editForm.amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Enter transaction amount"
                    class="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-amber-400"
                  />
                </div>
              </section>

              <!-- Transaction Information -->
              <section
                class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
              >
                <h2 class="mb-5 text-base font-bold text-stone-900">Transaction Information</h2>

                <!-- Transaction Type -->
                <div class="mb-4">
                  <label class="mb-2 block text-sm font-medium text-stone-600">
                    Transaction Type
                  </label>

                  <div class="grid grid-cols-2 gap-3">
                    <div
                      class="rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                      :class="
                        editForm.type === 'INCOME'
                          ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                          : 'bg-white/60 text-stone-400'
                      "
                    >
                      Income
                    </div>

                    <div
                      class="rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                      :class="
                        editForm.type === 'EXPENSE'
                          ? 'bg-red-100 text-red-600 ring-2 ring-red-400'
                          : 'bg-white/60 text-stone-400'
                      "
                    >
                      Expense
                    </div>
                  </div>

                  <p class="mt-2 text-xs text-stone-500">Transaction type cannot be changed yet.</p>
                </div>

                <!-- Category -->
                <div class="mb-4">
                  <label class="mb-2 block text-sm font-medium text-stone-600"> Category </label>

                  <div
                    class="flex items-center justify-between rounded-2xl border border-stone-200 bg-white/70 px-4 py-3"
                  >
                    <span class="text-sm font-semibold text-stone-800">
                      {{ transaction.category.name }}
                    </span>

                    <LayoutGrid :size="18" class="text-stone-400" />
                  </div>

                  <p class="mt-2 text-xs text-stone-500">
                    Category editing will be available after connecting the category API.
                  </p>
                </div>

                <!-- Payment Method -->
                <div class="mb-4">
                  <label
                    for="edit-payment-method"
                    class="mb-2 block text-sm font-medium text-stone-600"
                  >
                    Payment Method
                  </label>

                  <select
                    id="edit-payment-method"
                    v-model="editForm.paymentMethod"
                    required
                    class="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-amber-400"
                  >
                    <option
                      v-for="method in paymentMethodOptions"
                      :key="method.value"
                      :value="method.value"
                    >
                      {{ method.label }}
                    </option>
                  </select>
                </div>

                <!-- Transaction Date -->
                <div>
                  <label for="edit-date" class="mb-2 block text-sm font-medium text-stone-600">
                    Transaction Date
                  </label>

                  <input
                    id="edit-date"
                    v-model="editForm.date"
                    type="date"
                    required
                    class="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-amber-400"
                  />
                </div>
              </section>

              <!-- Description -->
              <section
                class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
              >
                <h2 class="mb-4 text-base font-bold text-stone-900">Description</h2>

                <textarea
                  id="edit-description"
                  v-model="editForm.description"
                  rows="4"
                  maxlength="500"
                  placeholder="Add transaction description..."
                  class="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-amber-400"
                ></textarea>
              </section>

              <!-- Transaction Screenshot -->
              <section
                class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
              >
                <h2 class="mb-4 text-base font-bold text-stone-900">Transaction Screenshot</h2>

                <div
                  class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-7 text-center"
                >
                  <FileImage :size="28" class="text-stone-400" />

                  <p class="mt-3 text-sm font-medium text-stone-600">
                    Receipt editing is not available yet
                  </p>

                  <p class="mt-1 text-xs text-stone-400">
                    Existing transaction receipts will remain unchanged.
                  </p>
                </div>
              </section>

              <!-- Error Message -->
              <p
                v-if="editErrorMessage"
                role="alert"
                class="rounded-2xl bg-red-100 p-4 text-sm text-red-600"
              >
                {{ editErrorMessage }}
              </p>

              <!-- Action Buttons -->
              <div class="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  :disabled="isSaving"
                  class="rounded-2xl border border-stone-200 bg-white/80 px-4 py-4 text-sm font-bold text-stone-700 disabled:opacity-50"
                  @click="cancelEdit"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  :disabled="isSaving"
                  class="rounded-2xl bg-[#FFBA08] px-4 py-4 text-sm font-bold text-stone-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </template>

          <template v-else>
            <!-- Transaction Summary -->
            <section
              class="rounded-3xl border border-white/80 bg-white/40 px-5 py-7 text-center shadow-sm backdrop-blur-md"
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
              class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
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
              class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
            >
              <h2 class="mb-3 text-base font-bold text-stone-900">Description</h2>

              <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">
                {{ transaction.description || 'No description provided.' }}
              </p>
            </section>

            <!-- Transaction Screenshot -->
            <section
              class="rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
            >
              <h2 class="mb-4 text-base font-bold text-stone-900">Transaction Screenshot</h2>

              <div
                v-if="receiptImageUrl"
                class="flex items-center gap-3 rounded-2xl bg-white p-3 backdrop-blur-none"
              >
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
                class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-7 text-center"
              >
                <FileImage :size="28" class="text-stone-400" />

                <p class="mt-3 text-sm font-medium text-stone-600">
                  No transaction screenshot available
                </p>

                <p class="mt-1 text-xs text-stone-400">Attached receipts will appear here.</p>
              </div>
            </section>

            <!-- Delete Transaction Button -->
            <div class="pt-2">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-200"
                @click="handleDelete"
              >
                <Trash2 :size="18" />
                Delete Transaction
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </main>
</template>
