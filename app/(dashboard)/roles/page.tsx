"use client"

import { useState, useEffect, useCallback } from "react"
import { Shield, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { RoleCard } from "@/components/roles/role-card"
import { CreateRoleDialog } from "@/components/roles/create-role-dialog"
import { EditRoleDialog } from "@/components/roles/edit-role-dialog"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { PermissionGate } from "@/components/common/permission-gate"
import type { Role } from "@/types"
import { deleteRole } from "@/lib/api/roles"

// Mock roles for demo
const mockRoles: Role[] = [
  {
    id: 1,
    name: "SUPERADMIN",
    description: "Full system administrator with unrestricted access to all features and settings.",
    level: 1,
    isSystem: true,
    permissions: ["*"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "ADMINISTRADOR_GENERAL",
    description: "General administrator with access to user management and role configuration.",
    level: 2,
    isSystem: true,
    permissions: [
      "AUTH_USER_CREATE",
      "AUTH_USER_READ",
      "AUTH_USER_UPDATE",
      "AUTH_USER_DELETE",
      "AUTH_USER_LIST",
      "AUTH_ROLE_READ",
      "AUTH_ROLE_ASSIGN",
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 3,
    name: "USER_ADMIN",
    description: "User administrator with limited access to user management functions.",
    level: 3,
    isSystem: true,
    permissions: ["AUTH_USER_READ", "AUTH_USER_UPDATE", "AUTH_USER_LIST", "READ_USER", "UPDATE_USER"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 4,
    name: "VIEWER",
    description: "Read-only access to view system information and reports.",
    level: 4,
    isSystem: true,
    permissions: ["AUTH_USER_LIST", "READ_USER"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      // In production, use: const data = await getRoles();
      await new Promise((resolve) => setTimeout(resolve, 500))
      setRoles(mockRoles)
    } catch {
      toast.error("Failed to load roles")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setIsEditOpen(true)
  }

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteOpen(true)
  }

  const handleViewUsers = (role: Role) => {
    // In production, navigate to users filtered by this role
    toast.info(`Viewing users with role: ${role.name}`)
  }

  const handleDelete = async () => {
    if (!selectedRole) return

    setIsDeleting(true)
    try {
      const response = await deleteRole(selectedRole.id)
      if (response.success) {
        toast.success("Role deleted successfully")
        loadRoles()
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to delete role")
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
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">Manage roles and their associated permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadRoles}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <PermissionGate permissions={["AUTH_ROLE_CREATE"]} roles={["SUPERADMIN"]}>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles found"
          description="Get started by creating your first role."
          action={
            <PermissionGate permissions={["AUTH_ROLE_CREATE"]} roles={["SUPERADMIN"]}>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </PermissionGate>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewUsers={handleViewUsers}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateRoleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={loadRoles} />

      <EditRoleDialog role={selectedRole} open={isEditOpen} onOpenChange={setIsEditOpen} onSuccess={loadRoles} />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the "${selectedRole?.name}" role? Users with this role will lose associated permissions.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
