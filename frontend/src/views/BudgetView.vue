<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  UtensilsCrossed,
  CarFront,
  Shirt,
  HeartPulse,
  Wallet,
  Tag,
  X,
  Pencil,
  Trash2,
} from 'lucide-vue-next'

import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/services/budgets/budgetService.js'
import type { MonthlyBudgets } from '@/types/budget'
import { getCategories } from '@/services/categories/categoryService'
import type { Category } from '@/services/categories/categoryService'

// Current month and year in WIB
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

// State
const selectedMonth = ref(currentPeriod.month)
const selectedYear = ref(currentPeriod.year)

const budgetData = ref<MonthlyBudgets | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const isAddBudgetOpen = ref(false)
const isCreatingBudget = ref(false)
const createBudgetError = ref('')
const editingBudgetId = ref<number | null>(null)
const isDeletingBudget = ref(false)
const deletingBudgetId = ref<number | null>(null)
const deleteBudgetError = ref('')

const categories = ref<Category[]>([])
const selectedCategoryId = ref<number | null>(null)
const budgetAmount = ref('')

const isCategoryDropdownOpen = ref(false)

const selectedCategory = computed(() =>
  availableCategories.value.find((category) => category.id === selectedCategoryId.value),
)

const selectBudgetCategory = (categoryId: number) => {
  selectedCategoryId.value = categoryId
  isCategoryDropdownOpen.value = false
  createBudgetError.value = ''
}

// Manage Budgets modal
const isManageBudgetOpen = ref(false)
const openManageBudget = () => {
  isManageBudgetOpen.value = true
}

// Categories that are eligible for a new budget
const availableCategories = computed(() => {
  const existingCategoryIds = new Set(
    budgetData.value?.budgets
      .filter((budget) => budget.id !== editingBudgetId.value)
      .map((budget) => budget.category.id) ?? [],
  )

  return categories.value.filter(
    (category) => category.type === 'EXPENSE' && !existingCategoryIds.has(category.id),
  )
})

// Open and Close Add Budget form
const openAddBudget = async () => {
  editingBudgetId.value = null
  selectedCategoryId.value = null
  budgetAmount.value = ''
  createBudgetError.value = ''

  isAddBudgetOpen.value = true

  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
    createBudgetError.value = 'Unable to load expense categories.'
  }
}

const closeAddBudget = () => {
  isAddBudgetOpen.value = false
  isCategoryDropdownOpen.value = false
  editingBudgetId.value = null
}

const openEditBudget = async (budgetId: number) => {
  const budget = budgetData.value?.budgets.find((item) => item.id === budgetId)

  if (!budget) return

  editingBudgetId.value = budget.id
  selectedCategoryId.value = budget.category.id
  budgetAmount.value = String(budget.amount)
  createBudgetError.value = ''

  isAddBudgetOpen.value = true

  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
    createBudgetError.value = 'Unable to load expense categories.'
  }
}

const closeManageBudget = () => {
  if (isCreatingBudget.value || isDeletingBudget.value) return

  isManageBudgetOpen.value = false
  isAddBudgetOpen.value = false
  editingBudgetId.value = null
  deletingBudgetId.value = null
  deleteBudgetError.value = ''
}

const handleSaveBudget = async () => {
  createBudgetError.value = ''

  if (selectedCategoryId.value === null) {
    createBudgetError.value = 'Please select an expense category.'
    return
  }

  const amount = Number(budgetAmount.value)

  if (!Number.isFinite(amount) || amount <= 0) {
    createBudgetError.value = 'Please enter a valid budget amount.'
    return
  }

  if (!availableCategories.value.some((category) => category.id === selectedCategoryId.value)) {
    createBudgetError.value = 'This category is not available.'
    return
  }

  if (isCreatingBudget.value) return

  isCreatingBudget.value = true

  try {
    if (editingBudgetId.value !== null) {
      await updateBudget(editingBudgetId.value, {
        categoryId: selectedCategoryId.value,
        amount,
      })
    } else {
      await createBudget({
        categoryId: selectedCategoryId.value,
        amount,
        month: selectedMonth.value,
        year: selectedYear.value,
      })
    }

    closeAddBudget()
    editingBudgetId.value = null

    await fetchBudgets()
  } catch (error) {
    console.error('Failed to save budget:', error)
    createBudgetError.value = 'Unable to save budget. Please try again.'
  } finally {
    isCreatingBudget.value = false
  }
}

