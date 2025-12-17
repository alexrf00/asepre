// ===== Business Services API =====

import { apiClient } from "../client"
import type {
  ServiceCatalog,
  BillingUnit,
  CreateServiceRequest,
  UpdateServiceRequest,
  BusinessApiResponse,
} from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/services"

/**
 * Get all services
 */
export async function getServices(activeOnly = true): Promise<ServiceCatalog[]> {
  const params = new URLSearchParams()
  if (activeOnly) params.append("activeOnly", "true")

  return businessApiClient<ServiceCatalog[]>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get service by ID
 */
export async function getServiceById(id: string): Promise<ServiceCatalog> {
  return businessApiClient<ServiceCatalog>(`${BASE_PATH}/${id}`)
}

/**
 * Create a new service
 */
export async function createService(data: CreateServiceRequest): Promise<BusinessApiResponse<ServiceCatalog>> {
  return apiClient<BusinessApiResponse<ServiceCatalog>>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update a service
 */
export async function updateService(
  id: string,
  data: UpdateServiceRequest,
): Promise<BusinessApiResponse<ServiceCatalog>> {
  return apiClient<BusinessApiResponse<ServiceCatalog>>(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Delete (deactivate) a service
 */
export async function deleteService(id: string): Promise<BusinessApiResponse<null>> {
  return apiClient<BusinessApiResponse<null>>(`${BASE_PATH}/${id}`, {
    method: "DELETE",
  })
}

/**
 * Get all billing units
 */
export async function getBillingUnits(): Promise<BillingUnit[]> {
  return businessApiClient<BillingUnit[]>(`${BASE_PATH}/billing-units`)
}
