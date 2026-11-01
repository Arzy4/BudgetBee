<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, X } from 'lucide-vue-next'
import axios from 'axios'
import { createTransaction } from '@/services/transactions/transactionService'
import TransactionForm from '@/components/transactions/transactionForm.vue'
import type { CreateTransactionPayload } from '@/types/transaction'
import { getCategories } from '@/services/categoryService'
import type { Category } from '@/services/categoryService'
import CategoryManager from '@/components/categories/categoryManager.vue'

const router = useRouter()

const submitError = ref('')
const showCategoryManager = ref(false)

const categories = ref<Category[]>([])
const isLoadingCategories = ref(false)
const categoryError = ref('')

async function fetchCategories() {
  isLoadingCategories.value = true
  categoryError.value = ''

  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    categoryError.value = 'Failed to load categories.'
  } finally {
    isLoadingCategories.value = false
  }
}

onMounted(fetchCategories)

// Frontend-only state
const isSubmitting = ref(false)
const showSuccessModal = ref(false)
const submittedTransaction = ref<CreateTransactionPayload | null>(null)

// Handle submission from TransactionForm.vue
async function handleSubmit(payload: CreateTransactionPayload) {
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = await createTransaction(payload)

    console.log('Transaction created:', response)

    submittedTransaction.value = payload
    showSuccessModal.value = true
  } catch (error) {
    console.error('Failed to create transaction:', error)

    if (axios.isAxiosError(error)) {
      submitError.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Failed to save transaction. Please try again.'
    } else {
      submitError.value = 'An unexpected error occurred.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// Close success modal
function closeModal() {
  showSuccessModal.value = false
  router.push('/dashboard')
}

// Navigate to previous page
function goBack() {
  router.back()
}

// Format amount for preview
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}
</script>

<template>
  <main
    class="flex h-svh flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-4 pb-10"
    style="background-image: url('/images/dashboard-bg.png')"
  >
    <div class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <!-- Fixed header -->
      <header class="mb-4 flex shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label="Go back"
          class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-lg"
          @click="goBack"
        >
          <ArrowLeft :size="22" class="text-stone-800" />
        </button>
      </header>

      <div class="flex min-h-0 flex-1 flex-col">
        <h1 class="shrink-0 pb-6 text-center text-xl font-bold text-stone-900">Add Transaction</h1>

        <p
          v-if="submitError"
          role="alert"
          class="mb-3 rounded-xl bg-red-50/90 px-4 py-3 text-sm text-red-700"
        >
          {{ submitError }}
        </p>

        <p v-else-if="categoryError" role="alert">
          {{ categoryError }}
        </p>

        <TransactionForm
          v-else
          class="min-h-0 flex-1"
          :categories="categories"
          :is-submitting="isSubmitting"
          @submit="handleSubmit"
          @manage-categories="showCategoryManager = true"
        />
      </div>

      <CategoryManager
        v-model="showCategoryManager"
        :categories="categories"
        @changed="fetchCategories"
      />
    </div>

    <!-- Success modal -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-preview-title"
        class="w-full max-w-sm rounded-3xl border border-white/70 bg-[#FFF8ED]/90 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div class="mb-4 flex justify-end">
          <button type="button" aria-label="Close" @click="closeModal">
            <X :size="20" class="text-stone-600" />
          </button>
        </div>

        <div class="flex flex-col items-center text-center">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <CheckCircle2 :size="36" class="text-amber-600" />
          </div>

          <h2 id="transaction-preview-title" class="text-xl font-bold text-stone-900">
            Transaction Saved!
          </h2>

          <p class="mt-2 text-sm text-stone-600">Your transaction has been saved successfully!</p>

          <div
            v-if="submittedTransaction"
            class="mt-5 w-full rounded-2xl bg-white/60 p-4 text-left"
          >
            <p class="text-sm font-semibold text-stone-900">
              {{ submittedTransaction.title }}
            </p>

            <p class="mt-1 text-xl font-bold text-stone-900">
              {{ formatCurrency(submittedTransaction.amount) }}
            </p>

            <p class="mt-1 text-xs text-stone-500">
              {{ submittedTransaction.type === 'EXPENSE' ? 'Expense' : 'Income' }}
            </p>
          </div>

          <button
            type="button"
            class="mt-6 w-full rounded-full bg-amber-400 py-3 font-semibold text-stone-900 transition hover:bg-amber-500"
            @click="closeModal"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
