import api from '@/services/api'
import type { CreateTransactionPayload } from '@/types/transaction'

// Interface
interface TransactionListResponse {
  success: boolean
  message: string
  data: {
    id: number
  }[]
}

// Exported Functions
export async function createTransaction(
  payload: CreateTransactionPayload,
) {
  const { receiptFile, ...transactionData } = payload

  const response = await api.post('/transactions', transactionData)

  return response.data
}

export async function getTransactions() {
  const response = await api.get<TransactionListResponse>(
    '/transactions',
  )

  return response.data.data
}