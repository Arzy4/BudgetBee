import api from '@/services/api.js'

export interface RequestPasswordResetResponse {
  success: boolean
  message: string
  requestId?: string
}

export interface VerifyPasswordResetResponse {
  success: boolean
  message: string
  resetToken: string
}

export interface ConfirmPasswordResetResponse {
  success: boolean
  message: string
}

export async function requestPasswordReset(
  email: string,
): Promise<RequestPasswordResetResponse> {
  const response = await api.post<RequestPasswordResetResponse>(
    '/auth/password-reset/request',
    { email },
  )

  return response.data
}

export async function verifyPasswordReset(
  requestId: string,
  code: string,
): Promise<VerifyPasswordResetResponse> {
  const response = await api.post<VerifyPasswordResetResponse>(
    '/auth/password-reset/verify',
    { requestId, code },
  )

  return response.data
}

export async function confirmPasswordReset(
  resetToken: string,
  newPassword: string,
): Promise<ConfirmPasswordResetResponse> {
  const response = await api.post<ConfirmPasswordResetResponse>(
    '/auth/password-reset/confirm',
    { resetToken, newPassword },
  )

  return response.data
}
