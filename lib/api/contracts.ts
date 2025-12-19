import { apiClient, getTokens } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type {
  Contract,
  ContractDocument,
  ContractDocumentType,
  ContractLine,
  ContractStatus,
  CreateContractLineRequest,
  CreateContractRequest,
  UpdateContractRequest,
} from "@/types/business"

const BASE_URL = "/api/v1/business/contracts"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export async function getAllContracts(
  page?: number,
  size?: number,
  clientId?: string,
  status?: ContractStatus,
): Promise<ApiResponse<PaginatedResponse<Contract>>> {
  const params = new URLSearchParams()
  if (page !== undefined) params.append("page", page.toString())
  if (size !== undefined) params.append("size", size.toString())
  if (clientId) params.append("clientId", clientId)
  if (status) params.append("status", status)

  const queryString = params.toString()
  return apiClient<ApiResponse<PaginatedResponse<Contract>>>(`${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

export async function getContract(id: string): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(`${BASE_URL}/${id}`)
}

export async function getActiveContractsByClient(clientId: string): Promise<ApiResponse<Contract[]>> {
  return apiClient<ApiResponse<Contract[]>>(`${BASE_URL}/client/${clientId}/active`)
}

export async function createContract(data: CreateContractRequest): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateContract(id: string, data: UpdateContractRequest): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function addContractLine(
  contractId: string,
  data: CreateContractLineRequest,
): Promise<ApiResponse<ContractLine>> {
  return apiClient<ApiResponse<ContractLine>>(`${BASE_URL}/${contractId}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function removeContractLine(contractId: string, lineId: string): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`${BASE_URL}/${contractId}/lines/${lineId}`, {
    method: "DELETE",
  })
}

export async function activateContract(id: string): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(`${BASE_URL}/${id}/activate`, {
    method: "POST",
  })
}

export async function suspendContract(id: string, reason: string): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(`${BASE_URL}/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export async function terminateContract(id: string, reason: string): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(`${BASE_URL}/${id}/terminate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export async function reactivateContract(id: string): Promise<ApiResponse<Contract>> {
  return apiClient<ApiResponse<Contract>>(`${BASE_URL}/${id}/reactivate`, {
    method: "POST",
  })
}

export async function uploadContractDocument(
  id: string,
  file: File,
  documentType: ContractDocumentType,
  notes?: string,
  makeCurrent?: boolean,
): Promise<ApiResponse<ContractDocument>> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("documentType", documentType)
  if (notes) formData.append("notes", notes)
  if (makeCurrent !== undefined) formData.append("makeCurrent", makeCurrent.toString())

  const { accessToken } = getTokens()
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${BASE_URL}/${id}/documents`, {
    method: "POST",
    headers,
    body: formData,
  })

  return response.json()
}

export async function listContractDocuments(id: string): Promise<ApiResponse<ContractDocument[]>> {
  return apiClient<ApiResponse<ContractDocument[]>>(`${BASE_URL}/${id}/documents`)
}

export async function downloadContractDocument(contractId: string, documentId: string): Promise<Blob> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${BASE_URL}/${contractId}/documents/${documentId}/download`, {
    credentials: "include",
    headers,
  })

  return response.blob()
}

export async function downloadCurrentDocument(contractId: string): Promise<Blob> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${BASE_URL}/${contractId}/documents/current/download`, {
    credentials: "include",
    headers,
  })

  return response.blob()
}
