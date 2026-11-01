import api from "@/services/api";

export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

interface GetCategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<GetCategoriesResponse>(
    "/categories",
  );

  return response.data.data;
}

export async function createCategory(data: {
  name: string
  type: CategoryType
}) {
  const response = await api.post('/categories', data)
  return response.data
}

export async function updateCategory(
  id: number,
  data: { name?: string; type?: CategoryType },
) {
  const response = await api.patch(`/categories/${id}`, data)
  return response.data
}

export async function deleteCategory(id: number) {
  const response = await api.delete(`/categories/${id}`)
  return response.data
}