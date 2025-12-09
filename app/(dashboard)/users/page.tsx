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

// Mock users for demo (in production, this would come from the API)
const mockUsers: User[] = [
  {
    id: 1,
    userName: "john_doe",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    roles: ["SUPERADMIN"],
    permissions: ["*"],
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isLocked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userName: "jane_smith",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    roles: ["ADMINISTRADOR_GENERAL"],
    permissions: ["AUTH_USER_LIST", "AUTH_USER_CREATE", "AUTH_ROLE_READ"],
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isLocked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    userName: "bob_wilson",
    email: "bob.wilson@example.com",
    firstName: "Bob",
    lastName: "Wilson",
    emailVerified: false,
    roles: ["USER_ADMIN"],
    permissions: ["AUTH_USER_LIST", "AUTH_USER_READ"],
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isLocked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    userName: "alice_johnson",
    email: "alice.johnson@example.com",
    firstName: "Alice",
    lastName: "Johnson",
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    roles: ["VIEWER"],
    permissions: [],
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isLocked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    userName: "charlie_brown",
    email: "charlie.brown@example.com",
    firstName: "Charlie",
    lastName: "Brown",
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    roles: ["USER_ADMIN", "VIEWER"],
    permissions: ["AUTH_USER_LIST", "AUTH_USER_READ", "AUTH_USER_UPDATE"],
    isLocked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

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
