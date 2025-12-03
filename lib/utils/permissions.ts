import type { User } from "@/types"

// Check if user has specific permission
export function can(user: User | null, permission: string): boolean {
  if (!user) return false
  if (user.roles.includes("SUPERADMIN")) return true
  return user.permissions.includes(permission)
}

// Check if user has any of the permissions
export function canAny(user: User | null, permissions: string[]): boolean {
  if (!user) return false
  if (user.roles.includes("SUPERADMIN")) return true
  return permissions.some((p) => user.permissions.includes(p))
}

// Check if user has all permissions
export function canAll(user: User | null, permissions: string[]): boolean {
  if (!user) return false
  if (user.roles.includes("SUPERADMIN")) return true
  return permissions.every((p) => user.permissions.includes(p))
}

// Check if user has role
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.roles.includes(role)
}

// Check if user has any of the roles
export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false
  return roles.some((r) => user.roles.includes(r))
}

// Role hierarchy (lower number = higher authority)
export const ROLE_HIERARCHY: Record<string, number> = {
  SUPERADMIN: 1,
  ADMINISTRADOR_GENERAL: 2,
  USER_ADMIN: 3,
  VIEWER: 4,
}

// Check if user has higher or equal role
export function hasHigherOrEqualRole(user: User | null, role: string): boolean {
  if (!user) return false
  const userHighestRole = Math.min(...user.roles.map((r) => ROLE_HIERARCHY[r] ?? 999))
  const targetLevel = ROLE_HIERARCHY[role] ?? 999
  return userHighestRole <= targetLevel
}

// Get role color for UI
export function getRoleColor(role: string): string {
  switch (role) {
    case "SUPERADMIN":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "ADMINISTRADOR_GENERAL":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "USER_ADMIN":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "VIEWER":
      return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

// Format permission for display
export function formatPermission(permission: string): string {
  return permission
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

// Group permissions by module
export function groupPermissionsByModule(permissions: string[]): Record<string, string[]> {
  return permissions.reduce(
    (acc, perm) => {
      const parts = perm.split("_")
      const module = parts[0]
      if (!acc[module]) acc[module] = []
      acc[module].push(perm)
      return acc
    },
    {} as Record<string, string[]>,
  )
}
