// ===== FILE: app/(dashboard)/admin/invites/page.tsx =====
// Admin invite management page

"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Copy,
  Search
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { PermissionGate } from "@/components/common/permission-gate"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CreateInviteDialog } from "@/components/admin/invites/create-invite-dialog"
import { getInvites, revokeInvite } from "@/lib/api/admin"
import { formatDateTime, formatRelativeTime } from "@/lib/utils/formatters"
import type { Invite, InviteStatus } from "@/types"

// Status badge component
function InviteStatusBadge({ status }: { status: InviteStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    case "USED":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Used
        </Badge>
      )
    case "EXPIRED":
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          <XCircle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      )
    case "REVOKED":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="mr-1 h-3 w-3" />
          Revoked
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [inviteToRevoke, setInviteToRevoke] = useState<Invite | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const fetchInvites = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const status = statusFilter === "all" ? undefined : statusFilter
      const response = await getInvites(page, 10, status)
      
      setInvites(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (err) {
      console.error("Failed to fetch invites:", err)
      setError("Failed to load invites. Please try again.")
      setInvites([]) // Ensure invites is always an array even on error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleRevoke = async () => {
    if (!inviteToRevoke) return

    setIsRevoking(true)
    try {
      const response = await revokeInvite(inviteToRevoke.id)
      if (response.success) {
        toast.success("Invite revoked successfully")
        fetchInvites(true)
      } else {
        toast.error(response.message || "Failed to revoke invite")
      }
    } catch {
      toast.error("Failed to revoke invite")
    } finally {
      setIsRevoking(false)
      setInviteToRevoke(null)
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/register?invite=${token}`
    navigator.clipboard.writeText(link)
    toast.success("Invite link copied to clipboard")
  }

  // Filter invites by search query
  const filteredInvites = (invites || []).filter(invite =>
    invite.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invite.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <ProtectedRoute permissions={["AUTH_INVITE_LIST", "AUTH_INVITE_READ"]}>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading invites...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permissions={["AUTH_INVITE_LIST", "AUTH_INVITE_READ"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite Management</h1>
            <p className="text-muted-foreground">
              Create and manage user registration invites
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchInvites(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <PermissionGate permissions={["AUTH_INVITE_CREATE"]}>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invite
              </Button>
            </PermissionGate>
          </div>
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
                onClick={() => fetchInvites()}
                className="ml-auto"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Invites</CardTitle>
            <CardDescription>
              {totalElements} total invite{totalElements !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="USED">Used</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="REVOKED">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Intended Roles</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Mail className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No invites found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <InviteStatusBadge status={invite.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {invite.intendedRoles.length > 0 ? (
                              invite.intendedRoles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">Default</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invite.department || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span title={formatDateTime(invite.createdAt)}>
                            {formatRelativeTime(invite.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span title={formatDateTime(invite.expiresAt)}>
                            {formatRelativeTime(invite.expiresAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {invite.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyInviteLink(invite.token)}
                                  title="Copy invite link"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <PermissionGate permissions={["AUTH_INVITE_REVOKE"]}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setInviteToRevoke(invite)}
                                    className="text-destructive hover:text-destructive"
                                    title="Revoke invite"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Invite Dialog */}
        <CreateInviteDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            setShowCreateDialog(false)
            fetchInvites(true)
          }}
        />

        {/* Revoke Confirmation Dialog */}
        <ConfirmDialog
          open={!!inviteToRevoke}
          onOpenChange={(open) => !open && setInviteToRevoke(null)}
          title="Revoke Invite"
          description={`Are you sure you want to revoke the invite for ${inviteToRevoke?.email}? This action cannot be undone and they will need a new invitation to register.`}
          confirmText="Revoke"
          onConfirm={handleRevoke}
          variant="destructive"
          isLoading={isRevoking}
        />
      </div>
    </ProtectedRoute>
  )
}
