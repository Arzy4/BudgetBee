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
  receiptUrl: string | null;
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

export interface UpdateTransactionPayload {
  title?: string
  amount?: number
  type?: 'INCOME' | 'EXPENSE'
  categoryId?: number
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'E_WALLET' | 'CARD'
  description?: string
  date?: string
}

interface TransactionResponse {
  message: string
  data: ApiTransaction
}

// Exported Functions
/* Create Transaction */
export async function createTransaction(
  payload: CreateTransactionPayload,
) {
  const { receiptFile, ...transactionData } = payload

  const response = await api.post('/transactions', transactionData)

  return response.data
}


/* Get Transaction */
export async function getTransactions() {
  const response = await api.get<TransactionListResponse>(
    '/transactions',
  )

  return response.data.data
}

/* Get Transaction By ID */
export async function getTransactionById(
  id: number,
): Promise<ApiTransaction> {
  const response = await api.get<TransactionResponse>(
    `/transactions/${id}`,
  )

  return response.data.data
}

/* Update Transaction By ID */
export async function updateTransaction(
  id: number,
  payload: UpdateTransactionPayload,
): Promise<ApiTransaction> {
  const response = await api.patch<TransactionResponse>(
    `/transactions/${id}`,
    payload,
  )

  return response.data.data
}

/* Delete Transaction */
export async function deleteTransaction(
  id: number,
): Promise<ApiTransaction> {
  const response = await api.delete<TransactionResponse>(
    `/transactions/${id}`,
  )

  return response.data.data
}

/* Update Transaction Receipt */
export async function updateTransactionReceipt(
  id: number,
  file: File,
): Promise<ApiTransaction> {
  const formData = new FormData()

  formData.append('receipt', file, file.name)

  const response = await api.patch<TransactionResponse>(
    `/transactions/${id}/receipt`,
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    },
  )

  return response.data.data
}