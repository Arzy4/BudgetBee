<script setup lang="ts">
import { ref, computed } from 'vue'
import { Mail, LockKeyhole, UserRound, Eye, EyeOff } from 'lucide-vue-next'

type InputType = 'text' | 'email' | 'password'
type InputIcon = 'email' | 'password' | 'user'

const props = withDefaults(
  defineProps<{
    modelValue: string
    type?: InputType
    placeholder: string
    icon?: InputIcon
    autocomplete?: string
    required?: boolean
  }>(),
  {
    type: 'text',
    icon: 'user',
    autocomplete: 'off',
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type !== 'password') return props.type
  return showPassword.value ? 'text' : 'password'
})

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div
    class="flex h-[58px] items-center gap-4 rounded-full border border-[#EEE7DC] bg-white/95 px-5 shadow-sm transition-colors focus-within:border-[#F7C64B]"
  >
    <!-- Input icon -->
    <Mail v-if="icon === 'email'" :size="20" class="shrink-0 text-[#24211D]" />

    <LockKeyhole v-else-if="icon === 'password'" :size="20" class="shrink-0 text-[#24211D]" />

    <UserRound v-else :size="20" class="shrink-0 text-[#24211D]" />

    <!-- Input field -->
    <input
      :value="modelValue"
      :type="inputType"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      @input="updateValue"
      class="min-w-0 flex-1 bg-transparent text-sm text-[#24211D] outline-none placeholder:text-[#AAA49C]"
    />

    <!-- Password visibility -->
    <button
      v-if="type === 'password'"
      type="button"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      :aria-pressed="showPassword"
      @click="showPassword = !showPassword"
      class="flex shrink-0 items-center justify-center text-[#8D857B]"
    >
      <EyeOff v-if="showPassword" :size="19" />
      <Eye v-else :size="19" />
    </button>
  </div>
</template>
