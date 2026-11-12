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
  ChevronDown,
  Check,
} from 'lucide-vue-next'

import {
  getTransactionById,
  updateTransaction,
  updateTransactionReceipt,
  deleteTransaction,
} from '@/services/transactions/transactionService'
import type { ApiTransaction } from '@/services/transactions/transactionService'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const transaction = ref<ApiTransaction | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const isEditing = ref(false)
const isSaving = ref(false)
const editErrorMessage = ref('')

const isPaymentDropdownOpen = ref(false)
const isCalendarOpen = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)
const receiptError = ref('')
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024

const isDeleting = ref(false)
const deleteErrorMessage = ref('')
const showDeleteModal = ref(false)

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

const ALLOWED_RECEIPT_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

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

// receiptKey will later be resolved to an accessible image URL.
const receiptImageUrl = computed(() => transaction.value?.receiptUrl ?? null)

const hasTransactionChanges = computed(() => {
  if (!transaction.value) return false

  const original = transaction.value
  const edited = editForm.value

  return (
    edited.title.trim() !== (original.title ?? '').trim() ||
    Number(edited.amount) !== Number(original.amount) ||
    edited.type !== original.type ||
    edited.categoryId !== original.categoryId ||
    edited.paymentMethod !== original.paymentMethod ||
    edited.description.trim() !== (original.description ?? '').trim() ||
    edited.date !== formatDateForInput(original.date) ||
    receiptFile.value !== null
  )
})

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

  const selectedDate = new Date(`${editForm.value.date}T12:00:00`)

  calendarYear.value = selectedDate.getFullYear()
  calendarMonth.value = selectedDate.getMonth()

  isCalendarOpen.value = false
  isPaymentDropdownOpen.value = false

  editErrorMessage.value = ''
  isEditing.value = true
  isPaymentDropdownOpen.value = false
}

const cancelEdit = () => {
  isEditing.value = false
  editErrorMessage.value = ''
  isPaymentDropdownOpen.value = false
  isCalendarOpen.value = false
  removeSelectedReceipt()
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
    // Update transaction information
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

    // Upload receipt if a new image was selected
    if (receiptFile.value) {
      const updatedWithReceipt = await updateTransactionReceipt(
        updatedTransaction.id,
        receiptFile.value,
      )

      transaction.value = updatedWithReceipt
    }

    // Clear temporary image preview
    removeSelectedReceipt()

    // Exit Edit Mode
    isEditing.value = false
    isPaymentDropdownOpen.value = false
    isCalendarOpen.value = false
  } catch (error) {
    console.error('Failed to save transaction:', error)

    if (axios.isAxiosError(error)) {
      console.error('Backend error response:', error.response?.data)
      console.error('HTTP status:', error.response?.status)
    }

    editErrorMessage.value = 'Unable to save all transaction changes. Please try again.'
  } finally {
    // Always reset loading state
    isSaving.value = false
  }
}

const selectedPayment = computed(() =>
  paymentMethodOptions.find((option) => option.value === editForm.value.paymentMethod),
)

function selectPaymentMethod(value: string) {
  editForm.value.paymentMethod = value
  isPaymentDropdownOpen.value = false
}

function togglePaymentDropdown() {
  isPaymentDropdownOpen.value = !isPaymentDropdownOpen.value
  isCalendarOpen.value = false
}

const calendarTitle = computed(() =>
  new Date(calendarYear.value, calendarMonth.value, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1).getDay()

  const daysInMonth = new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate()

  return [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ] as (number | null)[]
})

