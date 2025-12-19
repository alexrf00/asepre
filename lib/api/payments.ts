import { apiClient } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type {
  AllocatePaymentRequest,
  CreatePaymentTypeRequest,
  Payment,
  PaymentType,
  RecordPaymentRequest,
} from "@/types/business"

const BASE_URL = "/api/v1/business/payments"

export async function getPaymentTypes(activeOnly?: boolean): Promise<ApiResponse<PaymentType[]>> {
  const params = new URLSearchParams()
  if (activeOnly !== undefined) params.append("activeOnly", activeOnly.toString())

  const queryString = params.toString()
  return apiClient<ApiResponse<PaymentType[]>>(`${BASE_URL}/types${queryString ? `?${queryString}` : ""}`)
}

export async function createPaymentType(data: CreatePaymentTypeRequest): Promise<ApiResponse<PaymentType>> {
  return apiClient<ApiResponse<PaymentType>>(`${BASE_URL}/types`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getAllPayments(
  page?: number,
  size?: number,
  clientId?: string,
  startDate?: string,
  endDate?: string,
): Promise<ApiResponse<PaginatedResponse<Payment>>> {
  const params = new URLSearchParams()
  if (page !== undefined) params.append("page", page.toString())
  if (size !== undefined) params.append("size", size.toString())
  if (clientId) params.append("clientId", clientId)
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)

  const queryString = params.toString()
  return apiClient<ApiResponse<PaginatedResponse<Payment>>>(`${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

export async function getPayment(id: string): Promise<ApiResponse<Payment>> {
  return apiClient<ApiResponse<Payment>>(`${BASE_URL}/${id}`)
}

export async function recordPayment(data: RecordPaymentRequest): Promise<ApiResponse<Payment>> {
  return apiClient<ApiResponse<Payment>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function allocatePayment(id: string, data: AllocatePaymentRequest): Promise<ApiResponse<Payment>> {
  return apiClient<ApiResponse<Payment>>(`${BASE_URL}/${id}/allocate`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
