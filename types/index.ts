// ===== UPDATED TYPES FOR INVITE-ONLY REGISTRATION =====

// Account Status Enum
export type AccountStatus = 
  | 'PENDING_VERIFICATION' 
  | 'PENDING_APPROVAL' 
  | 'ACTIVE' 
  | 'SUSPENDED' 
  | 'DEACTIVATED'

// Invite Status Enum
export type InviteStatus = 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED'

// ===== Auth Types =====

export interface User {
  id: string
  userName: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
  emailVerifiedAt?: string
  accountStatus: AccountStatus
  roles: string[]
  permissions: string[]
  lastLoginAt?: string
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken?: string    // Only present for ACTIVE users on login
  refreshToken?: string   // Only present for ACTIVE users on login
  tokenType?: string
  userId: number
  email: string
  roles: string[]
  emailVerified: boolean
  accountStatus: AccountStatus
  message?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  userName: string
  email: string
  password: string
  firstName: string
  lastName: string
  inviteToken: string  // Required for invite-only registration
}

export interface LoginErrorResponse {
  accountNotActive?: boolean
  accountStatus?: AccountStatus
  message: string
  success: false
}

// ===== Registration Check Types =====

export interface RegistrationCheckResponse {
  available: boolean
  email?: string
  message: string
}

// ===== Email Verification Types =====

export interface VerifyEmailResponse {
  success: boolean
  message: string
  accountStatus?: AccountStatus
}

// ===== Invite Types =====

export interface Invite {
  id: number
  email: string
  token: string
  status: InviteStatus
  intendedRoles: string[]
  department?: string
  notes?: string
  createdBy: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
  usedBy?: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
  createdAt: string
  expiresAt: string
  usedAt?: string
  revokedAt?: string
}

export interface CreateInviteRequest {
  email: string
  intendedRoles?: string[]
  department?: string
  notes?: string
}

export interface InviteListResponse {
  content: Invite[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// ===== User Approval Types =====

export interface ApproveUserRequest {
  roles?: string[]
}

export interface RejectUserRequest {
  reason: string
}

export interface SuspendUserRequest {
  reason: string
}

export interface PendingUser extends User {
  inviteId?: number
  intendedRoles?: string[]
  department?: string
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  success: boolean
  message?: string
  error?: string
  data?: T
  timestamp?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ===== Role Types =====

export interface Role {
  id: string
  name: string
  description: string
  level: number
  permissions: string[]
  userCount?: number
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description: string
  level: number
  permissions: string[]
}

export interface UpdateRoleRequest {
  description?: string
  permissions?: string[]
}

export interface AssignRoleRequest {
  userId: string
  roleName: string
}

// ===== Other Types =====

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  userName?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}
