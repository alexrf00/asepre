import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, LoginCredentials, RegisterCredentials } from "@/types"
import * as authApi from "@/lib/api/auth"
import * as usersApi from "@/lib/api/users"
import { getTokens, isTokenExpired } from "@/lib/api/client"

interface AuthStore {
  user: User | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (credentials: RegisterCredentials) => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<void>
  clearError: () => void

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

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          if (response.success && response.data) {
            // Fetch full user data
            const user = await usersApi.getCurrentUser()
            const permissionsData = await usersApi.getCurrentUserPermissions()

            set({
              user,
              permissions: permissionsData.permissions,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            set({ error: response.message, isLoading: false })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          })
          return false
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(credentials)
          if (response.success && response.data) {
            const user = await usersApi.getCurrentUser()
            const permissionsData = await usersApi.getCurrentUserPermissions()

            set({
              user,
              permissions: permissionsData.permissions,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            set({ error: response.message, isLoading: false })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          })
          return false
        }
      },

      logout: () => {
        authApi.logout()
        set({
          user: null,
          permissions: [],
          isAuthenticated: false,
          error: null,
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