const formattedEditDate = computed(() => {
  if (!editForm.value.date) return 'Select date'

  const date = new Date(`${editForm.value.date}T12:00:00`)

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

function changeCalendarMonth(offset: number) {
  const date = new Date(calendarYear.value, calendarMonth.value + offset, 1)

  calendarYear.value = date.getFullYear()
  calendarMonth.value = date.getMonth()
}

function selectCalendarDay(day: number) {
  editForm.value.date = [
    calendarYear.value,
    String(calendarMonth.value + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')

  isCalendarOpen.value = false
}

function toggleCalendar() {
  isCalendarOpen.value = !isCalendarOpen.value
  isPaymentDropdownOpen.value = false
}

function handleReceiptUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  receiptError.value = ''

  if (!file) return

  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    receiptError.value = 'Only JPG, PNG, and WebP images are allowed'
    input.value = ''
    return
  }

  if (file.size > MAX_RECEIPT_SIZE) {
    receiptError.value = 'Receipt image cannot exceed 5 MB'
    input.value = ''
    return
  }

  if (receiptPreview.value) {
    URL.revokeObjectURL(receiptPreview.value)
  }

  receiptFile.value = file
  receiptPreview.value = URL.createObjectURL(file)

  input.value = ''
}

function removeSelectedReceipt() {
  if (receiptPreview.value) {
    URL.revokeObjectURL(receiptPreview.value)
  }

  receiptFile.value = null
  receiptPreview.value = null
  receiptError.value = ''
}

const handleDelete = () => {
  if (!transaction.value || isDeleting.value) return

  deleteErrorMessage.value = ''
  showDeleteModal.value = true
}

const cancelDelete = () => {
  if (isDeleting.value) return

  showDeleteModal.value = false
}

const confirmDelete = async () => {
  if (!transaction.value || isDeleting.value) return

  isDeleting.value = true
  deleteErrorMessage.value = ''

  try {
    const id = transaction.value.id

    await deleteTransaction(id)

    console.log('Transaction deleted successfully:', id)

    showDeleteModal.value = false

    await router.replace('/histories')
  } catch (error) {
    console.error('Failed to delete transaction:', error)

    deleteErrorMessage.value = 'Unable to delete transaction. Please try again.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <main class="flex h-svh flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-5 py-9 pb-10">
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
                class="relative z-20 rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
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

                <!-- Custom Payment Method Dropdown -->
                <div class="relative z-30 mb-4">
                  <label
                    id="edit-payment-method-label"
                    class="mb-2 block text-sm font-medium text-stone-600"
                  >
                    Payment Method
                  </label>

                  <div class="relative">
                    <!-- Dropdown Trigger -->
                    <button
                      type="button"
                      aria-labelledby="edit-payment-method-label"
                      aria-haspopup="listbox"
                      :aria-expanded="isPaymentDropdownOpen"
                      class="flex w-full items-center justify-between rounded-2xl border bg-[#FFF8ED] px-3 py-3.5 text-left text-sm font-medium text-stone-800 transition-colors"
                      :class="
                        isPaymentDropdownOpen
                          ? 'border-amber-500 ring-1 ring-amber-400'
                          : 'border-stone-200'
                      "
                      @click="togglePaymentDropdown"
                    >
                      <span>
                        {{ selectedPayment?.label ?? 'Select payment method' }}
                      </span>

                      <ChevronDown
                        :size="18"
                        class="text-stone-500 transition-transform duration-200"
                        :class="{ 'rotate-180': isPaymentDropdownOpen }"
                      />
                    </button>

                    <!-- Dropdown Options -->
                    <div
                      v-if="isPaymentDropdownOpen"
                      role="listbox"
                      aria-labelledby="edit-payment-method-label"
                      class="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
                    >
                      <button
                        v-for="method in paymentMethodOptions"
                        :key="method.value"
                        type="button"
                        role="option"
                        :aria-selected="editForm.paymentMethod === method.value"
                        class="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-stone-700 transition-colors hover:bg-amber-50"
                        :class="
                          editForm.paymentMethod === method.value ? 'bg-amber-100 font-medium' : ''
                        "
                        @click="selectPaymentMethod(method.value)"
                      >
                        <span>{{ method.label }}</span>

                        <Check
                          v-if="editForm.paymentMethod === method.value"
                          :size="17"
                          class="text-amber-600"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Custom Transaction Date Calendar -->
                <div class="relative z-10">
                  <div>
                    <label
                      id="edit-date-label"
                      class="mb-2 block text-sm font-medium text-stone-600"
                    >
                      Transaction Date
                    </label>

                    <!-- Calendar Trigger -->
                    <button
                      type="button"
                      aria-labelledby="edit-date-label"
                      :aria-expanded="isCalendarOpen"
                      class="flex w-full items-center justify-between rounded-2xl border bg-[#FFF8ED] px-3 py-3.5 text-left text-sm font-medium text-stone-800 transition-colors"
                      :class="
                        isCalendarOpen
                          ? 'border-amber-500 ring-1 ring-amber-400'
                          : 'border-stone-200'
                      "
                      @click="toggleCalendar"
                    >
                      <span>{{ formattedEditDate }}</span>

                      <ChevronDown
                        :size="18"
                        class="text-stone-500 transition-transform duration-200"
                        :class="{ 'rotate-180': isCalendarOpen }"
                      />
                    </button>

                    <!-- Calendar Popup -->
                    <div
                      v-if="isCalendarOpen"
                      class="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-amber-200 bg-[#FFF8ED] p-3 shadow-xl"
                    >
                      <!-- Month Navigation -->
                      <div class="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          aria-label="Previous month"
                          class="rounded-lg p-2 hover:bg-amber-100"
                          @click="changeCalendarMonth(-1)"
                        >
                          <ChevronDown :size="18" class="rotate-90" />
                        </button>

                        <span class="text-sm font-semibold text-stone-800">
                          {{ calendarTitle }}
                        </span>

                        <button
                          type="button"
                          aria-label="Next month"
                          class="rounded-lg p-2 hover:bg-amber-100"
                          @click="changeCalendarMonth(1)"
                        >
                          <ChevronDown :size="18" class="-rotate-90" />
                        </button>
                      </div>

                      <!-- Calendar Grid -->
                      <div class="grid grid-cols-7 gap-1 text-center">
                        <span
                          v-for="day in weekdays"
                          :key="day"
                          class="py-1 text-xs font-semibold text-stone-500"
                        >
                          {{ day }}
                        </span>

                        <template v-for="(day, index) in calendarDays" :key="index">
                          <span v-if="day === null"></span>

                          <button
                            v-else
                            type="button"
                            class="aspect-square rounded-full text-xs transition hover:bg-amber-100"
                            :class="
                              editForm.date ===
                              [
                                calendarYear,
                                String(calendarMonth + 1).padStart(2, '0'),
                                String(day).padStart(2, '0'),
                              ].join('-')
                                ? 'bg-amber-400 font-bold text-stone-900'
                                : 'text-stone-700'
                            "
                            @click="selectCalendarDay(day)"
                          >
                            {{ day }}
                          </button>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Description -->
              <section
                class="relative z-0 rounded-3xl border border-white/80 bg-white/40 p-5 shadow-sm backdrop-blur-md"
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

                <!-- Selected image preview -->
                <div
                  v-if="receiptPreview"
                  class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-3"
                >
                  <img
                    :src="receiptPreview"
                    alt="Selected transaction receipt"
                    class="max-h-64 w-full rounded-xl object-contain"
                  />

                  <button
                    type="button"
                    class="mt-3 w-full rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    @click="removeSelectedReceipt"
                  >
                    Remove Selected Image
                  </button>
                </div>

                <!-- Existing Cloudinary receipt -->
                <div
                  v-else-if="transaction?.receiptUrl"
                  class="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3"
                >
                  <img
                    :src="transaction.receiptUrl"
                    alt="Current transaction receipt"
                    class="max-h-64 w-full rounded-xl object-contain"
                  />

                  <p class="mt-3 text-center text-xs text-stone-500">Current transaction receipt</p>
                </div>

                <!-- Empty state -->
                <div
                  v-else
                  class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-7 text-center"
                >
                  <FileImage :size="28" class="text-stone-400" />

                  <p class="mt-3 text-sm font-medium text-stone-600">
                    No transaction screenshot selected
                  </p>

                  <p class="mt-1 text-xs text-stone-400">
                    Upload a JPG, PNG, or WebP image (max 5 MB).
                  </p>
                </div>

                <!-- Upload button -->
                <label
                  for="edit-receipt-upload"
                  class="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  {{
                    transaction?.receiptUrl || receiptPreview
                      ? 'Replace Screenshot'
                      : 'Upload Screenshot'
                  }}
                </label>

                <input
                  id="edit-receipt-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  @change="handleReceiptUpload"
                />

                <!-- Validation error -->
                <p v-if="receiptError" class="mt-2 text-xs font-medium text-red-600">
                  {{ receiptError }}
                </p>
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
                  :disabled="isSaving || !hasTransactionChanges"
                  class="rounded-2xl bg-[#FFBA08] px-4 py-4 text-sm font-bold text-stone-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed bg-[#FFBA08]/80 disabled:text-stone-900/80 disabled:opacity-70 disabled:hover:bg-amber-400/80"
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
              <div v-if="receiptImageUrl" class="rounded-2xl border border-white/80 bg-white p-4">
                <!-- Receipt header -->
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold text-stone-900">Transaction Receipt</p>
                    <p class="mt-1 text-xs text-stone-500">Attached image</p>
                  </div>

                  <!-- External link -->
                  <a
                    :href="receiptImageUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition hover:bg-amber-200"
                    aria-label="Open receipt in new tab"
                  >
                    <ExternalLink :size="20" />
                  </a>
                </div>

                <!-- Full receipt screenshot -->
                <div class="flex justify-center">
                  <img
                    :src="receiptImageUrl"
                    alt="Transaction receipt"
                    class="h-auto max-w-full rounded-xl object-contain"
                  />
                </div>
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
            <button
              type="button"
              :disabled="isDeleting"
              class="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleDelete"
            >
              <Trash2 :size="18" />
              {{ isDeleting ? 'Deleting...' : 'Delete Transaction' }}
            </button>

            <p v-if="deleteErrorMessage" role="alert" class="mt-3 text-center text-sm text-red-600">
              {{ deleteErrorMessage }}
            </p>
          </template>
        </template>
      </div>
    </div>
  </main>

  <!-- Delete Transaction Confirmation Modal -->
  <Teleport to="body">
    <Transition name="delete-modal">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm"
        @click.self="cancelDelete"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-description"
          class="w-full max-w-sm rounded-3xl bg-[#FFF9EF] p-6 shadow-2xl"
        >
          <!-- Delete Icon -->
          <div class="mb-5 flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 :size="30" class="text-red-600" />
            </div>
          </div>

          <!-- Modal Title -->
          <h2 id="delete-modal-title" class="text-center text-xl font-bold text-stone-900">
            Delete Transaction?
          </h2>

          <!-- Modal Description -->
          <p
            id="delete-modal-description"
            class="mt-3 text-center text-sm leading-relaxed text-stone-500"
          >
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>

          <!-- Error Message -->
          <p v-if="deleteErrorMessage" role="alert" class="mt-4 text-center text-sm text-red-600">
            {{ deleteErrorMessage }}
          </p>

          <!-- Action Buttons -->
          <div class="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              :disabled="isDeleting"
              class="rounded-2xl bg-stone-200 px-4 py-3 text-sm font-bold text-stone-700 disabled:opacity-50"
              @click="cancelDelete"
            >
              Cancel
            </button>

            <button
              type="button"
              :disabled="isDeleting"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              @click="confirmDelete"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
