import type { User } from "@/types"

/**
 * Permission utility functions for role-based access control
 * Updated to match backend V13 migration permission names
 * USER_ADMIN and ROLE_ADMIN were removed in V14 migration
 */

// Role hierarchy - higher number = lower privilege
export const ROLE_HIERARCHY: Record<string, number> = {
  SUPERADMIN: 1,
  ADMINISTRADOR_GENERAL: 2,
  VIEWER: 3,
}

// Valid roles in the system
export const VALID_ROLES = ["SUPERADMIN", "ADMINISTRADOR_GENERAL", "VIEWER"] as const
export type ValidRole = (typeof VALID_ROLES)[number]

// All permissions available in the system (matching backend V13 migration)
export const PERMISSIONS = {
  // Auth module permissions
  AUTH_USER_READ: "AUTH_USER_READ",
  AUTH_USER_LIST: "AUTH_USER_LIST",
  AUTH_USER_WRITE: "AUTH_USER_WRITE",
  AUTH_USER_DELETE: "AUTH_USER_DELETE",
  AUTH_USER_APPROVE: "AUTH_USER_APPROVE",
  AUTH_USER_ACTIVATE: "AUTH_USER_ACTIVATE",
  AUTH_ROLE_READ: "AUTH_ROLE_READ",
  AUTH_ROLE_WRITE: "AUTH_ROLE_WRITE",
  AUTH_ROLE_DELETE: "AUTH_ROLE_DELETE",
  AUTH_INVITE_CREATE: "AUTH_INVITE_CREATE",
  AUTH_INVITE_READ: "AUTH_INVITE_READ",
  AUTH_INVITE_LIST: "AUTH_INVITE_LIST",
  AUTH_INVITE_DELETE: "AUTH_INVITE_DELETE",
  AUTH_PERMISSION_READ: "AUTH_PERMISSION_READ",

  // Business module permissions (from V13 migration)
  CLIENTS_READ: "CLIENTS_READ",
  CLIENTS_WRITE: "CLIENTS_WRITE",
  CLIENTS_DELETE: "CLIENTS_DELETE",
  SERVICES_READ: "SERVICES_READ",
  SERVICES_WRITE: "SERVICES_WRITE",
  SERVICES_DELETE: "SERVICES_DELETE",
  PRICING_READ: "PRICING_READ",
  PRICING_WRITE: "PRICING_WRITE",
  CONTRACTS_READ: "CONTRACTS_READ",
  CONTRACTS_WRITE: "CONTRACTS_WRITE",
  CONTRACTS_DELETE: "CONTRACTS_DELETE",
  INVOICES_READ: "INVOICES_READ",
  INVOICES_WRITE: "INVOICES_WRITE",
  INVOICES_CANCEL: "INVOICES_CANCEL",
  PAYMENTS_READ: "PAYMENTS_READ",
  PAYMENTS_WRITE: "PAYMENTS_WRITE",
  RECEIPTS_READ: "RECEIPTS_READ",
  RECEIPTS_WRITE: "RECEIPTS_WRITE",
  RECEIPTS_VOID: "RECEIPTS_VOID",
  DASHBOARD_READ: "DASHBOARD_READ",
} as const

