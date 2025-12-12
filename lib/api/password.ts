import { apiClient } from "./client"
import type { ApiResponse } from "@/types"

// ============================================
// Types
// ============================================

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ValidateResetTokenResponse {
  valid: boolean
}

// ============================================
// Password Reset Flow (Unauthenticated)
// ============================================

/**
 * Initiate password reset - sends email with reset link
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email } satisfies ForgotPasswordRequest),
  })
}

/**
 * Validate reset token before showing reset form
 * GET /api/v1/auth/reset-password?token=xxx
 */
export async function validateResetToken(token: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`)
}

/**
 * Reset password using token from email
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword } satisfies ResetPasswordRequest),
  })
}

// ============================================
// Change Password (Authenticated)
// ============================================

/**
 * Change password for authenticated user
 * POST /api/v1/users/me/password
 * 
 * NOTE: This endpoint needs to be implemented in the backend.
 * See the companion Java code below.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/users/me/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword } satisfies ChangePasswordRequest),
  })
}

// ============================================
// Helper function for profile page
// ============================================

/**
 * Wrapper that handles the password change with proper error handling
 */
export async function handlePasswordChange(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await changePassword(currentPassword, newPassword)
    return {
      success: response.success,
      message: response.message || "Password updated successfully",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update password"
    return {
      success: false,
      message,
    }
  }
}