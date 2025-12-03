"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { PermissionTree } from "./permission-tree"
import { RoleBadge } from "@/components/common/role-badge"
import { updateRoleSchema, type UpdateRoleFormData } from "@/lib/validations/roles"
import { updateRole } from "@/lib/api/roles"
import type { Role } from "@/types"

// Available permissions (in production, fetch from API)
const AVAILABLE_PERMISSIONS = [
  "AUTH_USER_CREATE",
  "AUTH_USER_READ",
  "AUTH_USER_UPDATE",
  "AUTH_USER_DELETE",
  "AUTH_USER_LIST",
  "AUTH_ROLE_CREATE",
  "AUTH_ROLE_READ",
  "AUTH_ROLE_UPDATE",
  "AUTH_ROLE_DELETE",
  "AUTH_ROLE_ASSIGN",
  "AUTH_ROLE_REVOKE",
  "AUTH_PERMISSION_READ",
  "MANAGE_ROLES",
  "READ_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "CREATE_USER",
]

interface EditRoleDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditRoleDialog({ role, open, onOpenChange, onSuccess }: EditRoleDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  })

  useEffect(() => {
    if (role) {
      reset({
        description: role.description,
        permissions: role.permissions,
      })
      setSelectedPermissions(role.permissions)
    }
  }, [role, reset])

  const onSubmit = async (data: UpdateRoleFormData) => {
    if (!role) return

    try {
      const response = await updateRole(role.id, {
        description: data.description,
        permissions: selectedPermissions,
      })

      if (response.success) {
        toast.success("Role updated successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to update role")
    }
  }

  const handlePermissionChange = (permissions: string[]) => {
    setSelectedPermissions(permissions)
    setValue("permissions", permissions)
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Role
            <RoleBadge role={role.name} />
          </DialogTitle>
          <DialogDescription>Update the role description and permissions</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 pb-4">
              {/* Role Info (Read-only) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input value={role.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Input value={role.level.toString()} disabled className="bg-muted" />
                </div>
              </div>

              {role.isSystem && (
                <Badge variant="secondary" className="gap-1">
                  System role - some fields cannot be modified
                </Badge>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this role is for..."
                  {...register("description")}
                  disabled={role.isSystem}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <span className="text-sm text-muted-foreground">{selectedPermissions.length} selected</span>
                </div>
                <PermissionTree
                  permissions={AVAILABLE_PERMISSIONS}
                  selectedPermissions={selectedPermissions}
                  onPermissionChange={handlePermissionChange}
                  disabled={role.isSystem}
                />
                {errors.permissions && <p className="text-sm text-destructive">{errors.permissions.message}</p>}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || role.isSystem}>
              {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
