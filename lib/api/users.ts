import { apiClient } from "./client"
import type { ApiResponse, User, UpdateUserRequest, PaginatedResponse } from "@/types"

export async function getUsers(page = 0, size = 10): Promise<PaginatedResponse<User>> {
  return apiClient<PaginatedResponse<User>>(`/api/v1/users?page=${page}&size=${size}`)
}

export async function getUserById(id: number): Promise<User> {
  return apiClient<User>(`/api/v1/users/${id}`)
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return apiClient<ApiResponse<User>>(`/api/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: number): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/users/${id}`, {
    method: "DELETE",
  })
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>("/api/v1/users/me")
}

export async function getCurrentUserPermissions(): Promise<{
  permissions: string[]
}> {
  return apiClient<{ permissions: string[] }>("/api/v1/users/me/permissions")
}
