// ===== Business Pricing API =====

import { apiClient } from "../client"
import type {
  GlobalServicePrice,
  ClientServicePrice,
  ResolvedPrice,
  SetGlobalPriceRequest,
  SetClientPriceRequest,
  BusinessApiResponse,
} from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/pricing"

// ===== Global Prices =====

/**
 * Set global price for a service
 */
export async function setGlobalPrice(data: SetGlobalPriceRequest): Promise<BusinessApiResponse<GlobalServicePrice>> {
  return apiClient<BusinessApiResponse<GlobalServicePrice>>(`${BASE_PATH}/global`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Get current global price for a service
 */
export async function getGlobalPrice(serviceId: string): Promise<GlobalServicePrice | null> {
  try {
    return await businessApiClient<GlobalServicePrice>(`${BASE_PATH}/global/${serviceId}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (msg.toLowerCase().includes("no active global price found")) return null
    throw err
  }
}
/**
 * Get global price history for a service
 */
export async function getGlobalPriceHistory(serviceId: string): Promise<GlobalServicePrice[]> {
  try {
    return await businessApiClient<GlobalServicePrice[]>(`${BASE_PATH}/global/${serviceId}/history`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    // treat "no history" as empty (adjust to your backend message if different)
    if (msg.toLowerCase().includes("no") && msg.toLowerCase().includes("history")) return []
    throw err
  }
}

/**
 * Get all current global prices
 */
export async function getAllGlobalPrices(): Promise<GlobalServicePrice[]> {
  return businessApiClient<GlobalServicePrice[]>(`${BASE_PATH}/global`)
}

// ===== Client Prices =====

/**
 * Set client-specific price for a service
 */
export async function setClientPrice(data: SetClientPriceRequest): Promise<BusinessApiResponse<ClientServicePrice>> {
  return apiClient<BusinessApiResponse<ClientServicePrice>>(`${BASE_PATH}/client`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Get client-specific price for a service
 */

export async function getClientPrice(serviceId: string, clientId: string): Promise<ClientServicePrice | null> {
  try {
    return await businessApiClient<ClientServicePrice>(`${BASE_PATH}/client/${serviceId}/${clientId}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (msg.toLowerCase().includes("no active") && msg.toLowerCase().includes("price")) return null
    throw err
  }
}

/**
 * Get all client-specific prices for a client
 */
export async function getClientPrices(clientId: string): Promise<ClientServicePrice[]> {
 return businessApiClient<ClientServicePrice[]>(`${BASE_PATH}/client/${clientId}/all`)
}

/**
 * Delete client-specific price
 */
export async function deleteClientPrice(id: string): Promise<BusinessApiResponse<null>> {
  return apiClient<BusinessApiResponse<null>>(`${BASE_PATH}/client/${id}`, {
    method: "DELETE",
  })
}

// ===== Price Resolution =====

/**
 * Resolve the effective price for a service and client
 */
export async function resolvePrice(serviceId: string, clientId: string): Promise<ResolvedPrice> {
  const params = new URLSearchParams({ serviceId, clientId })
  return businessApiClient<ResolvedPrice>(`${BASE_PATH}/resolve?${params.toString()}`)
}
