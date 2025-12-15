// ===== FILE: components/admin/users/approve-user-dialog.tsx =====
// Dialog for approving a pending user

"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { UserCheck } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { approveUser } from "@/lib/api/admin"
import { getRoles } from "@/lib/api/roles"
import { getInitials } from "@/lib/utils/formatters"
import type { User, Role } from "@/types"

interface ApproveUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApproveUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ApproveUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await getRoles()
        setRoles(rolesData)
      } catch (error) {
        console.error("Failed to fetch roles:", error)
      } finally {
        setLoadingRoles(false)
      }
    }

    if (open) {
      fetchRoles()
    }
  }, [open])

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedRoles([])
    }
  }, [open])

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }

  const handleApprove = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await approveUser(user.id, {
        roles: selectedRoles.length > 0 ? selectedRoles : undefined,
      })

      if (response.success) {
        toast.success(`${user.firstName} ${user.lastName} has been approved`)
        onSuccess()
      } else {
        toast.error(response.message || "Failed to approve user")
      }
    } catch {
      toast.error("Failed to approve user")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-500" />
            Approve User
          </DialogTitle>
          <DialogDescription>
            Review and approve this user's registration request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User info */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">@{user.userName}</p>
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <Label>Assign Roles (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Select roles to assign to this user. If none selected, the default role from their invitation will be used.
            </p>
            {loadingRoles ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border p-2">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`approve-role-${role.id}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => toggleRole(role.name)}
                      />
                      <Label
                        htmlFor={`approve-role-${role.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-muted-foreground ml-2">
                            — {role.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedRoles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedRoles.join(", ")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Approve User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}