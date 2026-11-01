<script setup lang="ts">
import { computed, reactive, ref, onBeforeUnmount, watch } from 'vue'
import type { TransactionType, PaymentMethod } from '@/types/transaction'
import { ImagePlus, X, Upload, ChevronDown, Check, CalendarDays } from 'lucide-vue-next'

interface CategoryOption {
  id: number
  name: string
  type: TransactionType
}

const props = defineProps<{
  categories: CategoryOption[]
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  submit: [
    payload: {
      title: string
      amount: number
      type: TransactionType
      categoryId: number
      paymentMethod?: PaymentMethod
      date: string
      description?: string
    },
  ]
  'manage-categories': []
}>()

watch(
  () => props.categories,
  () => {
    if (
      form.categoryId &&
      !filteredCategories.value.some((category) => category.id === Number(form.categoryId))
    ) {
      form.categoryId = ''
    }
  },
)

const isCategoryOpen = ref(false)

const selectedCategory = computed(() =>
  filteredCategories.value.find((category) => category.id === Number(form.categoryId)),
)

function selectCategory(categoryId: number) {
  form.categoryId = String(categoryId)
  isCategoryOpen.value = false
}

const isPaymentDropdownOpen = ref(false)
const paymentOptions: {
  label: string
  value: PaymentMethod
}[] = [
  { label: 'CASH', value: 'CASH' },
  { label: 'BANK TRANSFER', value: 'BANK_TRANSFER' },
  { label: 'E WALLET', value: 'E_WALLET' },
  { label: 'CARD', value: 'CARD' },
]

const selectedPayment = computed(() =>
  paymentOptions.find((option) => option.value === form.paymentMethod),
)

function selectPaymentMethod(value: PaymentMethod | '') {
  form.paymentMethod = value
  isPaymentDropdownOpen.value = false
}

const transactionType = ref<TransactionType>('EXPENSE')

const form = reactive({
  title: '',
  amount: '',
  categoryId: '',
  paymentMethod: '',
  date: new Date().toLocaleDateString('en-CA'),
  description: '',
})

const filteredCategories = computed(() =>
  props.categories.filter((category) => category.type === transactionType.value),
)

const errorMessage = ref('')

function changeType(type: TransactionType) {
  transactionType.value = type
  form.categoryId = ''
  errorMessage.value = ''
  isCategoryOpen.value = false
}

function submitForm() {
  errorMessage.value = ''

  const title = form.title.trim().toLocaleUpperCase()
  const amount = Number(form.amount)
  const categoryId = Number(form.categoryId)

  if (!title) {
    errorMessage.value = 'Transaction title is required'
    return
  }

  if (title.length > 100) {
    errorMessage.value = 'Title cannot exceed 100 characters'
    return
  }

  if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
    errorMessage.value = 'Enter a valid amount greater than zero'
    return
  }

  if (Math.abs(amount * 100 - Math.round(amount * 100)) >= 1e-8) {
    errorMessage.value = 'Amount cannot have more than 2 decimal places'
    return
  }

  if (
    !form.categoryId ||
    !filteredCategories.value.some((category) => category.id === categoryId)
  ) {
    errorMessage.value = 'Please select a valid category'
    return
  }

  const parsedDate = new Date(`${form.date}T12:00:00`)

  if (!form.date || Number.isNaN(parsedDate.getTime())) {
    errorMessage.value = 'Please enter a valid date'
    return
  }

  emit('submit', {
    title,
    amount,
    type: transactionType.value,
    categoryId,
    ...(form.paymentMethod && {
      paymentMethod: form.paymentMethod as PaymentMethod,
    }),
    date: parsedDate.toISOString(),
    ...(form.description.trim() && {
      description: form.description.trim(),
    }),
  })
}

// Receipt image state
const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)
const receiptError = ref('')

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function handleReceiptUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  receiptError.value = ''

  if (!file) return

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    receiptError.value = 'Only JPG, PNG, and WebP images are allowed'
    input.value = ''
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    receiptError.value = 'Receipt image cannot exceed 5 MB'
    input.value = ''
    return
  }

  if (receiptPreview.value) {
    URL.revokeObjectURL(receiptPreview.value)
  }

  receiptFile.value = file
  receiptPreview.value = URL.createObjectURL(file)
}

