// ===== Business Invoices API =====

import { apiClient } from "../client"
import type {
  Invoice,
  CreateInvoiceRequest,
  CancelInvoiceRequest,
  BusinessPaginatedResponse,
  BusinessApiResponse,
  InvoiceStatus,
} from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/invoices"

/**
 * Get invoices with optional filtering
 */
export async function getInvoices(
  page = 0,
  size = 20,
  clientId?: string,
  status?: InvoiceStatus,
  overdue?: boolean,
): Promise<BusinessPaginatedResponse<Invoice>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (clientId) params.append("clientId", clientId)
  if (status) params.append("status", status)
  if (overdue !== undefined) params.append("overdue", String(overdue))

  return businessApiClient<BusinessPaginatedResponse<Invoice>>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice> {
  return businessApiClient<Invoice>(`${BASE_PATH}/${id}`)
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: CreateInvoiceRequest): Promise<BusinessApiResponse<Invoice>> {
  return apiClient<BusinessApiResponse<Invoice>>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Create invoice from contract
 */
export async function createInvoiceFromContract(contractId: string): Promise<BusinessApiResponse<Invoice>> {
  return apiClient<BusinessApiResponse<Invoice>>(`${BASE_PATH}/from-contract/${contractId}`, {
    method: "POST",
  })
}

/**
 * Issue an invoice (assigns NCF)
 */
export async function issueInvoice(id: string): Promise<BusinessApiResponse<Invoice>> {
  return apiClient<BusinessApiResponse<Invoice>>(`${BASE_PATH}/${id}/issue`, {
    method: "POST",
  })
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(id: string, data: CancelInvoiceRequest): Promise<BusinessApiResponse<Invoice>> {
  return apiClient<BusinessApiResponse<Invoice>>(`${BASE_PATH}/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(): Promise<{
  draft: number
  issued: number
  partial: number
  paid: number
  overdue: number
  totalReceivables: number
}> {
  return apiClient<{
    draft: number
    issued: number
    partial: number
    paid: number
    overdue: number
    totalReceivables: number
  }>(`${BASE_PATH}/stats`)
}
