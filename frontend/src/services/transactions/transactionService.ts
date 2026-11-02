import api from '@/services/api'
import type { CreateTransactionPayload } from '@/types/transaction'

// Interface
export interface ApiTransaction {
  id: number
  title: string
  description: string | null
  amount: string
  type: 'INCOME' | 'EXPENSE'
  paymentMethod: string
  date: string
  receiptKey: string | null
  categoryId: number
  createdAt: string
  updatedAt: string
  category: {
    id: number
    name: string
    type: 'INCOME' | 'EXPENSE'
  }
}

interface TransactionListResponse {
  message: string
  data: ApiTransaction[]
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