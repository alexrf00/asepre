// ===== FILE: lib/api/users.ts =====
// Updated users API with restore and deleted users support

import { apiClient } from "./client"
import type { ApiResponse, User, UpdateUserRequest, PaginatedResponse, AccountStatus } from "@/types"

/**
 * Get users with optional filtering by status
 * Soft-deleted users are automatically excluded by the backend
 */
export async function getUsers(
  page = 0,
  size = 10,
  status?: AccountStatus
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (status) {
    params.append("status", status)
  }

  return apiClient<PaginatedResponse<User>>(`/api/v1/users?${params.toString()}`)
}

/**
 * Get only soft-deleted users (SUPERADMIN only)
 */
export async function getDeletedUsers(
  page = 0,
  size = 10
): Promise<PaginatedResponse<User>> {
  return apiClient<PaginatedResponse<User>>(`/api/v1/users/deleted?page=${page}&size=${size}`)
}

/**
 * Restore a soft-deleted user (SUPERADMIN only)
 */
export async function restoreUser(id: string): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/users/deleted/${id}/restore`, {
    method: "POST",
  })
}

/**
 * Permanently delete a user (SUPERADMIN only)
 * User must already be soft-deleted first
 */
export async function permanentlyDeleteUser(id: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/users/deleted/${id}/permanent`, {
    method: "DELETE",
  })
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  return apiClient<User>(`/api/v1/users/${id}`)
}

/**
 * Update user
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Soft delete user
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/users/${id}`, {
    method: "DELETE",
  })
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/api/v1/users/me")
}

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<{
  permissions: string[]
}> {
  return apiClient<{ permissions: string[] }>("/api/v1/users/me/permissions")
}