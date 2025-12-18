// ===== Business Payments API =====

import { apiClient, businessApiClient } from "./client"
import type {
  Payment,
  PaymentType,
  RecordPaymentRequest,
  CreatePaymentTypeRequest,
  PaymentAllocationRequest,
  BusinessPaginatedResponse,
  BusinessApiResponse,
} from "@/lib/types/business"

const BASE_PATH = "/api/v1/business/payments"

/**
 * Get payments with optional filtering
 */
export async function getPayments(page = 0, size = 20, clientId?: string): Promise<BusinessPaginatedResponse<Payment>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (clientId) params.append("clientId", clientId)
  return businessApiClient<BusinessPaginatedResponse<Payment>>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string): Promise<Payment> {
  return businessApiClient<Payment>(`${BASE_PATH}/${id}`)
}

/**
 * Record a new payment
 */
export async function recordPayment(data: RecordPaymentRequest): Promise<BusinessApiResponse<Payment>> {
  return apiClient<BusinessApiResponse<Payment>>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Allocate payment to invoices
 */
export async function allocatePayment(
  id: string,
  allocations: PaymentAllocationRequest[],
): Promise<BusinessApiResponse<Payment>> {
  return apiClient<BusinessApiResponse<Payment>>(`${BASE_PATH}/${id}/allocate`, {
    method: "POST",
    body: JSON.stringify({ allocations }),
  })
}

// ===== Payment Types =====

/**
 * Get all payment types
 */
export async function getPaymentTypes(): Promise<PaymentType[]> {
  return apiClient<PaymentType[]>(`${BASE_PATH}/types`)
}

/**
 * Create a new payment type
 */
export async function createPaymentType(data: CreatePaymentTypeRequest): Promise<BusinessApiResponse<PaymentType>> {
  return apiClient<BusinessApiResponse<PaymentType>>(`${BASE_PATH}/types`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update a payment type
 */
export async function updatePaymentType(
  id: string,
  data: Partial<CreatePaymentTypeRequest>,
): Promise<BusinessApiResponse<PaymentType>> {
  return apiClient<BusinessApiResponse<PaymentType>>(`${BASE_PATH}/types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Delete (deactivate) a payment type
 */
export async function deletePaymentType(id: string): Promise<BusinessApiResponse<null>> {
  return apiClient<BusinessApiResponse<null>>(`${BASE_PATH}/types/${id}`, {
    method: "DELETE",
  })
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(): Promise<{
  totalReceived: number
  fullyAllocated: number
  unallocated: number
}> {
  return businessApiClient<{
    totalReceived: number
    fullyAllocated: number
    unallocated: number
  }>(`${BASE_PATH}/stats`)
}

type PaymentsListParams = {
  search?: string
  paymentMethod?: "all" | "transfer" | "check" | "cash" | "card" | string
  clientId?: string
  page?: number // UI is 1-based
  limit?: number
}

type PaymentsListResult = {
  data: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const paymentsApi = {
  async getAll(params: PaymentsListParams = {}): Promise<PaymentsListResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const page0 = Math.max(0, page - 1)

    // Attempt server-side filtering if supported; harmless if ignored by backend.
    const qs = new URLSearchParams({
      page: String(page0),
      size: String(limit),
    })
    if (params.clientId) qs.append("clientId", params.clientId)
    if (params.search?.trim()) qs.append("search", params.search.trim())
    if (params.paymentMethod && params.paymentMethod !== "all") qs.append("paymentMethod", params.paymentMethod)

    const paged = await businessApiClient<BusinessPaginatedResponse<Payment>>(`${BASE_PATH}?${qs.toString()}`)

    let rows = Array.isArray(paged.content) ? paged.content : []

    // Fallback client-side filtering on the returned page (keeps UI stable even if backend ignores params)
    const q = params.search?.trim().toLowerCase()
    if (q) {
      rows = rows.filter((p) => {
        return (
          p.clientName?.toLowerCase().includes(q) ||
          p.paymentNumber?.toLowerCase().includes(q) ||
          (p.reference ?? "").toLowerCase().includes(q)
        )
      })
    }

    const method = params.paymentMethod
    if (method && method !== "all") {
      rows = rows.filter((p) => {
        const code = (p.paymentTypeCode ?? "").toLowerCase()
        const name = (p.paymentTypeName ?? "").toLowerCase()
        return code === method.toLowerCase() || name.includes(method.toLowerCase())
      })
    }

    return {
      data: rows,
      pagination: {
        page: paged.number + 1,
        limit: paged.size,
        total: paged.totalElements,
        totalPages: paged.totalPages,
      },
    }
  },
}