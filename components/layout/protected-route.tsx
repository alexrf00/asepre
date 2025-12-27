"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { FullPageLoader } from "@/components/common/loading-spinner"
import { ADMIN_GENERAL_PERMISSIONS } from "@/lib/utils/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requiredPermissions?: string[] // Alias for permissions
  role?: string
  roles?: string[]
  requireAll?: boolean
}

export function ProtectedRoute({
  children,
  permission,
  permissions = [],
  requiredPermissions = [],
  role,
  roles = [],
  requireAll = false,
}: ProtectedRouteProps) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const hasRole = useAuthStore((state) => state.hasRole)
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <FullPageLoader message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <FullPageLoader message="Redirecting to login..." />
  }

  // Collect all permissions to check (support both permissions and requiredPermissions)
  const allPermissions = [
    ...(permission ? [permission] : []),
    ...permissions,
    ...requiredPermissions,
  ]
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

    if (allRoles.length > 0 && hasAccess) {
      if (requireAll) {
        hasAccess = allRoles.every((r) => hasRole(r))
      } else {
        hasAccess = hasAnyRole(allRoles)
      }
    }
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    )
  }

  return <>{children}</>
}