import { apiClient } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type {
  ClientSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from "@/types/business"

const BASE_URL = "/api/business/subscriptions"

// =====================================================
// CLIENT SUBSCRIPTION API
// =====================================================

/**
 * Get all subscriptions with pagination
 */
export async function getSubscriptions(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PaginatedResponse<ClientSubscription>>> {
  return apiClient<ApiResponse<PaginatedResponse<ClientSubscription>>>(`${BASE_URL}?page=${page}&size=${size}`)
}

/**
 * Get subscription by ID
 */
export async function getSubscription(id: string): Promise<ApiResponse<ClientSubscription>> {
  return apiClient<ApiResponse<ClientSubscription>>(`${BASE_URL}/${id}`)
}

/**
 * Get subscriptions for a client
 */
export async function getSubscriptionsByClient(
  clientId: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PaginatedResponse<ClientSubscription>>> {
  return apiClient<ApiResponse<PaginatedResponse<ClientSubscription>>>(
    `${BASE_URL}/client/${clientId}?page=${page}&size=${size}`
  )
}

/**
 * Get active subscriptions for a client
 */
export async function getActiveSubscriptionsByClient(
  clientId: string
): Promise<ClientSubscription[]> {
  return apiClient<ClientSubscription[]>(`${BASE_URL}/client/${clientId}/active`)
}

/**
 * Get subscriptions needing billing for a client
 */
export async function getSubscriptionsNeedingBilling(
  clientId: string,
  asOfDate?: string
): Promise<ApiResponse<ClientSubscription[]>> {
  const params = asOfDate ? `?asOfDate=${asOfDate}` : ""
  return apiClient<ApiResponse<ClientSubscription[]>>(
    `${BASE_URL}/client/${clientId}/billing${params}`
  )
}

/**
 * Get all subscriptions due for billing
 */
export async function getDueForBilling(asOfDate?: string): Promise<ApiResponse<ClientSubscription[]>> {
  const params = asOfDate ? `?asOfDate=${asOfDate}` : ""
  return apiClient<ApiResponse<ClientSubscription[]>>(`${BASE_URL}/billing/due${params}`)
}

/**
 * Create a new subscription (Quick Service Assignment)
 */
export async function createSubscription(
  request: CreateSubscriptionRequest
): Promise<ApiResponse<ClientSubscription>> {
  return apiClient<ApiResponse<ClientSubscription>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(request),
  })
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  id: string,
  request: UpdateSubscriptionRequest
): Promise<ApiResponse<ClientSubscription>> {
  return apiClient<ApiResponse<ClientSubscription>>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  })
}

/**
 * Suspend a subscription
 */
export async function suspendSubscription(
  id: string,
  reason: string
): Promise<ApiResponse<ClientSubscription>> {
  return apiClient<ApiResponse<ClientSubscription>>(`${BASE_URL}/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

/**
 * Reactivate a suspended subscription
 */
export async function reactivateSubscription(
  id: string,
  nextBillingDate?: string
): Promise<ApiResponse<ClientSubscription>> {
  return apiClient<ApiResponse<ClientSubscription>>(`${BASE_URL}/${id}/reactivate`, {
    method: "POST",
    body: JSON.stringify({ nextBillingDate }),
  })
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  id: string,
  reason: string
): Promise<ApiResponse<ClientSubscription>> {
  return apiClient<ApiResponse<ClientSubscription>>(`${BASE_URL}/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}