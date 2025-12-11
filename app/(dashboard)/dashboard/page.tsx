"use client"

import { useEffect, useState, useCallback } from "react"
import { Users, Shield, UserCheck, Activity, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityItem } from "@/components/dashboard/activity-item"
import { useAuthStore } from "@/lib/store/auth-store"
import { RoleBadge } from "@/components/common/role-badge"
import { PermissionGate } from "@/components/common/permission-gate"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  getDashboardSummary,
  type DashboardStats,
  type ActivityItem as ActivityItemType,
} from "@/lib/api/dashboard"

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const { stats, recentActivity } = await getDashboardSummary(10)
      setStats(stats)
      setActivity(recentActivity)
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchDashboardData()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground">{"Here's what's happening with your RBAC system today."}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <div className="flex gap-2">
            {user?.roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() ?? "0"}
          icon={Users}
          trend={
            stats?.usersTrend
              ? {
                  value: stats.usersTrend.value,
                  isPositive: stats.usersTrend.isPositive,
                }
              : undefined
          }
          description="from last month"
        />
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers?.toLocaleString() ?? "0"}
          icon={UserCheck}
          trend={
            stats?.activeUsersTrend
              ? {
                  value: stats.activeUsersTrend.value,
                  isPositive: stats.activeUsersTrend.isPositive,
                }
              : undefined
          }
          description="currently online"
        />
        <StatsCard
          title="Total Roles"
          value={stats?.totalRoles?.toString() ?? "0"}
          icon={Shield}
          description="system roles configured"
        />
        <StatsCard
          title="Pending Verifications"
          value={stats?.pendingVerifications?.toString() ?? "0"}
          icon={Activity}
          trend={
            stats?.verificationsTrend && stats.pendingVerifications > 0
              ? {
                  value: stats.verificationsTrend.value,
                  isPositive: false,
                }
              : undefined
          }
          description="awaiting email verification"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <PermissionGate permissions={["AUTH_USER_CREATE", "CREATE_USER"]}>
              <Link href="/users?action=create">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="mr-2 h-4 w-4" />
                  Create New User
                </Button>
              </Link>
            </PermissionGate>
            <PermissionGate permissions={["AUTH_ROLE_CREATE"]} roles={["SUPERADMIN"]}>
              <Link href="/roles?action=create">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Shield className="mr-2 h-4 w-4" />
                  Create New Role
                </Button>
              </Link>
            </PermissionGate>
            <Link href="/users">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <UserCheck className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Activity className="mr-2 h-4 w-4" />
                View My Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="divide-y divide-border">
                {activity.map((item) => (
                  <ActivityItem
                    key={item.id}
                    user={item.user}
                    action={item.action}
                    target={item.target}
                    role={item.role}
                    timestamp={item.timestamp}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Your Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>Current permissions assigned to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user?.permissions.length ? (
              user.permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {permission}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific permissions assigned. Access is determined by your roles.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}