// Permissions that ADMINISTRADOR_GENERAL has access to (from V13 migration)
export const ADMIN_GENERAL_PERMISSIONS = [
  // Business permissions granted in V13
  "CLIENTS_READ",
  "CLIENTS_WRITE",
  "SERVICES_READ",
  "PRICING_READ",
  "CONTRACTS_READ",
  "CONTRACTS_WRITE",
  "INVOICES_READ",
  "INVOICES_WRITE",
  "PAYMENTS_READ",
  "PAYMENTS_WRITE",
  "RECEIPTS_READ",
  "RECEIPTS_WRITE",
  "DASHBOARD_READ",
  // Auth permissions from V2
  "AUTH_USER_READ",
  "AUTH_USER_LIST",
  "AUTH_USER_WRITE",
  "AUTH_ROLE_READ",
  "AUTH_INVITE_CREATE",
  "AUTH_INVITE_READ",
  "AUTH_INVITE_LIST",
  "AUTH_PERMISSION_READ",
]

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false

  // SUPERADMIN has all permissions
  if (user.role?.name === "SUPERADMIN") return true

  // ADMINISTRADOR_GENERAL has specific permissions
  if (user.role?.name === "ADMINISTRADOR_GENERAL") {
    if (ADMIN_GENERAL_PERMISSIONS.includes(permission)) return true
  }

  // Check explicit permissions
  return user.permissions?.includes(permission) ?? false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false

  // SUPERADMIN has all permissions
  if (user.role?.name === "SUPERADMIN") return true

  // Check if user has any of the permissions
  return permissions.some((permission) => hasPermission(user, permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user) return false

  // SUPERADMIN has all permissions
  if (user.role?.name === "SUPERADMIN") return true

  return permissions.every((permission) => hasPermission(user, permission))
}

/**
 * Check if user is a superadmin
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role?.name === "SUPERADMIN"
}

/**
 * Check if user is an administrador general
 */
export function isAdminGeneral(user: User | null): boolean {
  return user?.role?.name === "ADMINISTRADOR_GENERAL"
}

/**
 * Check if user is a viewer
 */
export function isViewer(user: User | null): boolean {
  return user?.role?.name === "VIEWER"
}

/**
 * Get color for role badge
 */
export function getRoleColor(roleName: string): string {
  switch (roleName) {
    case "SUPERADMIN":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "ADMINISTRADOR_GENERAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "VIEWER":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  }
}

/**
 * Get display name for role
 */
export function getRoleDisplayName(roleName: string): string {
  switch (roleName) {
    case "SUPERADMIN":
      return "Super Admin"
    case "ADMINISTRADOR_GENERAL":
      return "Administrador General"
    case "VIEWER":
      return "Viewer"
    default:
      return roleName
  }
}

/**
 * Check if user's role is higher or equal in hierarchy
 */
export function hasRoleLevel(user: User | null, requiredRole: string): boolean {
  if (!user?.role?.name) return false
  const userLevel = ROLE_HIERARCHY[user.role.name] ?? 999
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return userLevel <= requiredLevel
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.roles?.includes(role) || user.role?.name === role
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) return false
  return roles.some((r) => hasRole(user, r))
}

/**
 * Check if user has higher or equal role in hierarchy
 */
export function hasHigherOrEqualRole(user: User | null, role: string): boolean {
  if (!user) return false
  const userRoles = user.roles || (user.role?.name ? [user.role.name] : [])
  const userHighestRole = Math.min(...userRoles.map((r) => ROLE_HIERARCHY[r] ?? 999))
  const targetLevel = ROLE_HIERARCHY[role] ?? 999
  return userHighestRole <= targetLevel
}

/**
 * Format permission for display in UI
 * Used by PermissionTree component
 */
export function formatPermission(permission: string): string {
  return permission
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Group permissions by module for PermissionTree component
 * Groups permissions like AUTH_USER_READ under "AUTH", CLIENTS_READ under "CLIENTS", etc.
 */
export function groupPermissionsByModule(permissions: string[]): Record<string, string[]> {
  return permissions.reduce(
    (acc, perm) => {
      const parts = perm.split("_")
      // Use first part as module (AUTH, CLIENTS, SERVICES, etc.)
      const module = parts[0]
      if (!acc[module]) acc[module] = []
      acc[module].push(perm)
      return acc
    },
    {} as Record<string, string[]>,
  )
}

/**
 * Legacy compatibility functions
 * These map old function names to new implementations
 */
export const can = hasPermission
export const canAny = hasAnyPermission
export const canAll = hasAllPermissions