function removeReceipt() {
  if (receiptPreview.value) {
    URL.revokeObjectURL(receiptPreview.value)
  }

  receiptFile.value = null
  receiptPreview.value = null
  receiptError.value = ''
}

onBeforeUnmount(() => {
  if (receiptPreview.value) {
    URL.revokeObjectURL(receiptPreview.value)
  }
})

const isCalendarOpen = ref(false)
const initialDate = new Date(`${form.date}T12:00:00`)
const calendarYear = ref(initialDate.getFullYear())
const calendarMonth = ref(initialDate.getMonth())
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

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

const formattedDate = computed(() => {
  if (!form.date) return 'Select date'

  return new Date(`${form.date}T12:00:00`).toLocaleDateString('en-GB', {
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
  form.date = [
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

function togglePaymentDropdown() {
  isPaymentDropdownOpen.value = !isPaymentDropdownOpen.value
  isCalendarOpen.value = false
}
</script>

<template>
  <form
    class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-lg"
    @submit.prevent="submitForm"
  >
    <!-- Fixed toggle -->
    <div class="mb-3 shrink-0">
      <div class="grid grid-cols-2 rounded-full bg-amber-100 p-1">
        <button
          v-for="type in ['EXPENSE', 'INCOME'] as const"
          :key="type"
          type="button"
          class="rounded-full py-3 text-sm font-semibold transition"
          :class="
            transactionType === type ? 'bg-white text-orange-700 shadow-sm' : 'text-stone-500'
          "
          @click="changeType(type)"
        >
          {{ type === 'EXPENSE' ? 'Expense' : 'Income' }}
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-1">
      <div>
        <label class="mb-1 block text-sm font-medium text-stone-700"> Amount (Rp) </label>
        <input
          v-model="form.amount"
          type="number"
          min="0.01"
          step="0.01"
          inputmode="decimal"
          placeholder="50000"
          class="w-full rounded-xl bg-amber-50 p-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-stone-700"> Transaction title </label>
        <input
          v-model="form.title"
          type="text"
          maxlength="100"
          placeholder="e.g. Gojek Ride"
          class="w-full rounded-xl bg-amber-50 p-3 outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <!-- Custom Category Dropdown -->
      <div class="relative">
        <div class="mb-1 flex items-center justify-between">
          <label class="text-sm font-medium text-stone-700"> Category </label>

          <button
            type="button"
            class="text-xs font-semibold text-amber-700 hover:text-amber-800"
            @click="emit('manage-categories')"
          >
            Manage
          </button>
        </div>

        <!-- Dropdown trigger -->
        <button
          type="button"
          aria-labelledby="category-label"
          aria-haspopup="listbox"
          :aria-expanded="isCategoryOpen"
          class="flex w-full items-center justify-between rounded-xl bg-amber-50 p-3 text-left text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400"
          @click="isCategoryOpen = !isCategoryOpen"
        >
          <span :class="!selectedCategory ? 'text-stone-400' : ''">
            {{ selectedCategory?.name ?? 'Select a category' }}
          </span>

          <ChevronDown
            :size="18"
            class="shrink-0 text-stone-500 transition-transform"
            :class="{ 'rotate-180': isCategoryOpen }"
          />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="isCategoryOpen"
          role="listbox"
          aria-labelledby="category-label"
          class="absolute inset-x-0 top-full z-50 mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
        >
          <button
            v-for="category in filteredCategories"
            :key="category.id"
            type="button"
            role="option"
            :aria-selected="Number(form.categoryId) === category.id"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-amber-100"
            :class="Number(form.categoryId) === category.id ? 'bg-amber-100 font-semibold' : ''"
            @click="selectCategory(category.id)"
          >
            <span>{{ category.name }}</span>

            <Check
              v-if="Number(form.categoryId) === category.id"
              :size="16"
              class="text-amber-600"
            />
          </button>

          <p v-if="filteredCategories.length === 0" class="px-3 py-2 text-sm text-stone-500">
            No categories available
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label id="transaction-date-label" class="mb-1 block text-sm font-medium text-stone-700">
            Date
          </label>

          <div class="relative">
            <button
              type="button"
              aria-labelledby="transaction-date-label"
              :aria-expanded="isCalendarOpen"
              class="flex w-full items-center justify-between rounded-xl bg-amber-50 p-3 text-left text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400"
              @click="toggleCalendar"
            >
              <span>{{ formattedDate }}</span>
              <CalendarDays :size="16" class="shrink-0 text-stone-500" />
            </button>

            <div
              v-if="isCalendarOpen"
              class="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-amber-200 bg-[#FFF8ED] p-3 shadow-xl"
            >
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
                      form.date ===
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

        <div>
          <div>
            <label id="payment-method-label" class="mb-1 block text-sm font-medium text-stone-700">
              Payment method
            </label>

            <div class="relative">
              <button
                type="button"
                aria-labelledby="payment-method-label"
                aria-haspopup="listbox"
                :aria-expanded="isPaymentDropdownOpen"
                class="flex w-full items-center justify-between rounded-xl bg-amber-50 p-3 text-left text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400"
                @click="isPaymentDropdownOpen = !isPaymentDropdownOpen"
              >
                <span :class="!selectedPayment ? 'text-stone-400' : ''">
                  {{ selectedPayment?.label ?? 'Optional' }}
                </span>

                <ChevronDown
                  :size="16"
                  class="shrink-0 text-stone-500 transition-transform"
                  :class="{ 'rotate-180': isPaymentDropdownOpen }"
                />
              </button>

              <div
                v-if="isPaymentDropdownOpen"
                role="listbox"
                aria-labelledby="payment-method-label"
                class="absolute right-0 top-full z-50 mt-2 max-h-52 w-48 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
              >
                <button
                  type="button"
                  role="option"
                  :aria-selected="form.paymentMethod === ''"
                  class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-amber-100"
                  @click="selectPaymentMethod('')"
                >
                  None
                  <Check v-if="form.paymentMethod === ''" :size="16" class="text-amber-600" />
                </button>

                <button
                  v-for="option in paymentOptions"
                  :key="option.value"
                  type="button"
                  role="option"
                  :aria-selected="form.paymentMethod === option.value"
                  class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-amber-100"
                  :class="form.paymentMethod === option.value ? 'bg-amber-100 font-semibold' : ''"
                  @click="selectPaymentMethod(option.value)"
                >
                  {{ option.label }}
                  <Check
                    v-if="form.paymentMethod === option.value"
                    :size="16"
                    class="text-amber-600"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="transaction-description" class="mb-1 block text-sm font-medium text-stone-700">
          Description
          <span class="font-normal text-stone-500">(optional)</span>
        </label>

        <textarea
          id="transaction-description"
          v-model="form.description"
          rows="3"
          maxlength="500"
          placeholder="Add a note about this transaction..."
          class="w-full resize-none rounded-xl bg-amber-50 p-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400"
        ></textarea>
      </div>

      <!-- Receipt Image -->
      <div>
        <label class="mb-2 block text-sm font-medium text-stone-700">
          Receipt Image
          <span class="font-normal text-stone-500">(optional)</span>
        </label>

        <!-- Upload area -->
        <label
          v-if="!receiptPreview"
          for="receipt-upload"
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/70 bg-amber-50 px-4 py-7 text-center backdrop-blur-sm transition hover:bg-white/55"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/80">
            <ImagePlus :size="24" class="text-amber-700" />
          </div>

          <span class="text-sm font-semibold text-stone-800"> Upload Receipt </span>

          <span class="text-xs text-stone-500"> JPG, PNG or WebP · Max 5 MB </span>
        </label>

        <!-- Image preview -->
        <div
          v-else
          class="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-3 backdrop-blur-sm"
        >
          <img
            :src="receiptPreview"
            alt="Receipt preview"
            class="mx-auto max-h-56 w-full rounded-xl object-contain"
          />

          <button
            type="button"
            aria-label="Remove receipt"
            class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm"
            @click="removeReceipt"
          >
            <X :size="18" class="text-stone-800" />
          </button>

          <div class="mt-3 flex items-center gap-2">
            <Upload :size="16" class="text-amber-700" />
            <p class="min-w-0 truncate text-xs text-stone-700">
              {{ receiptFile?.name }}
            </p>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          id="receipt-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          @change="handleReceiptUpload"
        />

        <!-- Upload error -->
        <p v-if="receiptError" class="mt-2 text-xs text-red-600">
          {{ receiptError }}
        </p>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full rounded-full bg-amber-400 py-3 mt-6 font-semibold text-stone-900 transition hover:bg-amber-500 disabled:opacity-50"
      >
        {{ isSubmitting ? 'Saving...' : 'Save Transaction' }}
      </button>
    </div>
  </form>
</template>
