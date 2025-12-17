// ===== FILE: lib\api\business\services.ts =====

// ===== Business Services API =====

import { apiClient } from "./client"
import { businessApiClient } from "./client"
import type {
  ServiceCatalog,
  BillingUnit,
  CreateServiceRequest,
  UpdateServiceRequest,
  BusinessApiResponse,
  BusinessPaginatedResponse,
} from "@/lib/types/business"

const BASE_PATH = "/api/v1/business/services"

/**
 * Paged services (Spring Page-like) response.
 * Use this when you later add server-side pagination to the UI.
 */
export async function listServicesPage(options: {
  activeOnly?: boolean
  page?: number
  size?: number
} = {}): Promise<BusinessPaginatedResponse<ServiceCatalog>> {
  const { activeOnly = true, page = 0, size = 1000 } = options

  // IMPORTANT: always send activeOnly (when omitted, many backends default to true)
  const params = new URLSearchParams({
    activeOnly: String(activeOnly),
    page: String(page),
    size: String(size),
  })

  return businessApiClient<BusinessPaginatedResponse<ServiceCatalog>>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get all services (returns array for UI consumption).
 */
export async function getServices(activeOnly = true): Promise<ServiceCatalog[]> {
  const page = await listServicesPage({ activeOnly, page: 0, size: 1000 })
  return Array.isArray(page?.content) ? page.content : []
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
