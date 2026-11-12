<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="w-full rounded-2xl border border-amber-200 bg-[#FFF9E9] p-4 shadow-lg" role="status">
    <div class="flex items-start gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200">
        <span class="text-xl">🔔</span>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-amber-700">BUDGETBEE NOTIFICATION</p>

        <h3 class="mt-1 font-semibold text-[#302819]">
          {{ title }}
        </h3>

        <p class="mt-1 text-sm text-[#5B5040]">
          {{ message }}
        </p>
      </div>

      <button
        type="button"
        class="text-xl text-[#7A6A4B]"
        aria-label="Dismiss notification"
        @click="emit('close')"
      >
        ×
      </button>
    </div>
  </div>
</template>
