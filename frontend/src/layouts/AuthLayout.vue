<script setup lang="ts">
import AuthBackground from "@/components/auth/AuthBackground.vue";
</script>

<template>
  <main class="relative min-h-svh overflow-hidden bg-[#FFF9F0] text-[#24211D]">
    <AuthBackground />

    <div class="relative z-10">
      <slot />
    </div>
  </main>
</template>
