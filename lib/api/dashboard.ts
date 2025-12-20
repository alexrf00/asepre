import { apiClient } from "./client"
import type { ApiResponse, PaginatedResponse } from "@/types"

// Dashboard Types
export interface TrendInfo {
  value: number
  isPositive: boolean
  period: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRoles: number
  pendingVerifications: number
  usersTrend: TrendInfo | null
  activeUsersTrend: TrendInfo | null
  verificationsTrend: TrendInfo | null
  totalPermissions: number
  lockedUsers: number
  deletedUsers: number
  loginsToday: number
  failedLoginsToday: number
  activityByType: Record<string, number>
  generatedAt: string
}

export interface ActivityUser {
  firstName: string
  lastName: string
}

export interface ActivityItem {
  id: number
  user: ActivityUser
  action: string
  target: string
  role: string
  timestamp: string
  actionType: string
  targetType?: string
  targetId?: number
}

export interface DashboardSummary {
  stats: DashboardStats
  recentActivity: ActivityItem[]
}

// Default empty values for error cases
const emptyStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalRoles: 0,
  pendingVerifications: 0,
  usersTrend: null,
  activeUsersTrend: null,
  verificationsTrend: null,
  totalPermissions: 0,
  lockedUsers: 0,
  deletedUsers: 0,
  loginsToday: 0,
  failedLoginsToday: 0,
  activityByType: {},
  generatedAt: new Date().toISOString()
}

const emptyPaginatedResponse = <T>(): PaginatedResponse<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: true,
})

// API Functions

/**
 * Get dashboard statistics
 * Backend returns: ApiResponse<DashboardStatsDto>
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient<ApiResponse<DashboardStats>>("/api/v1/dashboard/stats")
  return response.data ?? emptyStats
}

/**
 * Get recent activity
 * Backend returns: ApiResponse<List<ActivityDto>>
 */
export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  const response = await apiClient<ApiResponse<ActivityItem[]>>(
    `/api/v1/dashboard/activity?limit=${limit}`
  )
  return response.data ?? []
}

/**
 * Get dashboard summary (stats + recent activity in one call)
 * Backend returns: ApiResponse with stats and recentActivity fields
 */
export async function getDashboardSummary(activityLimit: number = 10): Promise<DashboardSummary> {
  const response = await apiClient<ApiResponse<{ stats: DashboardStats; recentActivity: ActivityItem[] }>>(
    `/api/v1/dashboard/summary?activityLimit=${activityLimit}`
  )
  return {
    stats: response.data?.stats ?? emptyStats,
    recentActivity: response.data?.recentActivity ?? [],
  }
}

/**
 * Get all activities with pagination
 * Backend returns: ApiResponse<Page<ActivityDto>>
 */
export async function getAllActivities(
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<ActivityItem>> {
  const response = await apiClient<ApiResponse<PaginatedResponse<ActivityItem>>>(
    `/api/v1/dashboard/activity/all?page=${page}&size=${size}`
  )
  return response.data ?? emptyPaginatedResponse<ActivityItem>()
}

/**
 * Get activities for a specific user with pagination
 * Backend returns: ApiResponse<Page<ActivityDto>>
 */
export async function getUserActivities(
  userId: string,  // Changed from number to string for UUID consistency
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<ActivityItem>> {
  const response = await apiClient<ApiResponse<PaginatedResponse<ActivityItem>>>(
    `/api/v1/dashboard/activity/user/${userId}?page=${page}&size=${size}`
  )
  return response.data ?? emptyPaginatedResponse<ActivityItem>()
}
