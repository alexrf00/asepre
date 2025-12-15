// ===== FILE: lib/store/auth-store.ts =====
// Updated auth store with account status handling

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, LoginCredentials, RegisterCredentials, AccountStatus, LoginErrorResponse } from "@/types"
import * as authApi from "@/lib/api/auth"
import * as usersApi from "@/lib/api/users"
import { getTokens, isTokenExpired } from "@/lib/api/client"

interface LoginResult {
  success: boolean
  accountNotActive?: boolean
  accountStatus?: AccountStatus
  message?: string
}

interface RegisterResult {
  success: boolean
  accountStatus?: AccountStatus
  message?: string
}

interface AuthStore {
  user: User | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Account status for login errors
  loginAccountStatus: AccountStatus | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<LoginResult>
  register: (credentials: RegisterCredentials) => Promise<RegisterResult>
  logout: () => void
  refreshAuth: () => Promise<void>
  clearError: () => void
  clearLoginStatus: () => void

  // Permission helpers
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      loginAccountStatus: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null, loginAccountStatus: null })
        try {
          const response = await authApi.login(credentials)
          
          // Check for account not active error
          if ('accountNotActive' in response && response.accountNotActive) {
            const errorResponse = response as LoginErrorResponse
            set({ 
              error: errorResponse.message, 
              isLoading: false,
              loginAccountStatus: errorResponse.accountStatus || null
            })
            return { 
              success: false, 
              accountNotActive: true,
              accountStatus: errorResponse.accountStatus,
              message: errorResponse.message
            }
          }

          // Successful login
          if ('success' in response && response.success && response.data) {
            // Fetch full user data
            const user = await usersApi.getCurrentUser()
            const permissionsData = await usersApi.getCurrentUserPermissions()

            set({
              user,
              permissions: permissionsData.permissions,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true }
          } else {
            const msg = 'message' in response ? response.message : "Login failed"
            set({ error: msg, isLoading: false })
            return { success: false, message: msg }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Login failed"
          set({
            error: message,
            isLoading: false,
          })
          return { success: false, message }
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(credentials)
          
          if (response.success) {
            // Registration successful - user needs to verify email
            // Do NOT set authenticated or fetch user data
            set({ isLoading: false })
            return { 
              success: true, 
              accountStatus: response.data?.accountStatus,
              message: response.message
            }
          } else {
            set({ error: response.message, isLoading: false })
            return { success: false, message: response.message }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Registration failed"
          set({
            error: message,
            isLoading: false,
          })
          return { success: false, message }
        }
      },

      logout: () => {
        authApi.logout()
        set({
          user: null,
          permissions: [],
          isAuthenticated: false,
          error: null,
          loginAccountStatus: null,
        })
      },

      refreshAuth: async () => {
        const { accessToken } = getTokens()
        if (!accessToken || isTokenExpired(accessToken)) {
          get().logout()
          return
        }

        try {
          const user = await usersApi.getCurrentUser()
          const permissionsData = await usersApi.getCurrentUserPermissions()
          set({
            user,
            permissions: permissionsData.permissions,
            isAuthenticated: true,
          })
        } catch {
          get().logout()
        }
      },

      clearError: () => set({ error: null }),
      
      clearLoginStatus: () => set({ loginAccountStatus: null }),

      hasPermission: (permission) => {
        const { permissions, user } = get()
        // SUPERADMIN has all permissions
        if (user?.roles.includes("SUPERADMIN")) return true
        return permissions.includes(permission)
      },

      hasRole: (role) => {
        const { user } = get()
        return user?.roles.includes(role) ?? false
      },

      hasAnyPermission: (perms) => {
        const { permissions, user } = get()
        if (user?.roles.includes("SUPERADMIN")) return true
        return perms.some((p) => permissions.includes(p))
      },

      hasAnyRole: (roles) => {
        const { user } = get()
        return roles.some((r) => user?.roles.includes(r))
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)