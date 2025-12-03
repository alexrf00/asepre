"use client"

import { useState } from "react"
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
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { PermissionTree } from "./permission-tree"
import { createRoleSchema, type CreateRoleFormData } from "@/lib/validations/roles"
import { createRole } from "@/lib/api/roles"

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

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      level: 50,
      permissions: [],
    },
  })

  const level = watch("level")

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      const response = await createRole({
        ...data,
        permissions: selectedPermissions,
      })

      if (response.success) {
        toast.success("Role created successfully")
        reset()
        setSelectedPermissions([])
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Failed to create role")
    }
  }

  const handlePermissionChange = (permissions: string[]) => {
    setSelectedPermissions(permissions)
    setValue("permissions", permissions)
  }

  const handleClose = () => {
    reset()
    setSelectedPermissions([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>Define a new role with specific permissions</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 pb-4">
              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input id="name" placeholder="ROLE_NAME" {...register("name")} />
                <p className="text-xs text-muted-foreground">
                  Use uppercase letters and underscores only (e.g., CONTENT_MANAGER)
                </p>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this role is for..."
                  {...register("description")}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              {/* Level */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Hierarchy Level</Label>
                  <span className="text-sm font-medium">{level}</span>
                </div>
                <Slider
                  value={[level]}
                  onValueChange={(value) => setValue("level", value[0])}
                  min={1}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers have higher authority. SUPERADMIN is level 1.
                </p>
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
                />
                {errors.permissions && <p className="text-sm text-destructive">{errors.permissions.message}</p>}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
