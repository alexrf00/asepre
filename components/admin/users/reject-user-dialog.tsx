// ===== FILE: components/admin/users/reject-user-dialog.tsx =====
// Dialog for rejecting a pending user registration

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UserX } from "lucide-react"

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
import { rejectUser } from "@/lib/api/admin"
import { getInitials } from "@/lib/utils/formatters"
import type { User } from "@/types"

const rejectSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
})

type RejectFormData = z.infer<typeof rejectSchema>

interface RejectUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RejectUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RejectUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  })

  const onSubmit = async (data: RejectFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await rejectUser(user.id, {
        reason: data.reason,
      })

      if (response.success) {
        toast.success(`${user.firstName} ${user.lastName}'s registration has been rejected`)
        reset()
        onSuccess()
      } else {
        toast.error(response.message || "Failed to reject user")
      }
    } catch {
      toast.error("Failed to reject user")
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
            <UserX className="h-5 w-5 text-destructive" />
            Reject Registration
          </DialogTitle>
          <DialogDescription>
            Reject this user's registration request. They will be notified and their account will be removed.
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

          <Alert variant="destructive">
            <AlertDescription>
              This action cannot be undone. The user will need to request a new invitation to register again.
            </AlertDescription>
          </Alert>

          {/* Rejection reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Rejection *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for rejecting this registration..."
              rows={4}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This reason will be included in the notification email sent to the user.
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
              Reject Registration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}