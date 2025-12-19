import { apiClient } from "./client"
import type { ApiResponse } from "@/types"
import type { Price, ResolvedPrice, SetClientPriceRequest, SetGlobalPriceRequest } from "@/types/business"

const BASE_URL = "/api/v1/business/pricing"

export async function setGlobalPrice(data: SetGlobalPriceRequest): Promise<ApiResponse<Price>> {
  return apiClient<ApiResponse<Price>>(`${BASE_URL}/global`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getActiveGlobalPrices(): Promise<ApiResponse<Price[]>> {
  return apiClient<ApiResponse<Price[]>>(`${BASE_URL}/global`)
}

export async function getGlobalPrice(serviceId: string): Promise<ApiResponse<Price>> {
  return apiClient<ApiResponse<Price>>(`${BASE_URL}/global/${serviceId}`)
}

export async function getGlobalPriceHistory(serviceId: string): Promise<ApiResponse<Price[]>> {
  return apiClient<ApiResponse<Price[]>>(`${BASE_URL}/global/${serviceId}/history`)
}

export async function setClientPrice(data: SetClientPriceRequest): Promise<ApiResponse<Price>> {
  return apiClient<ApiResponse<Price>>(`${BASE_URL}/client`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getClientPrice(serviceId: string, clientId: string): Promise<ApiResponse<Price>> {
  return apiClient<ApiResponse<Price>>(`${BASE_URL}/client/${serviceId}/${clientId}`)
}

export async function getActiveClientPrices(clientId: string): Promise<ApiResponse<Price[]>> {
  return apiClient<ApiResponse<Price[]>>(`${BASE_URL}/client/${clientId}/all`)
}

export async function resolvePrice(serviceId: string, clientId: string): Promise<ApiResponse<ResolvedPrice>> {
  const params = new URLSearchParams({
    serviceId,
    clientId,
  })
  return apiClient<ApiResponse<ResolvedPrice>>(`${BASE_URL}/resolve?${params.toString()}`)
}
