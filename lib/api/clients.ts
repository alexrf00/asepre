import { apiClient } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type {
  Client,
  ClientStats,
  ClientStatus,
  CreateClientRequest,
  LegalType,
  UpdateClientRequest,
} from "@/types/business"

const BASE_URL = "/api/v1/business/clients"

export async function createClient(data: CreateClientRequest): Promise<ApiResponse<Client>> {
  return apiClient<ApiResponse<Client>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getClient(id: string): Promise<ApiResponse<Client>> {
  return apiClient<ApiResponse<Client>>(`${BASE_URL}/${id}`)
}

export async function getAllClients(
  page?: number,
  size?: number,
  status?: ClientStatus,
  search?: string,
): Promise<ApiResponse<PaginatedResponse<Client>>> {
  const params = new URLSearchParams()
  if (page !== undefined) params.append("page", page.toString())
  if (size !== undefined) params.append("size", size.toString())
  if (status) params.append("status", status)
  if (search) params.append("search", search)

  const queryString = params.toString()
  return apiClient<ApiResponse<PaginatedResponse<Client>>>(`${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

export async function getClientStats(): Promise<ApiResponse<ClientStats>> {
  return apiClient<ApiResponse<ClientStats>>(`${BASE_URL}/stats`)
}

export async function getActiveClients(): Promise<ApiResponse<Client[]>> {
  return apiClient<ApiResponse<Client[]>>(`${BASE_URL}/active`)
}

export async function updateClient(id: string, data: UpdateClientRequest): Promise<ApiResponse<Client>> {
  return apiClient<ApiResponse<Client>>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteClient(id: string): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  })
}

export async function getLegalTypes(): Promise<ApiResponse<LegalType[]>> {
  return apiClient<ApiResponse<LegalType[]>>(`${BASE_URL}/legal-types`)
}
