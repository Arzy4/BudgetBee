import api from '@/services/api'

import type {
  MonthlyBudgets,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetMutationResult,
  DeleteBudgetResult,
} from '@/types/budget'

// API Response Interface
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Get Monthly Budgets
export async function getBudgets(month: number, year: number): Promise<MonthlyBudgets> {
  const response = await api.get<ApiResponse<MonthlyBudgets>>('/budgets', {
    params: { month, year },
  })

  return response.data.data
}

// Create Budget
export async function createBudget(payload: CreateBudgetPayload) {
  const response = await api.post<ApiResponse<BudgetMutationResult>>('/budgets', payload)

  return response.data
}

// Update Budget
export async function updateBudget(id: number, payload: UpdateBudgetPayload) {
  const response = await api.patch<ApiResponse<BudgetMutationResult>>(`/budgets/${id}`, payload)

  return response.data
}

// Delete Budget
export async function deleteBudget(id: number) {
  const response = await api.delete<ApiResponse<DeleteBudgetResult>>(`/budgets/${id}`)

  return response.data
}
