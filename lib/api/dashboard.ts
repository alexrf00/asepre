import { apiClient } from "./client"
import type { PaginatedResponse } from "@/types"

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

// API Functions

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient<{ success: boolean; data: DashboardStats }>("/api/v1/dashboard/stats")
  return response.data
}

export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  const response = await apiClient<{ success: boolean; data: ActivityItem[] }>(
    `/api/v1/dashboard/activity?limit=${limit}`
  )
  return response.data
}

export async function getDashboardSummary(activityLimit: number = 10): Promise<DashboardSummary> {
  const response = await apiClient<{ success: boolean; stats: DashboardStats; recentActivity: ActivityItem[] }>(
    `/api/v1/dashboard/summary?activityLimit=${activityLimit}`
  )
  return {
    stats: response.stats,
    recentActivity: response.recentActivity,
  }
}

export async function getAllActivities(
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<ActivityItem>> {
  const response = await apiClient<{ success: boolean; data: PaginatedResponse<ActivityItem> }>(
    `/api/v1/dashboard/activity/all?page=${page}&size=${size}`
  )
  return response.data
}

export async function getUserActivities(
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PaginatedResponse<ActivityItem>> {
  const response = await apiClient<{ success: boolean; data: PaginatedResponse<ActivityItem> }>(
    `/api/v1/dashboard/activity/user/${userId}?page=${page}&size=${size}`
  )
  return response.data
}