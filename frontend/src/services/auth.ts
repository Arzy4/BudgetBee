import api from './api'
import axios from 'axios'

export interface AuthUser {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  createdAt?: string
  profileImage: string | null
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    user: AuthUser
  }
}

export type PasswordResetRequestResponse = {
  success: boolean
  message: string
  requestId: string
}

export async function login(email: string, password: string): Promise<LoginResponse['data']> {
  const response = await api.post<LoginResponse>(
    '/auth/login',
    { email, password },
    { withCredentials: true },
  )

  return response.data.data
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  const response = await api.get('/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.data.data
}

export interface RefreshTokenResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
  }
}

export async function refreshAccessToken(): Promise<RefreshTokenResponse['data']> {
  const response = await api.post<RefreshTokenResponse>(
    '/auth/refresh',
    {},
    { withCredentials: true },
  )

  return response.data.data
}

export async function logout(): Promise<void> {
  await api.post(
    '/auth/logout',
    {},
    { withCredentials: true },
  )
}

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResponse> {
  const response = await api.post<PasswordResetRequestResponse>(
    '/auth/password-reset/request',
    { email },
  )

  return response.data
}