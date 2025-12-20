"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { FullPageLoader } from "@/components/common/loading-spinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean
}

export function ProtectedRoute({
  children,
  permission,
  permissions = [],
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

  // Check permissions
  const allPermissions = permission ? [permission, ...permissions] : permissions
  const allRoles = role ? [role, ...roles] : roles

  let hasAccess = true

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

  // SUPERADMIN always has access - use ?. for safety
  if (user?.roles?.includes("SUPERADMIN")) {
    hasAccess = true
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
