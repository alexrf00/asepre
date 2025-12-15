// ===== FILE: app/(dashboard)/users/page.tsx =====
// Users page with Deleted Users tab for SUPERADMIN

"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, UserPlus, RefreshCw, Trash2, RotateCcw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UsersTable } from "@/components/users/users-table"
import { UserDetailsDialog } from "@/components/users/user-details-dialog"
import { EditUserDialog } from "@/components/users/edit-user-dialog"
import { AssignRolesDialog } from "@/components/users/assign-roles-dialog"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { PermissionGate } from "@/components/common/permission-gate"
import { useAuthStore } from "@/lib/store/auth-store"
import type { User } from "@/types"
import { deleteUser, getUsers, getDeletedUsers, restoreUser, permanentlyDeleteUser } from "@/lib/api/users"
import { DeletedUsersTable } from "@/components/users/deleted-users-table"

export default function UsersPage() {
  // Active users state
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Deleted users state
  const [deletedUsers, setDeletedUsers] = useState<User[]>([])
  const [deletedCount, setDeletedCount] = useState(0)
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false)
  
  // Selected user for dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Dialog states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Restore dialog states
  const [userToRestore, setUserToRestore] = useState<User | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  
  // Permanent delete dialog states
  const [userToPermanentDelete, setUserToPermanentDelete] = useState<User | null>(null)
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false)

  // Auth store for checking SUPERADMIN role
  const { hasRole } = useAuthStore()
  const isSuperAdmin = hasRole("SUPERADMIN")

  // Load active users
  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getUsers()
      setUsers(response.content)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load deleted users (only for SUPERADMIN)
  const loadDeletedUsers = useCallback(async () => {
    if (!isSuperAdmin) return
    
    setIsLoadingDeleted(true)
    try {
      const response = await getDeletedUsers()
      setDeletedUsers(response.content)
      setDeletedCount(response.totalElements)
    } catch {
      toast.error("Failed to load deleted users")
    } finally {
      setIsLoadingDeleted(false)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (isSuperAdmin) {
      loadDeletedUsers()
    }
  }, [isSuperAdmin, loadDeletedUsers])

  // Handlers for active users
  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsDetailsOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditOpen(true)
  }

  const handleAssignRoles = (user: User) => {
    setSelectedUser(user)
    setIsAssignRolesOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setIsDeleting(true)
    try {
      const response = await deleteUser(selectedUser.id)
      if (response.success) {
        toast.success("User deleted successfully")
        loadUsers()
        if (isSuperAdmin) {
          loadDeletedUsers()
        }
      } else {
        toast.error(response.message || "Failed to delete user")
      }
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  // Handlers for deleted users
  const handleRestoreClick = (user: User) => {
    setUserToRestore(user)
  }

  const handleRestore = async () => {
    if (!userToRestore) return

    setIsRestoring(true)
    try {
      const response = await restoreUser(userToRestore.id)
      if (response.success) {
        toast.success(`${userToRestore.firstName} ${userToRestore.lastName} has been restored`)
        loadUsers()
        loadDeletedUsers()
      } else {
        toast.error(response.message || "Failed to restore user")
      }
    } catch {
      toast.error("Failed to restore user")
    } finally {
      setIsRestoring(false)
      setUserToRestore(null)
    }
  }

  const handlePermanentDeleteClick = (user: User) => {
    setUserToPermanentDelete(user)
  }

  const handlePermanentDelete = async () => {
    if (!userToPermanentDelete) return

    setIsPermanentDeleting(true)
    try {
      const response = await permanentlyDeleteUser(userToPermanentDelete.id)
      if (response.success) {
        toast.success("User permanently deleted")
        loadDeletedUsers()
      } else {
        toast.error(response.message || "Failed to permanently delete user")
      }
    } catch {
      toast.error("Failed to permanently delete user")
    } finally {
      setIsPermanentDeleting(false)
      setUserToPermanentDelete(null)
    }
  }

  const refreshAll = () => {
    loadUsers()
    if (isSuperAdmin) {
      loadDeletedUsers()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and their access permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refreshAll}>
            <RefreshCw className={`h-4 w-4 ${isLoading || isLoadingDeleted ? "animate-spin" : ""}`} />
          </Button>
          <PermissionGate permissions={["AUTH_USER_CREATE", "CREATE_USER"]}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Tabs - Only show if SUPERADMIN */}
      {isSuperAdmin ? (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </TabsTrigger>
            <TabsTrigger value="deleted" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Deleted Users
              {deletedCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {deletedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Users Tab */}
          <TabsContent value="active">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description="Get started by creating your first user account."
                action={
                  <PermissionGate permissions={["AUTH_USER_CREATE", "CREATE_USER"]}>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </PermissionGate>
                }
              />
            ) : (
              <UsersTable
                users={users}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onAssignRoles={handleAssignRoles}
              />
            )}
          </TabsContent>

          {/* Deleted Users Tab */}
          <TabsContent value="deleted">
            {isLoadingDeleted ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : deletedUsers.length === 0 ? (
              <EmptyState
                icon={Trash2}
                title="No deleted users"
                description="Deleted users will appear here and can be restored."
              />
            ) : (
              <DeletedUsersTable
                users={deletedUsers}
                onRestore={handleRestoreClick}
                onPermanentDelete={handlePermanentDeleteClick}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Non-SUPERADMIN users only see active users (no tabs)
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Get started by creating your first user account."
              action={
                <PermissionGate permissions={["AUTH_USER_CREATE", "CREATE_USER"]}>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </PermissionGate>
              }
            />
          ) : (
            <UsersTable
              users={users}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onAssignRoles={handleAssignRoles}
            />
          )}
        </>
      )}

      {/* Dialogs */}
      <UserDetailsDialog user={selectedUser} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />

      <EditUserDialog user={selectedUser} open={isEditOpen} onOpenChange={setIsEditOpen} onSuccess={loadUsers} />

      <AssignRolesDialog
        user={selectedUser}
        open={isAssignRolesOpen}
        onOpenChange={setIsAssignRolesOpen}
        onSuccess={loadUsers}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? The user can be restored later by a Super Admin.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        open={!!userToRestore}
        onOpenChange={(open) => !open && setUserToRestore(null)}
        title="Restore User"
        description={`Are you sure you want to restore ${userToRestore?.firstName} ${userToRestore?.lastName}? They will regain access to the system with their previous account status.`}
        confirmText="Restore"
        onConfirm={handleRestore}
        isLoading={isRestoring}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!userToPermanentDelete}
        onOpenChange={(open) => !open && setUserToPermanentDelete(null)}
        title={
          <span className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete User
          </span>
        }
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to <strong>permanently delete</strong>{" "}
              {userToPermanentDelete?.firstName} {userToPermanentDelete?.lastName}?
            </p>
            <p className="text-destructive font-medium">
              This action cannot be undone. All user data will be permanently removed from the system.
            </p>
          </div>
        }
        confirmText="Permanently Delete"
        variant="destructive"
        onConfirm={handlePermanentDelete}
        isLoading={isPermanentDeleting}
      />
    </div>
  )
}