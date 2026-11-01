export type TransactionType = 'INCOME' | 'EXPENSE'

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'E_WALLET'
  | 'CARD'

export interface TransactionCategory {
  id: number
  name: string
  type: TransactionType
}

export interface Transaction {
  id: number
  title: string | null
  description: string | null
  amount: string
  type: TransactionType
  paymentMethod: PaymentMethod | null
  date: string
  receiptKey: string | null
  userId: number
  categoryId: number
  createdAt: string
  updatedAt: string
  category: TransactionCategory
}

export interface GetTransactionsResponse {
  message: string
  data: Transaction[]
}
