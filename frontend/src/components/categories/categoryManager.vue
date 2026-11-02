<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import { X, Plus, Pencil, Trash2, ArrowLeft, ChevronDown, Check } from 'lucide-vue-next'
import { createCategory, updateCategory, deleteCategory } from '@/services/categories/categoryService'
import type { Category, CategoryType } from '@/services/categories/categoryService'

const props = defineProps<{
  categories: Category[]
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  changed: []
}>()

type ManagerMode = 'list' | 'create' | 'edit' | 'delete'

const mode = ref<ManagerMode>('list')
const selectedCategory = ref<Category | null>(null)

const categoryName = ref('')
const categoryType = ref<CategoryType>('EXPENSE')

// Custom Category Type Dropdown
const isTypeDropdownOpen = ref(false)

const categoryTypeOptions: {
  label: string
  value: CategoryType
}[] = [
  { label: 'EXPENSE', value: 'EXPENSE' },
  { label: 'INCOME', value: 'INCOME' },
]

function selectCategoryType(type: CategoryType) {
  categoryType.value = type
  isTypeDropdownOpen.value = false
}

const isSubmitting = ref(false)
const errorMessage = ref('')

const sortedCategories = computed(() =>
  [...props.categories].sort((a, b) => a.name.localeCompare(b.name)),
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetManager()
  },
)

function resetManager() {
  mode.value = 'list'
  selectedCategory.value = null
  categoryName.value = ''
  categoryType.value = 'EXPENSE'
  errorMessage.value = ''
}

function closeManager() {
  if (isSubmitting.value) return
  emit('update:modelValue', false)
  resetManager()
}

function openCreate() {
  categoryName.value = ''
  categoryType.value = 'EXPENSE'
  selectedCategory.value = null
  errorMessage.value = ''
  mode.value = 'create'
}

function openEdit(category: Category) {
  selectedCategory.value = category
  categoryName.value = category.name
  categoryType.value = category.type
  errorMessage.value = ''
  mode.value = 'edit'
}

function openDelete(category: Category) {
  selectedCategory.value = category
  errorMessage.value = ''
  mode.value = 'delete'
}

function goToList() {
  mode.value = 'list'
  selectedCategory.value = null
  errorMessage.value = ''
  isTypeDropdownOpen.value = false
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
  }

  return 'Something went wrong. Please try again.'
}

