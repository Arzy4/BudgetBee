import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { getAllTransactions } from '@/services/transactions/transactions'
import type { Transaction } from '@/types/transaction'

export const useTransactionStore = defineStore('transactions', () => {
  // State
  // Shared selected month for the dashboard
  const now = new Date()

  const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  const monthlyTransactions = computed(() => {
    return transactions.value.filter((transaction) => {
      const transactionMonth = transaction.date.slice(0, 7)

      return transactionMonth === selectedMonth.value
    })
  })

  // Fetch all transactions belonging to the authenticated user
  async function fetchTransactions() {
    if (isLoading.value) return

    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await getAllTransactions()

      transactions.value = result
    } catch (error: unknown) {
      transactions.value = []

      if (axios.isAxiosError(error)) {
        errorMessage.value = error.response?.data?.message ?? 'Unable to retrieve transactions.'
      } else {
        errorMessage.value = 'Something went wrong while retrieving transactions.'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Clear transactions when the user logs out
  function clearTransactions() {
    transactions.value = []
    errorMessage.value = ''
    isLoading.value = false
  }

  return {
    transactions,
    isLoading,
    errorMessage,
    fetchTransactions,
    clearTransactions,
    monthlyTransactions,
    selectedMonth,
  }
})
