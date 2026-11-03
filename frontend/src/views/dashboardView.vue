<script setup lang="ts">
import FinancialOverview from '@/components/dashboard/financialOverview.vue'
import RecentTransactions from '@/components/dashboard/recentTransactions.vue'
import BottomNavbar from '@/components/layout/bottomNavbar.vue'

import { onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transactions'

const transactionStore = useTransactionStore()

onMounted(() => {
  void transactionStore.fetchTransactions()
})
</script>

<template>
  <main
    class="relative min-h-screen w-full bg-[#FBF3E6] bg-cover bg-center bg-no-repeat px-5 py-9"
    style="background-image: url('/images/dashboard-bg.png')"
  >
    <!-- Dashboard Content -->
    <div class="relative z-10 mx-auto max-w-3xl space-y-5">
      <!-- Financial Overview -->
      <FinancialOverview />

      <!-- Recent Transactions -->
      <RecentTransactions />

      <!-- Bottom Navbar -->
      <BottomNavbar />
    </div>
  </main>
</template>
