import api from '@/services/api'

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const response = await api.patch('/users/me/password', {
    currentPassword,
    newPassword,
  })

  return response.data
}