import { apiClient } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type { BillingUnit, CreateServiceRequest, ServiceCatalog, UpdateServiceRequest } from "@/types/business"

const BASE_URL = "/api/v1/business/services"

export async function createService(data: CreateServiceRequest): Promise<ApiResponse<ServiceCatalog>> {
  return apiClient<ApiResponse<ServiceCatalog>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getService(id: string): Promise<ApiResponse<ServiceCatalog>> {
  return apiClient<ApiResponse<ServiceCatalog>>(`${BASE_URL}/${id}`)
}

export async function getAllServices(
  page?: number,
  size?: number,
  search?: string,
  activeOnly?: boolean,
): Promise<ApiResponse<PaginatedResponse<ServiceCatalog>>> {
  const params = new URLSearchParams()
  if (page !== undefined) params.append("page", page.toString())
  if (size !== undefined) params.append("size", size.toString())
  if (search) params.append("search", search)
  if (activeOnly !== undefined) params.append("activeOnly", activeOnly.toString())

  const queryString = params.toString()
  return apiClient<ApiResponse<PaginatedResponse<ServiceCatalog>>>(`${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

export async function getActiveServices(): Promise<ApiResponse<ServiceCatalog[]>> {
  return apiClient<ApiResponse<ServiceCatalog[]>>(`${BASE_URL}/active`)
}

export async function updateService(id: string, data: UpdateServiceRequest): Promise<ApiResponse<ServiceCatalog>> {
  return apiClient<ApiResponse<ServiceCatalog>>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deactivateService(id: string): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  })
}

export async function getBillingUnits(): Promise<ApiResponse<BillingUnit[]>> {
  return apiClient<ApiResponse<BillingUnit[]>>(`${BASE_URL}/billing-units`)
}
