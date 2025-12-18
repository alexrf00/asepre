// ===== FILE: lib/api/business/contracts.ts =====
// ===== Business Contracts API =====

import { apiClient } from "../client"
import { businessApiClient } from "./client"
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

const BASE_PATH = "/api/v1/business/contracts"

// -------------------------------
// Low-level functions (keep these)
// -------------------------------

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

export async function getContractById(id: string): Promise<Contract> {
  return businessApiClient<Contract>(`${BASE_PATH}/${id}`)
}

export async function createContract(data: CreateContractRequest): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateContract(id: string, data: UpdateContractRequest): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function activateContract(id: string): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}/activate`, { method: "POST" })
}

export async function suspendContract(id: string): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}/suspend`, { method: "POST" })
}

export async function terminateContract(id: string): Promise<BusinessApiResponse<Contract>> {
  return apiClient<BusinessApiResponse<Contract>>(`${BASE_PATH}/${id}/terminate`, { method: "POST" })
}

export async function addContractLine(
  contractId: string,
  data: CreateContractLineRequest,
): Promise<BusinessApiResponse<ContractLine>> {
  return apiClient<BusinessApiResponse<ContractLine>>(`${BASE_PATH}/${contractId}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function removeContractLine(contractId: string, lineId: string): Promise<BusinessApiResponse<null>> {
  return apiClient<BusinessApiResponse<null>>(`${BASE_PATH}/${contractId}/lines/${lineId}`, {
    method: "DELETE",
  })
}

export type ContractStats = {
  total: number
  active: number
  draft: number
  expiringSoon: number
}

export async function getContractStats(): Promise<ContractStats> {
  return businessApiClient<ContractStats>(`${BASE_PATH}/stats`)
}

// -------------------------------------
// UI-friendly adapter (what your page uses)
// -------------------------------------

type ContractsListParams = {
  page?: number // UI is 1-based
  limit?: number
  search?: string
  status?: string
  clientId?: string
}

type ContractsListResult = {
  data: Contract[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function normalizeContractStatus(status?: string): ContractStatus | undefined {
  if (!status) return undefined
  const s = status.trim()
  if (!s) return undefined

  const upper = s.toUpperCase()

  const map: Record<string, ContractStatus> = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    TERMINATED: "TERMINATED",
    EXPIRED: "EXPIRED",

    // common UI aliases
    CANCELLED: "TERMINATED",
    CANCELED: "TERMINATED",
  }

  return map[upper]
}

function unwrapOrThrow<T>(res: BusinessApiResponse<T>): T {
  if (!res?.success) throw new Error(res?.message || "Request failed")
  return res.data as T
}

export const contractsApi = {
  async getAll(params: ContractsListParams = {}): Promise<ContractsListResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const page0 = Math.max(0, page - 1)

    const status = normalizeContractStatus(params.status)

    const paged = await getContracts(page0, limit, params.clientId, status)

    let rows = Array.isArray(paged.content) ? paged.content : []

    // NOTE: backend paging happens first; this filters only the returned page.
    const q = (params.search ?? "").trim().toLowerCase()
    if (q) {
      rows = rows.filter((c) => {
        return (
          c.contractNumber?.toLowerCase().includes(q) ||
          c.clientName?.toLowerCase().includes(q) ||
          c.clientId?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
        )
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

  getById: getContractById,

  async create(data: CreateContractRequest): Promise<Contract> {
    return unwrapOrThrow(await createContract(data))
  },

  async update(id: string, data: UpdateContractRequest): Promise<Contract> {
    return unwrapOrThrow(await updateContract(id, data))
  },

  async activate(id: string): Promise<Contract> {
    return unwrapOrThrow(await activateContract(id))
  },

  async suspend(id: string): Promise<Contract> {
    return unwrapOrThrow(await suspendContract(id))
  },

  // UI calls it "cancel", backend endpoint is terminate
  async cancel(id: string): Promise<Contract> {
    return unwrapOrThrow(await terminateContract(id))
  },

  async addLine(contractId: string, data: CreateContractLineRequest): Promise<ContractLine> {
    return unwrapOrThrow(await addContractLine(contractId, data))
  },

  async removeLine(contractId: string, lineId: string): Promise<void> {
    const res = await removeContractLine(contractId, lineId)
    if (!res?.success) throw new Error(res?.message || "Failed to remove contract line")
  },

  getStats: getContractStats,
}
