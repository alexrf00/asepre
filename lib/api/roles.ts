import { apiClient } from "./client"
import type { ApiResponse, Role, CreateRoleRequest, UpdateRoleRequest, AssignRoleRequest } from "@/types"

export async function getRoles(): Promise<ApiResponse<Role[]>> {
  return apiClient<ApiResponse<Role[]>>("/api/v1/rbac/roles")
}

export async function getRoleById(id: string): Promise<ApiResponse<Role>> {
  return apiClient<ApiResponse<Role>>(`/api/v1/rbac/roles/${id}`)
}

export async function createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
  return apiClient<ApiResponse<Role>>("/api/v1/rbac/roles", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateRole(id: string, data: UpdateRoleRequest): Promise<ApiResponse<Role>> {
  return apiClient<ApiResponse<Role>>(`/api/v1/rbac/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteRole(id: string): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(`/api/v1/rbac/roles/${id}`, {
    method: "DELETE",
  })
}

export async function assignRole(data: AssignRoleRequest): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/rbac/roles/assign", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function revokeRole(data: AssignRoleRequest): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>("/api/v1/rbac/roles/revoke", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getUserRoles(userId: string): Promise<ApiResponse<string[]>> {
  return apiClient<ApiResponse<string[]>>(`/api/v1/rbac/roles/user/${userId}`)
}

export async function getRolePermissions(roleId: string): Promise<ApiResponse<string[]>> {
  return apiClient<ApiResponse<string[]>>(`/api/v1/rbac/roles/${roleId}/permissions`)
}
