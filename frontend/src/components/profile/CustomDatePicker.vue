<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  min?: string
  placeholder?: string
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function formatISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = new Date()

const initialDate = props.modelValue
  ? parseDate(props.modelValue)
  : props.min
    ? parseDate(props.min)
    : today

const displayedMonth = ref(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))

const monthLabel = computed(() =>
  displayedMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder ?? 'Select date'

  return parseDate(props.modelValue).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const calendarDays = computed(() => {
  const year = displayedMonth.value.getFullYear()
  const month = displayedMonth.value.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = Array(firstDay).fill(null)

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return days
})

function changeMonth(offset: number) {
  displayedMonth.value = new Date(
    displayedMonth.value.getFullYear(),
    displayedMonth.value.getMonth() + offset,
    1,
  )
}

function selectDate(day: number) {
  const date = new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth(), day)

  const value = formatISO(date)

  if (props.min && value < props.min) return

  emit('update:modelValue', value)
  isOpen.value = false
}

function isDisabled(day: number): boolean {
  if (!props.min) return false

  const date = new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth(), day)

  return formatISO(date) < props.min
}

function isToday(day: number): boolean {
  return (
    displayedMonth.value.getFullYear() === today.getFullYear() &&
    displayedMonth.value.getMonth() === today.getMonth() &&
    day === today.getDate()
  )
}

function isSelected(day: number): boolean {
  if (!props.modelValue) return false

  const date = new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth(), day)

  return formatISO(date) === props.modelValue
}

function toggleCalendar() {
  if (!isOpen.value) {
    const date = props.modelValue
      ? parseDate(props.modelValue)
      : props.min
        ? parseDate(props.min)
        : new Date()

    displayedMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
  }

  isOpen.value = !isOpen.value
}

watch(
  () => props.min,
  (minimum) => {
    if (minimum && props.modelValue && props.modelValue < minimum) {
      emit('update:modelValue', '')
    }
  },
)
</script>

<template>
  <div class="relative w-full">
    <button
      :id="id"
      type="button"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-white/80 bg-white/50 px-3 py-3 text-left text-[11px] font-medium text-stone-800 transition-colors hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
      @click="toggleCalendar"
    >
      <span class="min-w-0 truncate">
        {{ selectedLabel }}
      </span>

      <CalendarDays :size="16" class="shrink-0 text-amber-600" />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-5 backdrop-blur-[2px]"
        @click.self="isOpen = false"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
          class="w-full max-w-[320px] rounded-3xl border border-amber-100 bg-[#FFF9ED] p-5 shadow-2xl"
        >
          <!-- Calendar header -->
          <div class="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              class="rounded-lg p-1.5 text-stone-600 hover:bg-amber-100"
              @click="changeMonth(-1)"
            >
              <ChevronLeft :size="18" />
            </button>

            <span class="text-[13px] font-bold text-stone-800">
              {{ monthLabel }}
            </span>

            <button
              type="button"
              aria-label="Next month"
              class="rounded-lg p-1.5 text-stone-600 hover:bg-amber-100"
              @click="changeMonth(1)"
            >
              <ChevronRight :size="18" />
            </button>
          </div>

          <!-- Weekday labels -->
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="weekday in weekdays"
              :key="weekday"
              class="py-2 text-center text-[11px] font-semibold text-stone-400"
            >
              {{ weekday }}
            </div>

            <!-- Calendar days -->
            <template v-for="(day, index) in calendarDays" :key="index">
              <div v-if="day === null" />

              <button
                v-else
                type="button"
                :disabled="isDisabled(day)"
                class="flex aspect-square items-center justify-center rounded-xl text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                :class="
                  isSelected(day)
                    ? 'bg-amber-400 font-bold text-stone-900'
                    : isToday(day)
                      ? 'border border-amber-400 font-semibold text-amber-700'
                      : 'text-stone-700 hover:bg-amber-100'
                "
                @click="selectDate(day)"
              >
                {{ day }}
              </button>
            </template>
          </div>

          <!-- Close button -->
          <button
            type="button"
            class="mt-5 w-full rounded-xl bg-amber-100 py-3 text-[12px] font-semibold text-amber-800 transition-colors hover:bg-amber-200"
            @click="isOpen = false"
          >
            Close
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
