"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { RoleBadge } from "@/components/common/role-badge"
import type { User, Role } from "@/types"
import { getRoles, assignRole, revokeRole } from "@/lib/api/roles"

interface AssignRolesDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AssignRolesDialog({ user, open, onOpenChange, onSuccess }: AssignRolesDialogProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadRoles()
    }
  }, [open])

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles)
    }
  }, [user])

  const loadRoles = async () => {
    setIsLoading(true)
    try {
      const data = await getRoles()
      setRoles(data)
    } catch {
      toast.error("Failed to load roles")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) => (prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter((r) => !user.roles.includes(r))
      const rolesToRemove = user.roles.filter((r) => !selectedRoles.includes(r))

      // Process all changes
      const promises: Promise<unknown>[] = []

      for (const roleName of rolesToAdd) {
        promises.push(assignRole({ userId: user.id, roleName }))
      }

      for (const roleName of rolesToRemove) {
        promises.push(revokeRole({ userId: user.id, roleName }))
      }

      await Promise.all(promises)

      toast.success("Roles updated successfully")
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error("Failed to update roles")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  const hasChanges = selectedRoles.length !== user.roles.length || !selectedRoles.every((r) => user.roles.includes(r))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Manage roles for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Roles */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Current Roles</Label>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <RoleBadge key={role} role={role} />
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Available Roles</Label>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => handleRoleToggle(role.name)}
                        disabled={role.isSystem && role.name === "SUPERADMIN"}
                      />
                      <div>
                        <Label htmlFor={`role-${role.id}`} className="font-medium cursor-pointer">
                          <RoleBadge role={role.name} />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                      </div>
                    </div>
                    {selectedRoles.includes(role.name) !== user.roles.includes(role.name) && (
                      <div className="flex items-center gap-1">
                        {selectedRoles.includes(role.name) ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <LoadingSpinner size="sm" className="mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
