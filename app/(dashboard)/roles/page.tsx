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
import { deleteRole, getRoles } from "@/lib/api/roles"

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
      const data = await getRoles()
      setRoles(data)
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
