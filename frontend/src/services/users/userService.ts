
import api from '@/services/api'

export interface UpdateProfilePayload {
  fullName?: string
  phoneNumber?: string | null
}

export interface UpdatedUser {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  createdAt: string
}

interface UpdateProfileResponse {
  success: boolean
  message: string
  data: UpdatedUser
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UpdatedUser> {
  const response = await api.patch<UpdateProfileResponse>(
    '/users/me',
    payload,
  )

  return response.data.data
}
