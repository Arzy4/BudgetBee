import axios from 'axios'

let refreshPromise: Promise<string> | null = null

interface RefreshResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
  }
}

export async function getFreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((response) => response.data.data.accessToken)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
