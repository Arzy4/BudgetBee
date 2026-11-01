import api from '@/services/api'
import type { CreateTransactionPayload } from '@/types/transaction'

export async function createTransaction(
  payload: CreateTransactionPayload,
) {
  const { receiptFile, ...transactionData } = payload

  const response = await api.post('/transactions', transactionData)

  return response.data
}