// ===== Business Clients API =====

import { apiClient } from "../client"
import type {
  Client,
  LegalType,
  CreateClientRequest,
  UpdateClientRequest,
  BusinessPaginatedResponse,
  BusinessApiResponse,
  ClientStatus,
} from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/clients"

/**
 * Get clients with optional filtering
 */
export async function getClients(
  page = 0,
  size = 20,
  status?: ClientStatus,
  search?: string,
  legalTypeId?: string,
): Promise<BusinessPaginatedResponse<Client>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (status) params.append("status", status)
  if (search) params.append("search", search)
  if (legalTypeId) params.append("legalTypeId", legalTypeId)

   return businessApiClient<BusinessPaginatedResponse<Client>>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client> {
  return businessApiClient<Client>(`${BASE_PATH}/${id}`)
}

/**
 * Create a new client
 */
export async function createClient(data: CreateClientRequest): Promise<BusinessApiResponse<Client>> {
  return apiClient<BusinessApiResponse<Client>>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update a client
 */
export async function updateClient(id: string, data: UpdateClientRequest): Promise<BusinessApiResponse<Client>> {
  return apiClient<BusinessApiResponse<Client>>(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Delete (soft delete/deactivate) a client
 */
export async function deleteClient(id: string): Promise<BusinessApiResponse<null>> {
  return apiClient<BusinessApiResponse<null>>(`${BASE_PATH}/${id}`, {
    method: "DELETE",
  })
}

/**
 * Get all legal types
 */
export async function getLegalTypes(): Promise<LegalType[]> {
  return businessApiClient<LegalType[]>(`${BASE_PATH}/legal-types`)
}

/**
 * Get client statistics
 */
export async function getClientStats(): Promise<{
  total: number
  active: number
  inactive: number
  suspended: number
}> {
return businessApiClient(`${BASE_PATH}/stats`)
}
