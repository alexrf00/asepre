// ===== Business Payments API =====

import { apiClient } from "../client"
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
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (clientId) params.append("clientId", clientId)

  return apiClient<BusinessPaginatedResponse<Payment>>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string): Promise<Payment> {
  return apiClient<Payment>(`${BASE_PATH}/${id}`)
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
  return apiClient<{
    totalReceived: number
    fullyAllocated: number
    unallocated: number
  }>(`${BASE_PATH}/stats`)
}
