// ===== Business Receipts API =====

import { apiClient } from "../client"
import type { Receipt, VoidReceiptRequest, BusinessApiResponse } from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/receipts"

/**
 * Get receipt by ID
 */
export async function getReceiptById(id: string): Promise<Receipt> {
  return businessApiClient<Receipt>(`${BASE_PATH}/${id}`)
}

/**
 * Get receipt by payment ID
 */
export async function getReceiptByPayment(paymentId: string): Promise<Receipt | null> {
  return businessApiClient<Receipt | null>(`${BASE_PATH}/by-payment/${paymentId}`)
}

/**
 * Void a receipt
 */
export async function voidReceipt(id: string, data: VoidReceiptRequest): Promise<BusinessApiResponse<Receipt>> {
  return apiClient<BusinessApiResponse<Receipt>>(`${BASE_PATH}/${id}/void`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
