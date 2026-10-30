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
    class="flex h-[60px] w-full items-center rounded-full bg-[#F8C94F] px-2 font-semibold text-[#24211D] shadow-lg shadow-[#E6BD58]/20 transition-all duration-200 hover:bg-[#F5C13D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span class="flex-1 text-center">
      <slot>Continue</slot>
    </span>

    <span class="absolute right-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFE6A2]">
      <LoaderCircle v-if="loading" :size="21" class="animate-spin" />

      <ArrowRight v-else :size="21" />
    </span>
  </button>
</template>
