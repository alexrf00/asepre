"use client"

import { useAuthStore } from "@/lib/store/auth-store"
import type { ReactNode } from "react"

interface PermissionGateProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, user } = useAuthStore()

  // Collect all permissions to check
  const allPermissions = permission ? [permission, ...permissions] : permissions

  // Collect all roles to check
  const allRoles = role ? [role, ...roles] : roles

  let hasAccess = true

  // Check permissions
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

  // SUPERADMIN always has access
  if (user?.roles.includes("SUPERADMIN")) {
    hasAccess = true
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
