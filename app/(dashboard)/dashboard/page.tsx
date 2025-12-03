"use client"

import { Users, Shield, UserCheck, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityItem } from "@/components/dashboard/activity-item"
import { useAuthStore } from "@/lib/store/auth-store"
import { RoleBadge } from "@/components/common/role-badge"
import { PermissionGate } from "@/components/common/permission-gate"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data for demo
const mockStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalRoles: 4,
  pendingVerifications: 23,
}

const mockActivity = [
  {
    id: 1,
    user: { firstName: "John", lastName: "Doe" },
    action: "created a new user",
    target: "jane.smith@example.com",
    role: "ADMINISTRADOR_GENERAL",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 2,
    user: { firstName: "Alice", lastName: "Johnson" },
    action: "assigned role",
    target: "USER_ADMIN",
    role: "SUPERADMIN",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 3,
    user: { firstName: "Bob", lastName: "Williams" },
    action: "updated permissions for",
    target: "VIEWER role",
    role: "ADMINISTRADOR_GENERAL",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 4,
    user: { firstName: "Emma", lastName: "Brown" },
    action: "deleted user",
    target: "old.user@example.com",
    role: "USER_ADMIN",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground">{"Here's what's happening with your RBAC system today."}</p>
        </div>
        <div className="flex gap-2">
          {user?.roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={mockStats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          description="from last month"
        />
        <StatsCard
          title="Active Users"
          value={mockStats.activeUsers.toLocaleString()}
          icon={UserCheck}
          trend={{ value: 8, isPositive: true }}
          description="currently online"
        />
        <StatsCard
          title="Total Roles"
          value={mockStats.totalRoles}
          icon={Shield}
          description="system roles configured"
        />
        <StatsCard
          title="Pending Verifications"
          value={mockStats.pendingVerifications}
          icon={Activity}
          trend={{ value: 5, isPositive: false }}
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
            <div className="divide-y divide-border">
              {mockActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  user={activity.user}
                  action={activity.action}
                  target={activity.target}
                  role={activity.role}
                  timestamp={activity.timestamp}
                />
              ))}
            </div>
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
