// ===== FILE: lib/api/users.ts =====
// Fixed: Proper ApiResponse wrapper handling for all endpoints

import { apiClient } from "./client"
import type { ApiResponse, User, UpdateUserRequest, PaginatedResponse, AccountStatus } from "@/types"

// Helper type for wrapped paginated responses from backend
interface WrappedPaginatedResponse<T> {
  success: boolean
  message?: string
  data: PaginatedResponse<T>
}

// Default empty pagination response for error cases
const emptyPaginatedResponse = <T>(): PaginatedResponse<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 10,
  number: 0,
  first: true,
  last: true,
  empty: true,
})

/**
 * Get users with optional filtering by status
 * Backend returns: ApiResponse<Page<UserDto>>
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

  const response = await apiClient<WrappedPaginatedResponse<User>>(`/api/v1/users?${params.toString()}`)
  return response.data ?? emptyPaginatedResponse<User>()
}

/**
 * Get only soft-deleted users (SUPERADMIN only)
 * Backend returns: ApiResponse<Page<UserDto>>
 */
export async function getDeletedUsers(
  page = 0,
  size = 10
): Promise<PaginatedResponse<User>> {
  const response = await apiClient<WrappedPaginatedResponse<User>>(`/api/v1/users/deleted?page=${page}&size=${size}`)
  return response.data ?? emptyPaginatedResponse<User>()
}

/**
 * Restore a soft-deleted user (SUPERADMIN only)
 * Backend returns: ApiResponse<UserDto>
 */
export async function restoreUser(id: string): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/users/deleted/${id}/restore`, {
    method: "POST",
  })
}

/**
 * Permanently delete a user (SUPERADMIN only)
 * Backend returns: ApiResponse<Void>
 * User must already be soft-deleted first
 */
export async function permanentlyDeleteUser(id: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/users/deleted/${id}/permanent`, {
    method: "DELETE",
  })
}

/**
 * Get user by ID
 * Backend returns: ApiResponse<UserDto>
 */
export async function getUserById(id: string): Promise<User> {
  const response = await apiClient<ApiResponse<User>>(`/api/v1/users/${id}`)
  if (!response.data) {
    throw new Error("User not found")
  }
  return response.data
}

/**
 * Update user
 * Backend returns: ApiResponse<UserDto>
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Soft delete user
 * Backend returns: ApiResponse<Void>
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/users/${id}`, {
    method: "DELETE",
  })
}

/**
 * Get current authenticated user
 * Backend returns: ApiResponse<UserDto>
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient<ApiResponse<User>>("/api/v1/users/me")
  if (!response.data) {
    throw new Error("Failed to get current user")
  }
  return response.data
}

/**
 * Get current user's permissions
 * Backend returns: ApiResponse<Set<String>>
 */
export async function getCurrentUserPermissions(): Promise<string[]> {
  const response = await apiClient<ApiResponse<string[]>>("/api/v1/users/me/permissions")
  return response.data ?? []
}