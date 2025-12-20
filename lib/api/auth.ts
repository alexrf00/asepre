// ===== FILE: lib/api/auth.ts =====
// Updated auth API with invite-only registration support

import { apiClient, setTokens, clearTokens } from "./client"
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  RegistrationCheckResponse,
  VerifyEmailResponse,
  LoginErrorResponse,
  AccountStatus,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// ===== Registration Check =====

/**
 * Check if registration is available for an invite token
 * GET /api/v1/auth/registration/check?inviteToken={token}
 * Backend returns: ApiResponse<Map<String, Object>> with available, message, email
 */
export async function checkRegistration(inviteToken: string): Promise<RegistrationCheckResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/registration/check?inviteToken=${encodeURIComponent(inviteToken)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  )
  const data: ApiResponse<RegistrationCheckResponse> = await response.json()
  // Backend wraps response in ApiResponse, extract the data
  if (data.success && data.data) {
    return data.data
  }
  // Return a default error response if unsuccessful
  return {
    available: false,
    message: data.message || "Failed to check registration availability"
  }
}

// ===== Login =====

/**
 * Login with email and password
 * Returns tokens only for ACTIVE accounts
 * Returns 403 with accountNotActive for non-ACTIVE accounts
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse> | LoginErrorResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })

  const data = await response.json()

  // Handle 403 - account not active
  if (response.status === 403 && data.accountNotActive) {
    return data as LoginErrorResponse
  }

  // Successful login - store tokens
  if (data.success && data.data?.accessToken && data.data?.refreshToken) {
    setTokens(data.data.accessToken, data.data.refreshToken)
  }

  return data as ApiResponse<AuthResponse>
}

// ===== Registration =====

/**
 * Register a new user with invite token
 * POST /api/v1/auth/register
 * 
 * NOTE: Registration no longer returns tokens
 * User must verify email and wait for admin approval
 */
export async function register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })

  return response.json()
  // NOTE: We do NOT set tokens here because user cannot login until approved
}

// ===== Logout =====

export function logout() {
  clearTokens()
}

// ===== Email Verification =====

/**
 * Verify email with token
 * GET /api/v1/auth/verify-email?token={token}
 * 
 * Returns accountStatus which may be:
 * - ACTIVE (if auto-activate is enabled)
 * - PENDING_APPROVAL (waiting for admin)
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  )
  const data: ApiResponse<{ accountStatus?: AccountStatus }> = await response.json()
  
  return {
    success: data.success,
    message: data.message || (data.success ? "Email verified successfully" : "Verification failed"),
    accountStatus: data.data?.accountStatus
  }
}

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export async function resendVerification(email: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

// ===== Password Reset =====

export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  return response.json()
}

export async function validateResetToken(token: string): Promise<ApiResponse<null>> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  )
  return response.json()
}

export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  })
  return response.json()
}