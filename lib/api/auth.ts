import { apiClient, setTokens, clearTokens } from "./client"
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types"

export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
  const response = await apiClient<ApiResponse<AuthResponse>>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  if (response.success && response.data) {
    setTokens(response.data.accessToken, response.data.refreshToken)
  }

  return response
}

export async function register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
  const response = await apiClient<ApiResponse<AuthResponse>>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  if (response.success && response.data) {
    setTokens(response.data.accessToken, response.data.refreshToken)
  }

  return response
}

export function logout() {
  clearTokens()
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function validateResetToken(token: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/auth/reset-password?token=${token}`)
}

export async function verifyEmail(token: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/auth/verify-email?token=${token}`)
}

export async function resendVerification(email: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}
