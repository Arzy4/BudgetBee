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
    class="relative h-dvh w-full overflow-hidden px-4 pt-8 phone:px-6 phone:pt-10 pb-[calc(80px+env(safe-area-inset-bottom)+16px)] phone:pb-[calc(80px+env(safe-area-inset-bottom)+20px)]"
  >
    <div
      class="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-4 phone:gap-5"
    >
      <!-- Financial Overview -->
      <div class="min-h-0 flex-1">
        <FinancialOverview />
      </div>

      <!-- Recent Transactions -->
      <div class="h-[200px] phone:h-[210px] shrink-0 ">
        <RecentTransactions />
      </div>
    </div>
  </main>
</template>
