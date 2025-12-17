// ===== Business Contracts API =====

import { apiClient } from "../client"
import type {
  Contract,
  ContractLine,
  CreateContractRequest,
  UpdateContractRequest,
  CreateContractLineRequest,
  BusinessPaginatedResponse,
  BusinessApiResponse,
  ContractStatus,
} from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/contracts"

/**
 * Get contracts with optional filtering
 */
export async function getContracts(
  page = 0,
  size = 20,
  clientId?: string,
  status?: ContractStatus,
): Promise<BusinessPaginatedResponse<Contract>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (clientId) params.append("clientId", clientId)
  if (status) params.append("status", status)

  return businessApiClient<BusinessPaginatedResponse<Contract>>(`${BASE_PATH}?${params.toString()}`)
}

/**
 * Get contract by ID
 */
export async function getContractById(id: string): Promise<Contract> {
  return businessApiClient<Contract>(`${BASE_PATH}/${id}`)
}

/**
 * Create a new contract
 */
export async function createContract(data: CreateContractRequest): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update a contract
 */
export async function updateContract(id: string, data: UpdateContractRequest): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Activate a draft contract
 */
export async function activateContract(id: string): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}/activate`, {
    method: "POST",
  })
}

/**
 * Suspend an active contract
 */
export async function suspendContract(id: string): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}/suspend`, {
    method: "POST",
  })
}

/**
 * Terminate a contract
 */
export async function terminateContract(id: string): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}/terminate`, {
    method: "POST",
  })
}

/**
 * Add a line to a contract
 */
export async function addContractLine(
  contractId: string,
  data: CreateContractLineRequest,
): Promise<BusinessApiResponse<ContractLine>> {
  return apiClient<BusinessApiResponse<ContractLine>>(`${BASE_PATH}/${contractId}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Remove a line from a contract
 */
export async function removeContractLine(contractId: string, lineId: string): Promise<BusinessApiResponse<null>> {
  return apiClient<BusinessApiResponse<null>>(`${BASE_PATH}/${contractId}/lines/${lineId}`, {
    method: "DELETE",
  })
}

/**
 * Get contract statistics
 */
export async function getContractStats(): Promise<{
  total: number
  active: number
  draft: number
  expiringSoon: number
}> {
return businessApiClient(`${BASE_PATH}/stats`)
}
