// ===== FILE: lib/api/admin.ts =====
// Admin API for invite management and user approval

import { apiClient } from "./client"
import type {
  ApiResponse,
  PaginatedResponse,
  Invite,
  CreateInviteRequest,
  User,
  ApproveUserRequest,
  RejectUserRequest,
  SuspendUserRequest,
} from "@/types"

// ============================================
// Invite Management
// ============================================

/**
 * Create a new invite
 * POST /api/v1/admin/invites
 */
export async function createInvite(data: CreateInviteRequest): Promise<ApiResponse<Invite>> {
  return apiClient<ApiResponse<Invite>>("/api/v1/admin/invites", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Get paginated invites with optional status filter
 * GET /api/v1/admin/invites
 */
export async function getInvites(
  page = 0, 
  size = 10,
  status?: string
): Promise<PaginatedResponse<Invite>> {
  let url = `/api/v1/admin/invites?page=${page}&size=${size}`
  if (status) {
    url += `&status=${status}`
  }
  const response = await apiClient<WrappedPaginatedResponse<Invite>>(url)
  // Backend wraps the response in { success, data }, so extract data
  return response.data
}

/**
 * Get a single invite by ID
 * GET /api/v1/admin/invites/{id}
 */
export async function getInviteById(id: number): Promise<Invite> {
  return apiClient<Invite>(`/api/v1/admin/invites/${id}`)
}

/**
 * Revoke an invite
 * DELETE /api/v1/admin/invites/{id}
 */
export async function revokeInvite(id: number): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/admin/invites/${id}`, {
    method: "DELETE",
  })
}

// ============================================
// User Approval Management
// ============================================

// Helper type for wrapped paginated responses from backend
interface WrappedPaginatedResponse<T> {
  success: boolean
  data: PaginatedResponse<T>
}

/**
 * Get users pending approval
 * GET /api/v1/admin/users/pending-approval
 */
export async function getPendingApprovalUsers(
  page = 0,
  size = 10
): Promise<PaginatedResponse<User>> {
  const response = await apiClient<WrappedPaginatedResponse<User>>(
    `/api/v1/admin/users/pending-approval?page=${page}&size=${size}`
  )
  // Backend wraps the response in { success, data }, so extract data
  return response.data
}

/**
 * Get users pending verification
 * GET /api/v1/admin/users/pending-verification
 */
export async function getPendingVerificationUsers(
  page = 0,
  size = 10
): Promise<PaginatedResponse<User>> {
  const response = await apiClient<WrappedPaginatedResponse<User>>(
    `/api/v1/admin/users/pending-verification?page=${page}&size=${size}`
  )
  // Backend wraps the response in { success, data }, so extract data
  return response.data
}

/**
 * Get suspended users
 * GET /api/v1/admin/users/suspended
 */
export async function getSuspendedUsers(
  page = 0,
  size = 10
): Promise<PaginatedResponse<User>> {
  const response = await apiClient<WrappedPaginatedResponse<User>>(
    `/api/v1/admin/users/suspended?page=${page}&size=${size}`
  )
  // Backend wraps the response in { success, data }, so extract data
  return response.data
}

/**
 * Approve a user
 * POST /api/v1/admin/users/{id}/approve
 */
export async function approveUser(
  userId: string, 
  data?: ApproveUserRequest
): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/admin/users/${userId}/approve`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  })
}

/**
 * Reject a user
 * POST /api/v1/admin/users/{id}/reject
 */
export async function rejectUser(
  userId: string, 
  data: RejectUserRequest
): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/admin/users/${userId}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Suspend a user
 * POST /api/v1/admin/users/{id}/suspend
 */
export async function suspendUser(
  userId: string, 
  data: SuspendUserRequest
): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/admin/users/${userId}/suspend`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Reactivate a suspended user
 * POST /api/v1/admin/users/{id}/reactivate
 */
export async function reactivateUser(userId: string): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/admin/users/${userId}/reactivate`, {
    method: "POST",
  })
}
