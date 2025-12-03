"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { getTokens } from "@/lib/api/client"
import { FullPageLoader } from "@/components/common/loading-spinner"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const refreshAuth = useAuthStore((state) => state.refreshAuth)

  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = getTokens()
      if (accessToken) {
        await refreshAuth()
      }
      setIsInitialized(true)
    }

    initAuth()
  }, [refreshAuth])

  if (!isInitialized) {
    return <FullPageLoader message="Initializing..." />
  }

  return <>{children}</>
}
