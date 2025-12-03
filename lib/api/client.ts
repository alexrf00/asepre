import type { ApiResponse, AuthResponse } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Token management
let accessToken: string | null = null
let refreshToken: string | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", access)
    localStorage.setItem("refreshToken", refresh)
  }
}

export function getTokens() {
  if (typeof window !== "undefined" && !accessToken) {
    accessToken = localStorage.getItem("accessToken")
    refreshToken = localStorage.getItem("refreshToken")
  }
  return { accessToken, refreshToken }
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  }
}

// Decode JWT without library
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || typeof decoded.exp !== "number") return true
  return decoded.exp * 1000 < Date.now()
}

// Refresh token
async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken: refresh } = getTokens()
  if (!refresh) return false

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data: ApiResponse<AuthResponse> = await response.json()
    if (data.success && data.data) {
      setTokens(data.data.accessToken, data.data.refreshToken)
      return true
    }
    return false
  } catch {
    clearTokens()
    return false
  }
}

// Main API client
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { accessToken: token } = getTokens()

  // Check if token is expired and refresh if needed
  if (token && isTokenExpired(token)) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      throw new Error("Session expired. Please login again.")
    }
  }

  const { accessToken: currentToken } = getTokens()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 - try refresh once
  if (response.status === 401 && currentToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const { accessToken: newToken } = getTokens()
      headers["Authorization"] = `Bearer ${newToken}`
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })
      return retryResponse.json()
    }
    clearTokens()
    throw new Error("Session expired. Please login again.")
  }

  return response.json()
}
