// ===== FILE: components/admin/invites/create-invite-dialog.tsx =====
// Dialog for creating new invites

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Mail, Copy, Check } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { createInvite } from "@/lib/api/admin"
import { getRoles } from "@/lib/api/roles"
import type { Role, Invite } from "@/types"

// Validation schema
const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
})

type CreateInviteFormData = z.infer<typeof createInviteSchema>

interface CreateInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateInviteDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateInviteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  
  // Success state
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInviteFormData>({
    resolver: zodResolver(createInviteSchema),
  })

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset()
      setSelectedRoles([])
      setCreatedInvite(null)
      setCopied(false)
    }
  }, [open, reset])

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }

  const onSubmit = async (data: CreateInviteFormData) => {
    setIsLoading(true)
    try {
      const response = await createInvite({
        email: data.email,
        intendedRoles: selectedRoles.length > 0 ? selectedRoles : undefined,
        department: data.department || undefined,
        notes: data.notes || undefined,
      })

      if (response.success && response.data) {
        toast.success("Invite created successfully")
        setCreatedInvite(response.data)
      } else {
        toast.error(response.message || "Failed to create invite")
      }
    } catch {
      toast.error("Failed to create invite")
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteLink = () => {
    if (!createdInvite) return
    
    const link = `${window.location.origin}/register?invite=${createdInvite.token}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Invite link copied to clipboard")
    
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    if (createdInvite) {
      onSuccess()
    }
    onOpenChange(false)
  }

  // Success view after invite is created
  if (createdInvite) {
    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite=${createdInvite.token}`
    
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Invite Created!</DialogTitle>
            <DialogDescription className="text-center">
              An invitation has been created for {createdInvite.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyInviteLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with {createdInvite.email} to complete their registration
              </p>
            </div>

            {createdInvite.intendedRoles.length > 0 && (
              <div className="space-y-2">
                <Label>Assigned Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {createdInvite.intendedRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Create invite form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Invitation</DialogTitle>
          <DialogDescription>
            Send a registration invite to a new user. They will receive an email with a unique link to create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g., Engineering, Sales"
              {...register("department")}
            />
          </div>

          <div className="space-y-2">
            <Label>Intended Roles (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select roles to assign when the user is approved. If none selected, default role will be used.
            </p>
            {loadingRoles ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <ScrollArea className="h-[150px] rounded-md border p-2">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => toggleRole(role.name)}
                      />
                      <Label
                        htmlFor={`role-${role.id}`}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this invitation..."
              rows={3}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              Create Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}