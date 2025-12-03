// Core User type
export interface User {
  id: number
  userName: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
  emailVerifiedAt?: string
  roles: string[]
  permissions: string[]
  lastLoginAt?: string
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

// Role type
export interface Role {
  id: number
  name: string
  description: string
  level: number
  isSystem: boolean
  permissions: string[]
  createdAt: string
  updatedAt: string
}

// Auth response from login/register
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  userId: number
  email: string
  roles: string[]
  emailVerified: boolean
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string>
}

// Auth request types
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
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

// Role management types
export interface CreateRoleRequest {
  name: string
  description: string
  level: number
  permissions: string[]
}

export interface UpdateRoleRequest {
  description: string
  permissions: string[]
}

export interface AssignRoleRequest {
  userId: number
  roleName: string
}

// User update type
export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  userName?: string
}

// Pagination
export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
