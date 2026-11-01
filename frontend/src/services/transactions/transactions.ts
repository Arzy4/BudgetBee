import api from '@/services/api'
import type {
  Transaction,
  GetTransactionsResponse,
} from '@/types/transaction'

// Retrieve all transactions belonging to the authenticated user
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get<GetTransactionsResponse>(
    '/transactions',
  )

  return response.data.data
}
