import { apiClient } from "./client"
import type { ApiResponse } from "@/types"
import type { Receipt } from "@/types/business"

const BASE_URL = "/api/v1/business/receipts"

export async function getReceipt(id: string): Promise<ApiResponse<Receipt>> {
  return apiClient<ApiResponse<Receipt>>(`${BASE_URL}/${id}`)
}

export async function getReceiptByPayment(paymentId: string): Promise<ApiResponse<Receipt>> {
  return apiClient<ApiResponse<Receipt>>(`${BASE_URL}/by-payment/${paymentId}`)
}

export async function voidReceipt(id: string, reason: string): Promise<ApiResponse<Receipt>> {
  return apiClient<ApiResponse<Receipt>>(`${BASE_URL}/${id}/void`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}