async function saveCategory() {
  const name = categoryName.value.trim().toUpperCase()

  if (!name) {
    errorMessage.value = 'Category name is required'
    return
  }

  if (name.length > 100) {
    errorMessage.value = 'Category name cannot exceed 100 characters'
    return
  }

  if (isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (mode.value === 'create') {
      await createCategory({
        name,
        type: categoryType.value,
      })
    } else if (mode.value === 'edit' && selectedCategory.value) {
      await updateCategory(selectedCategory.value.id, {
        name,
        type: categoryType.value,
      })
    } else {
      return
    }

    emit('changed')
    goToList()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  if (!selectedCategory.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await deleteCategory(selectedCategory.value.id)

    emit('changed')
    goToList()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    @click.self="closeManager"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
      class="relative flex max-h-[85svh] w-full max-w-sm flex-col rounded-3xl border border-white/70 bg-[#FFF8ED] p-5 shadow-2xl"
    >
      <!-- Header -->
      <div class="mb-4 flex shrink-0 items-center justify-between">
        <button
          v-if="mode !== 'list'"
          type="button"
          aria-label="Back to categories"
          :disabled="isSubmitting"
          @click="goToList"
        >
          <ArrowLeft :size="20" class="text-stone-700" />
        </button>

        <h2 id="category-manager-title" class="text-lg font-bold text-stone-900">
          {{
            mode === 'list'
              ? 'Manage Categories'
              : mode === 'create'
                ? 'Add Category'
                : mode === 'edit'
                  ? 'Edit Category'
                  : 'Delete Category'
          }}
        </h2>

        <button
          type="button"
          aria-label="Close category manager"
          :disabled="isSubmitting"
          @click="closeManager"
        >
          <X :size="20" class="text-stone-600" />
        </button>
      </div>

      <!-- Category List -->
      <div v-if="mode === 'list'" class="min-h-0 flex-1 overflow-y-auto">
        <button
          type="button"
          class="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 font-semibold text-stone-900 transition hover:bg-amber-500"
          @click="openCreate"
        >
          <Plus :size="18" />
          Add Category
        </button>

        <div
          v-for="category in sortedCategories"
          :key="category.id"
          class="mb-2 flex items-center gap-3 rounded-2xl bg-white/70 p-3"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-stone-900">
              {{ category.name }}
            </p>

            <p class="mt-1 text-xs text-stone-500">
              {{ category.type === 'EXPENSE' ? 'Expense' : 'Income' }}
            </p>
          </div>

          <button
            type="button"
            :aria-label="`Edit ${category.name}`"
            class="rounded-xl p-2 text-amber-700 hover:bg-amber-100"
            @click="openEdit(category)"
          >
            <Pencil :size="18" />
          </button>

          <button
            type="button"
            :aria-label="`Delete ${category.name}`"
            class="rounded-xl p-2 text-red-600 hover:bg-red-50"
            @click="openDelete(category)"
          >
            <Trash2 :size="18" />
          </button>
        </div>

        <p v-if="sortedCategories.length === 0" class="py-6 text-center text-sm text-stone-500">
          No categories available.
        </p>
      </div>

      <!-- Create / Edit -->
      <form
        v-else-if="mode === 'create' || mode === 'edit'"
        class="space-y-4"
        @submit.prevent="saveCategory"
      >
        <div>
          <label for="manager-category-name" class="mb-2 block text-sm font-medium text-stone-700">
            Category name
          </label>

          <input
            id="manager-category-name"
            v-model="categoryName"
            type="text"
            maxlength="100"
            placeholder="e.g. Entertainment"
            class="w-full rounded-xl bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <!-- Custom Category Type Dropdown -->
        <div>
          <label
            id="manager-category-type-label"
            class="mb-2 block text-sm font-medium text-stone-700"
          >
            Category type
          </label>

          <div class="relative">
            <!-- Dropdown trigger -->
            <button
              type="button"
              aria-labelledby="manager-category-type-label"
              aria-haspopup="listbox"
              :aria-expanded="isTypeDropdownOpen"
              class="flex w-full items-center justify-between rounded-xl bg-white p-3 text-left text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400"
              @click="isTypeDropdownOpen = !isTypeDropdownOpen"
            >
              <span>{{ categoryType }}</span>

              <ChevronDown
                :size="18"
                class="text-stone-500 transition-transform"
                :class="{ 'rotate-180': isTypeDropdownOpen }"
              />
            </button>

            <!-- Dropdown options -->
            <div
              v-if="isTypeDropdownOpen"
              role="listbox"
              aria-labelledby="manager-category-type-label"
              class="absolute inset-x-0 top-full z-50 mt-2 space-y-1 rounded-xl border border-amber-200 bg-[#FFF8ED] p-2 shadow-xl"
            >
              <button
                v-for="option in categoryTypeOptions"
                :key="option.value"
                type="button"
                role="option"
                :aria-selected="categoryType === option.value"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-amber-100"
                :class="categoryType === option.value ? 'bg-amber-100 font-semibold' : ''"
                @click="selectCategoryType(option.value)"
              >
                <span>{{ option.label }}</span>

                <Check v-if="categoryType === option.value" :size="16" class="text-amber-600" />
              </button>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" role="alert" class="text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-full bg-amber-400 py-3 font-semibold text-stone-900 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Category' }}
        </button>
      </form>

      <!-- Delete confirmation -->
      <div v-else-if="mode === 'delete'" class="space-y-4">
        <p class="text-sm text-stone-700">
          Are you sure you want to delete
          <strong>{{ selectedCategory?.name }}</strong
          >?
        </p>

        <p class="text-xs text-stone-500">
          Categories used by transactions or budgets cannot be deleted.
        </p>

        <p v-if="errorMessage" role="alert" class="text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button
          type="button"
          :disabled="isSubmitting"
          class="w-full rounded-full bg-red-500 py-3 font-semibold text-white disabled:opacity-50"
          @click="confirmDelete"
        >
          {{ isSubmitting ? 'Deleting...' : 'Delete Category' }}
        </button>
      </div>
    </div>
  </div>
</template>
