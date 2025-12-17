// ===== FILE: app/(dashboard)/admin/user-approval/page.tsx =====
// Admin user approval page

"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Search,
  Mail,
  CheckCircle,
  Ban
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { PermissionGate } from "@/components/common/permission-gate"
import { ApproveUserDialog } from "@/components/admin/users/approve-user-dialog"
import { RejectUserDialog } from "@/components/admin/users/reject-user-dialog"
import { SuspendUserDialog } from "@/components/admin/users/suspend-user-dialog"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import {
  getPendingApprovalUsers,
  getPendingVerificationUsers,
  getSuspendedUsers,
  reactivateUser,
} from "@/lib/api/admin"
import { formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils/formatters"
import type { User, AccountStatus } from "@/types"

// Stats card component
function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string
  value: number
  icon: React.ElementType
  description: string
  variant?: "default" | "warning" | "success" | "destructive"
}) {
  const colorMap = {
    default: "text-muted-foreground",
    warning: "text-amber-500",
    success: "text-emerald-500",
    destructive: "text-red-500",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorMap[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Account status badge
function AccountStatusBadge({ status }: { status: AccountStatus }) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Mail className="mr-1 h-3 w-3" />
          Pending Verification
        </Badge>
      )
    case "PENDING_APPROVAL":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Clock className="mr-1 h-3 w-3" />
          Pending Approval
        </Badge>
      )
    case "ACTIVE":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </Badge>
      )
    case "SUSPENDED":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <Ban className="mr-1 h-3 w-3" />
          Suspended
        </Badge>
      )
    case "DEACTIVATED":
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          <Ban className="mr-1 h-3 w-3" />
          Deactivated
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function UserApprovalPage() {
  // Data states
  const [pendingApproval, setPendingApproval] = useState<User[]>([])
  const [pendingVerification, setPendingVerification] = useState<User[]>([])
  const [suspendedUsers, setSuspendedUsers] = useState<User[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Counts
  const [approvalCount, setApprovalCount] = useState(0)
  const [verificationCount, setVerificationCount] = useState(0)
  const [suspendedCount, setSuspendedCount] = useState(0)
  
  // Search
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialogs
  const [userToApprove, setUserToApprove] = useState<User | null>(null)
  const [userToReject, setUserToReject] = useState<User | null>(null)
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null)
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const [approvalRes, verificationRes, suspendedRes] = await Promise.all([
        getPendingApprovalUsers(0, 50),
        getPendingVerificationUsers(0, 50),
        getSuspendedUsers(0, 50),
      ])

      setPendingApproval(approvalRes.content || [])
      setApprovalCount(approvalRes.totalElements || 0)
      
      setPendingVerification(verificationRes.content || [])
      setVerificationCount(verificationRes.totalElements || 0)
      
      setSuspendedUsers(suspendedRes.content || [])
      setSuspendedCount(suspendedRes.totalElements || 0)
    } catch (err) {
      console.error("Failed to fetch user data:", err)
      setError("Failed to load user data. Please try again.")
      // Ensure arrays are always defined even on error
      setPendingApproval([])
      setPendingVerification([])
      setSuspendedUsers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReactivate = async () => {
    if (!userToReactivate) return

    setIsReactivating(true)
    try {
      const response = await reactivateUser(userToReactivate.id)
      if (response.success) {
        toast.success(`${userToReactivate.firstName} ${userToReactivate.lastName} has been reactivated`)
        fetchData(true)
      } else {
        toast.error(response.message || "Failed to reactivate user")
      }
    } catch {
      toast.error("Failed to reactivate user")
    } finally {
      setIsReactivating(false)
      setUserToReactivate(null)
    }
  }

  // Filter function
  const filterUsers = (users: User[]) => {
    if (!users || !Array.isArray(users)) return []
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.userName.toLowerCase().includes(query)
    )
  }

  // User table component
  const UserTable = ({ 
    users, 
    emptyMessage,
    showApprovalActions = false,
    showSuspendedActions = false,
  }: { 
    users: User[]
    emptyMessage: string
    showApprovalActions?: boolean
    showSuspendedActions?: boolean
  }) => (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <p className="text-muted-foreground">{emptyMessage}</p>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.userName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <AccountStatusBadge status={user.accountStatus} />
                </TableCell>
                <TableCell className="text-sm">
                  <span title={formatDateTime(user.createdAt)}>
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {showApprovalActions && (
                      <PermissionGate permissions={["AUTH_USER_APPROVE"]}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserToApprove(user)}
                          className="text-emerald-600 hover:text-emerald-600"
                        >
                          <UserCheck className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserToReject(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </PermissionGate>
                    )}
                    {showSuspendedActions && (
                      <PermissionGate permissions={["AUTH_USER_ACTIVATE"]}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserToReactivate(user)}
                          className="text-emerald-600 hover:text-emerald-600"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Reactivate
                        </Button>
                      </PermissionGate>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  if (loading) {
    return (
      <ProtectedRoute permissions={["AUTH_USER_APPROVE", "AUTH_USER_ACTIVATE"]}>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading user data...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permissions={["AUTH_USER_APPROVE", "AUTH_USER_ACTIVATE"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Approval</h1>
            <p className="text-muted-foreground">
              Review and manage user registrations
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData()}
                className="ml-auto"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Pending Approval"
            value={approvalCount}
            icon={Clock}
            description="Users awaiting admin approval"
            variant="warning"
          />
          <StatsCard
            title="Pending Verification"
            value={verificationCount}
            icon={Mail}
            description="Users who haven't verified email"
            variant="default"
          />
          <StatsCard
            title="Suspended"
            value={suspendedCount}
            icon={Ban}
            description="Currently suspended accounts"
            variant="destructive"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending-approval">
          <TabsList>
            <TabsTrigger value="pending-approval" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Approval
              {approvalCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {approvalCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending-verification" className="gap-2">
              <Mail className="h-4 w-4" />
              Pending Verification
              {verificationCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {verificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suspended" className="gap-2">
              <Ban className="h-4 w-4" />
              Suspended
              {suspendedCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {suspendedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending-approval" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Users Pending Approval</CardTitle>
                <CardDescription>
                  These users have verified their email and are waiting for admin approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={filterUsers(pendingApproval)}
                  emptyMessage="No users pending approval"
                  showApprovalActions
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending-verification" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Users Pending Email Verification</CardTitle>
                <CardDescription>
                  These users have registered but haven't verified their email yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={filterUsers(pendingVerification)}
                  emptyMessage="No users pending verification"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suspended" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Suspended Users</CardTitle>
                <CardDescription>
                  These users have been suspended and cannot access their accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={filterUsers(suspendedUsers)}
                  emptyMessage="No suspended users"
                  showSuspendedActions
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <ApproveUserDialog
          user={userToApprove}
          open={!!userToApprove}
          onOpenChange={(open) => !open && setUserToApprove(null)}
          onSuccess={() => {
            setUserToApprove(null)
            fetchData(true)
          }}
        />

        <RejectUserDialog
          user={userToReject}
          open={!!userToReject}
          onOpenChange={(open) => !open && setUserToReject(null)}
          onSuccess={() => {
            setUserToReject(null)
            fetchData(true)
          }}
        />

        <SuspendUserDialog
          user={userToSuspend}
          open={!!userToSuspend}
          onOpenChange={(open) => !open && setUserToSuspend(null)}
          onSuccess={() => {
            setUserToSuspend(null)
            fetchData(true)
          }}
        />

        <ConfirmDialog
          open={!!userToReactivate}
          onOpenChange={(open) => !open && setUserToReactivate(null)}
          title="Reactivate User"
          description={`Are you sure you want to reactivate ${userToReactivate?.firstName} ${userToReactivate?.lastName}? They will regain access to their account.`}
          confirmText="Reactivate"
          onConfirm={handleReactivate}
          isLoading={isReactivating}
        />
      </div>
    </ProtectedRoute>
  )
}
