"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, UserPlus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { UsersTable } from "@/components/users/users-table"
import { UserDetailsDialog } from "@/components/users/user-details-dialog"
import { EditUserDialog } from "@/components/users/edit-user-dialog"
import { AssignRolesDialog } from "@/components/users/assign-roles-dialog"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { PermissionGate } from "@/components/common/permission-gate"
import type { User } from "@/types"
import { deleteUser, getUsers } from "@/lib/api/users"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
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
          <Button variant="outline" size="icon" onClick={loadUsers}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <PermissionGate permissions={["AUTH_USER_CREATE", "CREATE_USER"]}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Content */}
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

      {/* Dialogs */}
      <UserDetailsDialog user={selectedUser} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />

      <EditUserDialog user={selectedUser} open={isEditOpen} onOpenChange={setIsEditOpen} onSuccess={loadUsers} />

      <AssignRolesDialog
        user={selectedUser}
        open={isAssignRolesOpen}
        onOpenChange={setIsAssignRolesOpen}
        onSuccess={loadUsers}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
