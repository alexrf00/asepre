// ===== Business Dashboard API =====

import { apiClient } from "../client"
import type { BusinessDashboardStats, RevenueDataPoint } from "@/lib/types/business"
import { businessApiClient } from "./client"

const BASE_PATH = "/api/v1/business/dashboard"

/**
 * Get dashboard summary statistics
 */
export async function getDashboardStats(): Promise<BusinessDashboardStats> {
  return businessApiClient<BusinessDashboardStats>(`${BASE_PATH}/stats`)
}

/**
 * Get revenue data for chart (last 12 months)
 */
export async function getRevenueData(): Promise<RevenueDataPoint[]> {
  return businessApiClient<RevenueDataPoint[]>(`${BASE_PATH}/revenue`)
}
