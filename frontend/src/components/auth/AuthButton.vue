<script setup lang="ts">
import { ArrowRight, LoaderCircle } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'button',
    loading: false,
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="relative flex h-[52px] w-full items-center justify-center rounded-full bg-[#F8C94F] px-3 text-sm font-semibold text-[#24211D] shadow-lg shadow-[#E6BD58]/20 transition-all duration-200 hover:bg-[#F5C13D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[56px] sm:text-base md:h-[60px]"
  >
    <!-- Button label -->
    <span class="w-full px-12 text-center">
      <slot>Continue</slot>
    </span>

    <!-- Arrow / Loading Indicator -->
    <span
      class="absolute right-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE6A2] sm:right-2 sm:h-11 sm:w-11"
    >
      <LoaderCircle v-if="loading" :size="20" class="animate-spin" />

      <ArrowRight v-else :size="20" />
    </span>
  </button>
</template>
