"use client"

import { useAuthStore } from "@/lib/store/auth-store"
import type { ReactNode } from "react"
import { ADMIN_GENERAL_PERMISSIONS } from "@/lib/utils/permissions"
import { AlertCircle, Lock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PermissionGateProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: ReactNode
  showError?: boolean
  showAccessDenied?: boolean
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  showError = false,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, user } = useAuthStore()

  // Collect all permissions to check
  const allPermissions = permission ? [permission, ...permissions] : permissions

  // Collect all roles to check
  const allRoles = role ? [role, ...roles] : roles

  let hasAccess = true

  // SUPERADMIN always has access
  if (user?.roles?.includes("SUPERADMIN")) {
    hasAccess = true
  } else if (user?.roles?.includes("ADMINISTRADOR_GENERAL")) {
    // ADMINISTRADOR_GENERAL has access to specific permissions
    if (allPermissions.length > 0) {
      if (requireAll) {
        hasAccess = allPermissions.every((p) => ADMIN_GENERAL_PERMISSIONS.includes(p) || hasPermission(p))
      } else {
        hasAccess = allPermissions.some((p) => ADMIN_GENERAL_PERMISSIONS.includes(p) || hasPermission(p))
      }
    }
    // Check roles if needed
    if (allRoles.length > 0 && hasAccess) {
      if (requireAll) {
        hasAccess = allRoles.every((r) => r === "ADMINISTRADOR_GENERAL" || hasRole(r))
      } else {
        hasAccess = allRoles.some((r) => r === "ADMINISTRADOR_GENERAL" || hasRole(r))
      }
    }
  } else {
    // Other users - check permissions normally
    if (allPermissions.length > 0) {
      if (requireAll) {
        hasAccess = allPermissions.every((p) => hasPermission(p))
      } else {
        hasAccess = hasAnyPermission(allPermissions)
      }
    }

    // Check roles
    if (allRoles.length > 0 && hasAccess) {
      if (requireAll) {
        hasAccess = allRoles.every((r) => hasRole(r))
      } else {
        hasAccess = hasAnyRole(allRoles)
      }
    }
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You don't have permission to access this feature.</AlertDescription>
        </Alert>
      )
    }

    if (showAccessDenied) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground mt-1">You don't have permission to view this content.</p>
        </div>
      )
    }

    return <>{fallback}</>
  }

  return <>{children}</>
}