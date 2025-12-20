import { apiClient, getTokens } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"
import type {
  ContractDto,
  ContractDocumentDto,
  ContractDocumentType,
  ContractLineDto,
  ContractStatus,
  CreateContractLineRequest,
  CreateContractRequest,
  UpdateContractRequest,
} from "@/types/business"

const BASE_URL = "/api/v1/business/contracts"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// 1. List Contracts (Paginated)
export async function getAllContracts(
  page?: number,
  size?: number,
  clientId?: string,
  status?: ContractStatus,
): Promise<ApiResponse<PaginatedResponse<ContractDto>>> {
  const params = new URLSearchParams()
  if (page !== undefined) params.append("page", page.toString())
  if (size !== undefined) params.append("size", size.toString())
  if (clientId) params.append("clientId", clientId)
  if (status) params.append("status", status)

  const queryString = params.toString()
  return apiClient<ApiResponse<PaginatedResponse<ContractDto>>>(`${BASE_URL}${queryString ? `?${queryString}` : ""}`)
}

// 2. Get Contract by ID
export async function getContract(id: string): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(`${BASE_URL}/${id}`)
}

// 3. Get Active Contracts by Client
export async function getActiveContractsByClient(clientId: string): Promise<ApiResponse<ContractDto[]>> {
  return apiClient<ApiResponse<ContractDto[]>>(`${BASE_URL}/client/${clientId}/active`)
}

// 4. Create Contract
export async function createContract(data: CreateContractRequest): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// 5. Update Contract
export async function updateContract(id: string, data: UpdateContractRequest): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// 6. Add Contract Line
export async function addContractLine(
  contractId: string,
  data: CreateContractLineRequest,
): Promise<ApiResponse<ContractLineDto>> {
  return apiClient<ApiResponse<ContractLineDto>>(`${BASE_URL}/${contractId}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// 7. Remove Contract Line
export async function removeContractLine(contractId: string, lineId: string): Promise<ApiResponse<void>> {
  return apiClient<ApiResponse<void>>(`${BASE_URL}/${contractId}/lines/${lineId}`, {
    method: "DELETE",
  })
}

// 8. Activate Contract
export async function activateContract(id: string): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(`${BASE_URL}/${id}/activate`, {
    method: "POST",
  })
}

// 9. Suspend Contract
export async function suspendContract(id: string, reason: string): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(`${BASE_URL}/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

// 10. Terminate Contract
export async function terminateContract(id: string, reason: string): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(`${BASE_URL}/${id}/terminate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

// 11. Reactivate Contract
export async function reactivateContract(id: string): Promise<ApiResponse<ContractDto>> {
  return apiClient<ApiResponse<ContractDto>>(`${BASE_URL}/${id}/reactivate`, {
    method: "POST",
  })
}

// 12. Upload Contract Document (Multipart)
export async function uploadContractDocument(
  contractId: string,
  file: File,
  documentType: ContractDocumentType,
  notes?: string,
  makeCurrent = true,
): Promise<ApiResponse<ContractDocumentDto>> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("documentType", documentType)
  if (notes) formData.append("notes", notes)
  formData.append("makeCurrent", makeCurrent.toString())

  const { accessToken } = getTokens()
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }
  // Note: Do NOT set Content-Type header - browser will set multipart boundary

  const response = await fetch(`${API_BASE_URL}${BASE_URL}/${contractId}/documents`, {
    method: "POST",
    headers,
    body: formData,
  })

  return response.json()
}

// 13. List Contract Documents
export async function listContractDocuments(contractId: string): Promise<ApiResponse<ContractDocumentDto[]>> {
  return apiClient<ApiResponse<ContractDocumentDto[]>>(`${BASE_URL}/${contractId}/documents`)
}

// 14. Download Specific Document
export async function downloadContractDocument(contractId: string, documentId: string): Promise<Blob> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${BASE_URL}/${contractId}/documents/${documentId}/download`, { headers })

  return response.blob()
}

// 15. Download Current Document
export async function downloadCurrentDocument(contractId: string): Promise<Blob> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${BASE_URL}/${contractId}/documents/current/download`, { headers })

  return response.blob()
}
