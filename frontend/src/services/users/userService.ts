
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
  profileImage: string | null
  createdAt: string
}

interface UpdateProfileResponse {
  success: boolean
  message: string
  data: UpdatedUser
}

interface UploadAvatarResponse {
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

interface UploadAvatarResponse {
  success: boolean
  message: string
  data: UpdatedUser
}

export async function uploadAvatar(
  file: File,
): Promise<UpdatedUser> {
  const formData = new FormData()

  formData.append('avatar', file)

  const response = await api.patch<UploadAvatarResponse>(
    '/users/me/avatar',
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    },
  )

  return response.data.data
}
