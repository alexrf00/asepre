import { apiClient } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type {
  CreateInvoiceRequest,
  GenerateInvoiceFromContractRequest,
  Invoice,
  InvoiceStats,
  InvoiceStatus,
  RunRecurringInvoicingRequest,
  RunRecurringInvoicingResponse,
} from "@/types/business"

const BASE_URL = "/api/v1/business/invoices"

export async function getAllInvoices(
  page?: number,
  size?: number,
  clientId?: string,
  status?: InvoiceStatus,
  startDate?: string,
  endDate?: string,
): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
  const params = new URLSearchParams()
  if (page !== undefined) params.append("page", page.toString())
  if (size !== undefined) params.append("size", size.toString())
  if (clientId) params.append("clientId", clientId)
  if (status) params.append("status", status)
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)

  const queryString = params.toString()
  return apiClient<ApiResponse<PaginatedResponse<Invoice>>>(`${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

export async function getInvoice(id: string): Promise<ApiResponse<Invoice>> {
  return apiClient<ApiResponse<Invoice>>(`${BASE_URL}/${id}`)
}

export async function getUnpaidInvoicesByClient(clientId: string): Promise<ApiResponse<Invoice[]>> {
  return apiClient<ApiResponse<Invoice[]>>(`${BASE_URL}/client/${clientId}/unpaid`)
}

export async function createInvoice(data: CreateInvoiceRequest): Promise<ApiResponse<Invoice>> {
  return apiClient<ApiResponse<Invoice>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function generateFromContract(
  contractId: string,
  data?: GenerateInvoiceFromContractRequest,
): Promise<ApiResponse<Invoice>> {
  return apiClient<ApiResponse<Invoice>>(`${BASE_URL}/from-contract/${contractId}`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  })
}

export async function issueInvoice(id: string): Promise<ApiResponse<Invoice>> {
  return apiClient<ApiResponse<Invoice>>(`${BASE_URL}/${id}/issue`, {
    method: "POST",
  })
}

export async function cancelInvoice(id: string, reason: string): Promise<ApiResponse<Invoice>> {
  return apiClient<ApiResponse<Invoice>>(`${BASE_URL}/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export async function voidInvoice(id: string, reason: string): Promise<ApiResponse<Invoice>> {
  return apiClient<ApiResponse<Invoice>>(`${BASE_URL}/${id}/void`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export async function getInvoiceStats(): Promise<ApiResponse<InvoiceStats>> {
  return apiClient<ApiResponse<InvoiceStats>>(`${BASE_URL}/stats`)
}

export async function runRecurringInvoicing(
  data?: RunRecurringInvoicingRequest,
): Promise<ApiResponse<RunRecurringInvoicingResponse>> {
  return apiClient<ApiResponse<RunRecurringInvoicingResponse>>(`${BASE_URL}/recurring/run`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  })
}