const openDeleteBudget = (budgetId: number) => {
  deletingBudgetId.value = budgetId
  deleteBudgetError.value = ''
}

const closeDeleteBudget = () => {
  if (isDeletingBudget.value) return

  deletingBudgetId.value = null
  deleteBudgetError.value = ''
}

const handleDeleteBudget = async () => {
  if (deletingBudgetId.value === null || isDeletingBudget.value) {
    return
  }

  isDeletingBudget.value = true
  deleteBudgetError.value = ''

  try {
    await deleteBudget(deletingBudgetId.value)

    deletingBudgetId.value = null
    await fetchBudgets()
  } catch (error) {
    console.error('Failed to delete budget:', error)
    deleteBudgetError.value = 'Unable to delete budget. Please try again.'
  } finally {
    isDeletingBudget.value = false
  }
}

// Month display
const formattedMonth = computed(() => {
  const date = new Date(Date.UTC(selectedYear.value, selectedMonth.value - 1, 1))

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
})

// Currency formatter
const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

// Monthly summary
const summary = computed(() => budgetData.value?.summary)

const progressPercentage = computed(() => {
  return Math.min(Math.max(summary.value?.percentageUsed ?? 0, 0), 100)
})

// Category icons
const getCategoryIcon = (name: string) => {
  const category = name.toLowerCase()

  if (category.includes('food') || category.includes('drink')) {
    return UtensilsCrossed
  }

  if (category.includes('transport')) {
    return CarFront
  }

  if (category.includes('fashion') || category.includes('cloth')) {
    return Shirt
  }

  if (category.includes('health')) {
    return HeartPulse
  }

  if (category.includes('shopping')) {
    return Wallet
  }

  return Tag
}

// Keep progress bars within 0–100%
const getBudgetProgress = (percentage: number) => {
  return Math.min(Math.max(percentage, 0), 100)
}

// Progress bar colors
const getProgressColor = (status: string) => {
  switch (status) {
    case 'WARNING':
      return 'bg-orange-500'

    case 'LIMIT_REACHED':
    case 'OVER_BUDGET':
      return 'bg-red-500'

    default:
      return 'bg-amber-500'
  }
}

// Status labels
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'WARNING':
      return 'Approaching limit'

    case 'LIMIT_REACHED':
      return 'Limit reached'

    case 'OVER_BUDGET':
      return 'Over budget'

    default:
      return 'On track'
  }
}

