// ===== FILE: components/admin/users/suspend-user-dialog.tsx =====
// Dialog for suspending an active user

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Ban } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { suspendUser } from "@/lib/api/admin"
import { getInitials } from "@/lib/utils/formatters"
import type { User } from "@/types"

const suspendSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
})

type SuspendFormData = z.infer<typeof suspendSchema>

interface SuspendUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SuspendUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: SuspendUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendFormData>({
    resolver: zodResolver(suspendSchema),
  })

  const onSubmit = async (data: SuspendFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await suspendUser(user.id, {
        reason: data.reason,
      })

      if (response.success) {
        toast.success(`${user.firstName} ${user.lastName} has been suspended`)
        reset()
        onSuccess()
      } else {
        toast.error(response.message || "Failed to suspend user")
      }
    } catch {
      toast.error("Failed to suspend user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      reset()
    }
    onOpenChange(open)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Suspend User
          </DialogTitle>
          <DialogDescription>
            Suspend this user's account. They will be immediately logged out and unable to access the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User info */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-destructive/10 text-destructive">
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

          <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              The user's roles will be preserved. You can reactivate this account later.
            </AlertDescription>
          </Alert>

          {/* Suspension reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Suspension *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for suspending this user..."
              rows={4}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This reason will be logged for audit purposes and included in the notification email.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              Suspend User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
