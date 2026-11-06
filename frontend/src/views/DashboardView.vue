<script setup lang="ts">
import FinancialOverview from '@/components/dashboard/FinancialOverview.vue'
import RecentTransactions from '@/components/dashboard/RecentTransactions.vue'
import { onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transactions'

const transactionStore = useTransactionStore()

onMounted(() => {
  void transactionStore.fetchTransactions()
})
</script>

<template>
  <main
    class="relative min-h-screen w-full px-5 py-9"
  >
    <!-- Dashboard Content -->
    <div class="relative z-10 mx-auto max-w-3xl space-y-5">
      <!-- Financial Overview -->
      <FinancialOverview />

      <!-- Recent Transactions -->
      <RecentTransactions />
    </div>
  </main>
</template>