// Month navigation
const previousMonth = () => {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

const nextMonth = () => {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

// Fetch monthly budgets
let latestRequest = 0

const fetchBudgets = async () => {
  const requestId = ++latestRequest

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await getBudgets(selectedMonth.value, selectedYear.value)

    if (requestId === latestRequest) {
      budgetData.value = result
    }
  } catch (error) {
    if (requestId === latestRequest) {
      console.error('Failed to fetch budgets:', error)
      errorMessage.value = 'Unable to load budgets. Please try again.'
    }
  } finally {
    if (requestId === latestRequest) {
      isLoading.value = false
    }
  }
}

watch([selectedMonth, selectedYear], fetchBudgets)

onMounted(fetchBudgets)
</script>

<template>
  <main
    class="relative min-h-screen w-full px-5 py-9"
  >
    <div class="mx-auto max-w-lg space-y-4">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-stone-800">My Budgets</h1>
          <p class="mt-1 text-sm text-stone-500">Plan your spending wisely</p>
        </div>

        <div class="flex p-3 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
          <CalendarDays :size="22" class="text-amber-600" />
        </div>
      </header>

      <!-- Month Navigation -->
      <div class="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Previous month"
          class="rounded-full p-2 text-stone-500 hover:bg-white"
          @click="previousMonth"
        >
          <ChevronLeft :size="22" />
        </button>

        <h2 class="min-w-36 text-center font-semibold text-stone-700">
          {{ formattedMonth }}
        </h2>

        <button
          type="button"
          aria-label="Next month"
          class="rounded-full p-2 text-stone-500 hover:bg-white"
          @click="nextMonth"
        >
          <ChevronRight :size="22" />
        </button>
      </div>

      <!-- Monthly Budget Overview -->
      <section class="rounded-3xl bg-[#F9CB54]/90 p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-amber-900">Monthly Budget Overview</h3>

        <!-- Total Remaining -->
        <div class="mt-5 text-center">
          <p class="text-xs text-amber-900/75">Total Remaining</p>

          <div
            v-if="isLoading"
            class="mx-auto mt-2 h-9 w-48 animate-pulse rounded-lg bg-amber-900/15"
          ></div>

          <h2 v-else class="mt-1 text-3xl font-bold text-amber-950">
            {{ formatCurrency(summary?.totalRemaining ?? '0') }}
          </h2>
        </div>

        <!-- Budget and Spent -->
        <div class="mt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <p class="text-xs text-amber-900/75">Total Budget</p>

            <div
              v-if="isLoading"
              class="mx-auto mt-2 h-5 w-28 animate-pulse rounded bg-amber-900/15"
            ></div>

            <p v-else class="mt-1 font-semibold text-amber-950">
              {{ formatCurrency(summary?.totalBudget ?? '0') }}
            </p>
          </div>

          <div>
            <p class="text-xs text-amber-900/75">Spent</p>

            <div
              v-if="isLoading"
              class="mx-auto mt-2 h-5 w-28 animate-pulse rounded bg-amber-900/15"
            ></div>

            <p v-else class="mt-1 font-semibold text-amber-950">
              {{ formatCurrency(summary?.totalSpent ?? '0') }}
            </p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-6">
          <div class="h-2.5 overflow-hidden rounded-full bg-amber-600/25">
            <div
              v-if="isLoading"
              class="h-full w-full animate-pulse rounded-full bg-amber-900/15"
            ></div>

            <div
              v-else
              class="h-full rounded-full bg-amber-900 transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>

          <div
            v-if="isLoading"
            class="mt-2 ml-auto h-3 w-16 animate-pulse rounded bg-amber-900/15"
          ></div>

          <p v-else class="mt-2 text-right text-xs font-medium text-amber-900">
            {{ summary?.percentageUsed ?? 0 }}% used
          </p>
        </div>
      </section>

      <!-- Category Budgets Content -->
      <section
        class="mt-4 flex h-[35.5svh] w-full flex-col rounded-3xl border border-white/40 bg-white/40 p-4 shadow-lg shadow-amber-900/5 backdrop-blur-md"
      >
        <!-- Category Budgets Header -->
        <div class="flex shrink-0 items-center justify-between gap-3 pb-4">
          <h2 class="text-lg font-bold text-stone-900">Category Budgets</h2>

          <button
            type="button"
            class="flex shrink-0 items-center gap-1 rounded-full bg-[#F9CB54] px-4 py-2 text-xs font-semibold text-amber-950"
            @click="openManageBudget"
          >
            Manage
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex h-full flex-col items-center justify-center gap-4">
          <p class="pb-10 text-center text-sm text-stone-500">Loading budgets...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMessage"
          class="flex h-full flex-col items-center justify-center text-center"
        >
          <p class="text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <button type="button" class="mt-3 font-semibold text-amber-700" @click="fetchBudgets">
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!budgetData || budgetData.budgets.length === 0"
          class="flex h-full flex-col items-center justify-center text-center"
        >
          <p class="pb-10 text-center text-sm text-stone-500">No budgets created for this month yet.</p>
        </div>

        <!-- Scrollable Category List -->
        <div v-else class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          <!-- Individual Budget Cards -->
          <div
            v-for="budget in budgetData.budgets"
            :key="budget.id"
            class="rounded-xl bg-[#FFF8EA] p-3"
          >
            <!-- Category Header -->
            <div class="flex items-center gap-2.5">
              <!-- Category Icon -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100"
              >
                <component
                  :is="getCategoryIcon(budget.category.name)"
                  :size="20"
                  class="text-amber-600"
                />
              </div>

              <!-- Category Name -->
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-semibold text-stone-800">
                  {{ budget.category.name }}
                </h3>
              </div>

              <!-- Budget Status -->
              <div class="shrink-0 text-right">
                <p
                  class="text-[10px] font-medium"
                  :class="
                    budget.status === 'OVER_BUDGET' || budget.status === 'LIMIT_REACHED'
                      ? 'text-red-600'
                      : budget.status === 'WARNING'
                        ? 'text-orange-600'
                        : 'text-green-700'
                  "
                >
                  {{ getStatusLabel(budget.status) }}
                </p>
              </div>
            </div>

            <!-- Progress Bar and Percentage -->
            <div class="my-1 flex items-center gap-3">
              <!-- Progress Bar -->
              <div class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="getProgressColor(budget.status)"
                  :style="{
                    width: `${getBudgetProgress(budget.percentageUsed)}%`,
                  }"
                ></div>
              </div>

              <!-- Percentage -->
              <span
                class="w-10 shrink-0 text-right text-xs font-semibold"
                :class="
                  budget.status === 'OVER_BUDGET' || budget.status === 'LIMIT_REACHED'
                    ? 'text-red-600'
                    : budget.status === 'WARNING'
                      ? 'text-orange-600'
                      : 'text-amber-700'
                "
              >
                {{ budget.percentageUsed }}%
              </span>
            </div>

            <!-- Financial Details -->
            <div class="flex items-end justify-between gap-3">
              <!-- Spent / Budget (Bottom Left) -->
              <div class="min-w-0">
                <p class="text-[10px] text-stone-400">Spent / Budget</p>

                <p class="mt-0.5 text-xs font-medium text-stone-700">
                  {{ formatCurrency(budget.spent) }}
                  /
                  {{ formatCurrency(budget.amount) }}
                </p>
              </div>

              <!-- Remaining (Bottom Right) -->
              <div class="shrink-0 text-right">
                <p class="text-[10px] text-stone-400">Remaining</p>

                <p
                  class="mt-0.5 text-xs font-semibold"
                  :class="budget.status === 'OVER_BUDGET' ? 'text-red-600' : 'text-stone-700'"
                >
                  {{ formatCurrency(budget.remaining) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- Manage Budgets Modal -->
  <div
    v-if="isManageBudgetOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="closeManageBudget"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-budget-title"
      class="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl bg-[#FFF8ED] p-4 shadow-xl"
    >
      <!-- Header -->
      <div class="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h2 id="manage-budget-title" class="text-lg font-bold text-stone-900">
            {{
              isAddBudgetOpen
                ? editingBudgetId !== null
                  ? 'Edit Budget'
                  : 'Add Budget'
                : 'Manage Budgets'
            }}
          </h2>

          <p class="mt-1 text-xs text-stone-500">
            {{ formattedMonth }}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close Manage Budgets"
          class="rounded-full p-1 text-stone-700 hover:bg-stone-100"
          @click="closeManageBudget"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Add Budget Button -->
      <div v-if="!isAddBudgetOpen" class="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          class="mb-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#FFBA08] py-3 font-medium text-stone-900 transition-colors hover:bg-amber-400"
          @click="openAddBudget"
        >
          <Plus :size="18" />
          Add Budget
        </button>

        <!-- Scrollable Budget List -->
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
          <!-- Empty State -->
          <p
            v-if="!budgetData || budgetData.budgets.length === 0"
            class="py-8 text-center text-sm text-stone-500"
          >
            No budgets created for this month yet.
          </p>

          <!-- Existing Budgets -->
          <div
            v-for="budget in budgetData?.budgets ?? []"
            :key="budget.id"
            class="flex items-center gap-3 rounded-2xl bg-white p-3"
          >
            <!-- Category and Amount -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-stone-900">
                {{ budget.category.name }}
              </p>

              <p class="mt-1 text-xs text-stone-500">
                {{ formatCurrency(budget.amount) }}
              </p>
            </div>

            <!-- Edit -->
            <button
              type="button"
              :aria-label="`Edit ${budget.category.name} budget`"
              class="rounded-full p-2 text-orange-600 hover:bg-orange-50"
              @click="openEditBudget(budget.id)"
            >
              <Pencil :size="18" />
            </button>

            <!-- Delete -->
            <button
              type="button"
              :aria-label="`Delete ${budget.category.name} budget`"
              class="rounded-full p-2 text-red-500 hover:bg-red-50"
              @click="openDeleteBudget(budget.id)"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Add Budget Form -->
      <form v-else class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSaveBudget">
        <!-- Expense Category -->
        <div>
          <label id="budget-category-label" class="mb-2 block text-sm font-semibold text-stone-700">
            Expense Category
          </label>

          <div class="relative">
            <!-- Dropdown Trigger -->
            <button
              type="button"
              aria-labelledby="budget-category-label"
              aria-haspopup="listbox"
              :aria-expanded="isCategoryDropdownOpen"
              :disabled="isCreatingBudget || availableCategories.length === 0"
              class="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition-colors hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100"
                >
                  <component
                    :is="selectedCategory ? getCategoryIcon(selectedCategory.name) : Tag"
                    :size="18"
                    class="text-amber-600"
                  />
                </div>

                <span
                  class="truncate text-sm"
                  :class="selectedCategory ? 'font-medium text-stone-800' : 'text-stone-400'"
                >
                  {{ selectedCategory?.name ?? 'Select expense category' }}
                </span>
              </div>

              <ChevronDown
                :size="18"
                class="shrink-0 text-stone-500 transition-transform duration-200"
                :class="{ 'rotate-180': isCategoryDropdownOpen }"
              />
            </button>

            <!-- Dropdown Options -->
            <div
              v-if="isCategoryDropdownOpen"
              role="listbox"
              aria-labelledby="budget-category-label"
              class="absolute inset-x-0 top-full z-50 mt-2 max-h-46 space-y-1 overflow-y-auto rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
            >
              <button
                v-for="category in availableCategories"
                :key="category.id"
                type="button"
                role="option"
                :aria-selected="selectedCategoryId === category.id"
                class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-amber-50"
                :class="selectedCategoryId === category.id ? 'bg-amber-100' : ''"
                @click="selectBudgetCategory(category.id)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <component
                    :is="getCategoryIcon(category.name)"
                    :size="18"
                    class="shrink-0 text-amber-600"
                  />

                  <span class="truncate text-sm font-medium text-stone-700">
                    {{ category.name }}
                  </span>
                </div>

                <Check
                  v-if="selectedCategoryId === category.id"
                  :size="18"
                  class="shrink-0 text-amber-600"
                />
              </button>
            </div>
          </div>

          <!-- Empty Category State -->
          <p
            v-if="availableCategories.length === 0 && !createBudgetError"
            class="mt-2 text-xs text-stone-500"
          >
            No available expense categories for this month.
          </p>
        </div>

        <!-- Budget Amount -->
        <div class="mt-4">
          <label for="budget-amount" class="mb-2 block text-sm font-semibold text-stone-700">
            Budget Amount
          </label>

          <div
            class="flex items-center rounded-2xl border border-stone-200 bg-white px-4 focus-within:border-amber-400"
          >
            <span class="text-sm font-semibold text-stone-500"> Rp </span>

            <input
              id="budget-amount"
              v-model="budgetAmount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="Enter budget amount"
              class="w-full bg-transparent px-3 py-3 text-sm text-stone-800 outline-none"
            />
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="createBudgetError" role="alert" class="mt-3 text-xs text-red-600">
          {{ createBudgetError }}
        </p>

        <!-- Form Actions -->
        <div class="mt-5 flex shrink-0 gap-3">
          <button
            type="button"
            :disabled="isCreatingBudget"
            class="flex-1 rounded-full bg-stone-200 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-300 disabled:opacity-50"
            @click="closeAddBudget"
          >
            Back
          </button>

          <button
            type="submit"
            :disabled="isCreatingBudget || availableCategories.length === 0"
            class="flex-1 rounded-full bg-[#FFBA08] py-3 text-sm font-semibold text-stone-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{
              isCreatingBudget
                ? 'Saving...'
                : editingBudgetId !== null
                  ? 'Update Budget'
                  : 'Save Budget'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Delete Budget Confirmation -->
  <div
    v-if="deletingBudgetId !== null"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-budget-title"
      class="w-full max-w-sm rounded-3xl bg-[#FFF8ED] p-5 shadow-xl"
    >
      <h2 id="delete-budget-title" class="text-lg font-bold text-stone-900">Delete Budget?</h2>

      <p class="mt-3 text-sm text-stone-600">
        Are you sure you want to delete this budget? Your transactions and expense category will not
        be deleted.
      </p>

      <p v-if="deleteBudgetError" role="alert" class="mt-3 text-xs text-red-600">
        {{ deleteBudgetError }}
      </p>

      <div class="mt-6 flex gap-3">
        <button
          type="button"
          :disabled="isDeletingBudget"
          class="flex-1 rounded-full bg-stone-200 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
          @click="closeDeleteBudget"
        >
          Cancel
        </button>

        <button
          type="button"
          :disabled="isDeletingBudget"
          class="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          @click="handleDeleteBudget"
        >
          {{ isDeletingBudget ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
