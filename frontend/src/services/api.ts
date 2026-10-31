import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track whether a request has already been retried
interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Share one refresh request across concurrent 401 responses
let refreshPromise: Promise<string> | null = null

// Attach the current access token to API requests
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()

  if (authStore.accessToken) {
    config.headers.set(
      'Authorization',
      `Bearer ${authStore.accessToken}`,
    )
  }

  return config
})

// Handle expired access tokens
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url ?? ''

    // Never refresh recursively for authentication endpoints
    const isAuthEndpoint = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
    ].some((path) => requestUrl.includes(path))

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const authStore = useAuthStore()

    try {
      if (!refreshPromise) {
        refreshPromise = api
          .post(
            '/auth/refresh',
            {},
            { withCredentials: true },
          )
          .then((response) => {
            const newAccessToken =
              response.data.data.accessToken as string

            authStore.accessToken = newAccessToken

            return newAccessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise

      originalRequest.headers =
        AxiosHeaders.from(originalRequest.headers)

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${newAccessToken}`,
      )

      return api(originalRequest)
    } catch (refreshError) {
      authStore.clearAuth()
      return Promise.reject(refreshError)
    }
  },
)

export default api
