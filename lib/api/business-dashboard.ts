import { apiClient } from "./client"
import type { ApiResponse } from "@/types"
import type { BusinessDashboardStats, RevenueDataPoint } from "@/types/business"

const BASE_URL = "/api/v1/business/dashboard"

export async function getBusinessStats(): Promise<ApiResponse<BusinessDashboardStats>> {
  return apiClient<ApiResponse<BusinessDashboardStats>>(`${BASE_URL}/stats`)
}

export async function getRevenueData(months?: number): Promise<ApiResponse<RevenueDataPoint[]>> {
  const params = new URLSearchParams()
  if (months !== undefined) params.append("months", months.toString())

  const queryString = params.toString()
  return apiClient<ApiResponse<RevenueDataPoint[]>>(`${BASE_URL}/revenue${queryString ? `?${queryString}` : ""}`)
}
