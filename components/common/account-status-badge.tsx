// ===== FILE: components/common/account-status-badge.tsx =====
// Reusable account status badge component

import { Clock, Mail, CheckCircle, Ban, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AccountStatus } from "@/types"

interface AccountStatusBadgeProps {
  status: AccountStatus
  showIcon?: boolean
  size?: "default" | "sm"
}

export function AccountStatusBadge({ 
  status, 
  showIcon = true,
  size = "default"
}: AccountStatusBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs py-0" : ""
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"

  switch (status) {
    case "PENDING_VERIFICATION":
      return (
        <Badge 
          variant="outline" 
          className={`bg-blue-500/10 text-blue-500 border-blue-500/20 ${sizeClasses}`}
        >
          {showIcon && <Mail className={`mr-1 ${iconSize}`} />}
          Pending Verification
        </Badge>
      )
    case "PENDING_APPROVAL":
      return (
        <Badge 
          variant="outline" 
          className={`bg-amber-500/10 text-amber-500 border-amber-500/20 ${sizeClasses}`}
        >
          {showIcon && <Clock className={`mr-1 ${iconSize}`} />}
          Pending Approval
        </Badge>
      )
    case "ACTIVE":
      return (
        <Badge 
          variant="outline" 
          className={`bg-emerald-500/10 text-emerald-500 border-emerald-500/20 ${sizeClasses}`}
        >
          {showIcon && <CheckCircle className={`mr-1 ${iconSize}`} />}
          Active
        </Badge>
      )
    case "SUSPENDED":
      return (
        <Badge 
          variant="outline" 
          className={`bg-red-500/10 text-red-500 border-red-500/20 ${sizeClasses}`}
        >
          {showIcon && <Ban className={`mr-1 ${iconSize}`} />}
          Suspended
        </Badge>
      )
    case "DEACTIVATED":
      return (
        <Badge 
          variant="outline" 
          className={`bg-gray-500/10 text-gray-500 border-gray-500/20 ${sizeClasses}`}
        >
          {showIcon && <Ban className={`mr-1 ${iconSize}`} />}
          Deactivated
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={sizeClasses}>
          {showIcon && <AlertCircle className={`mr-1 ${iconSize}`} />}
          {status}
        </Badge>
      )
  }
}

// Helper function to get status color for other components
export function getAccountStatusColor(status: AccountStatus): string {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "text-blue-500"
    case "PENDING_APPROVAL":
      return "text-amber-500"
    case "ACTIVE":
      return "text-emerald-500"
    case "SUSPENDED":
      return "text-red-500"
    case "DEACTIVATED":
      return "text-gray-500"
    default:
      return "text-muted-foreground"
  }
}

// Helper function to get status description
export function getAccountStatusDescription(status: AccountStatus): string {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "User has registered but hasn't verified their email address yet."
    case "PENDING_APPROVAL":
      return "User has verified their email and is waiting for administrator approval."
    case "ACTIVE":
      return "User account is active and has full access to the system."
    case "SUSPENDED":
      return "User account has been temporarily suspended. Roles are preserved."
    case "DEACTIVATED":
      return "User account has been permanently deactivated. Roles have been cleared."
    default:
      return "Unknown account status."
  }
}