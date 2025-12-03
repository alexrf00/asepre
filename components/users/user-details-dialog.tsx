"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RoleBadge } from "@/components/common/role-badge"
import { Separator } from "@/components/ui/separator"
import type { User } from "@/types"
import { getInitials, formatDateTime, formatRelativeTime } from "@/lib/utils/formatters"
import { Mail, MailCheck, Lock, Unlock, Calendar, Clock } from "lucide-react"

interface UserDetailsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Detailed information about the user account</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">@{user.userName}</p>
              <div className="flex items-center gap-2 mt-1">
                {user.isLocked ? (
                  <Badge variant="destructive" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/20">
                    <Unlock className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                <MailCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <Mail className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm">{user.email}</span>
              <Badge variant={user.emailVerified ? "secondary" : "outline"} className="text-xs">
                {user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <RoleBadge key={role} role={role} />
              ))}
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Permissions ({user.permissions.length})</h4>
            <div className="max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {user.permissions.length > 0 ? (
                  user.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No specific permissions</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Created</span>
              </div>
              <p className="text-sm">{formatDateTime(user.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Last Login</span>
              </div>
              <p className="text-sm">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
