import api from '@/services/api'

export async function registerDeviceToken(token: string) {
  const response = await api.post('/devices/register', {
    token,
  })

  return response.data
}

export async function unregisterDeviceToken(token: string) {
  const response = await api.delete('/devices/unregister', {
    data: { token },
  })

  return response.data
}