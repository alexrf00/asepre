// lib/api/business/client.ts

import { apiClient as baseApiClient } from "../client"
import type { BusinessApiResponse } from "@/lib/types/business"

// Preserve the existing export so your current POST/PUT/DELETE calls keep working
export const apiClient = baseApiClient

/**
 * Business API helper: unwraps { success, data, message } and returns data.
 * Throws on success=false, or if data is missing.
 */
export async function businessApiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await baseApiClient<BusinessApiResponse<T>>(endpoint, options)

  if (!res || res.success !== true) {
    throw new Error(res?.message ?? "Business API request failed")
  }

  if (typeof res.data === "undefined") {
    throw new Error("Business API response was successful but contained no data")
  }

  return res.data
}
