export type BudgetStatus =
  | 'ON_TRACK'
  | 'WARNING'
  | 'LIMIT_REACHED'
  | 'OVER_BUDGET'

export interface BudgetCategory {
  id: number
  name: string
}

export interface Budget {
  id: number
  category: BudgetCategory
  amount: string
  spent: string
  remaining: string
  percentageUsed: number
  status: BudgetStatus
}

export interface BudgetSummary {
  totalBudget: string
  totalSpent: string
  totalRemaining: string
  percentageUsed: number
}

export interface MonthlyBudgets {
  month: number
  year: number
  summary: BudgetSummary
  budgets: Budget[]
}

export interface CreateBudgetPayload {
  categoryId: number
  amount: number
  month?: number
  year?: number
}

export interface UpdateBudgetPayload {
  categoryId?: number
  amount?: number
}

export interface BudgetMutationResult {
  id: number
  categoryId: number
  amount: string
  month: number
  year: number
  createdAt?: string
  updatedAt?: string
}

export interface DeleteBudgetResult {
  id: number
  month: number
  year: number
}
