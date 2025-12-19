"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { ClientStatsCards } from "@/components/business/clients/client-stats-cards"
import { ClientsDataTable } from "@/components/business/clients/clients-data-table"
import { getAllClients, getClientStats } from "@/lib/api/clients"
import type { Client, ClientStats, ClientStatus } from "@/types/business"
import type { PaginatedResponse } from "@/types"

export default function ClientsPage() {
  // Data states
  const [clients, setClients] = useState<PaginatedResponse<Client> | null>(null)
  const [stats, setStats] = useState<ClientStats | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true)
      const response = await getClientStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (err) {
      console.error("Failed to fetch client stats:", err)
    } finally {
      setIsStatsLoading(false)
    }
  }, [])

  // Fetch clients
  const fetchClients = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
        setError(null)

        const status = statusFilter === "all" ? undefined : statusFilter
        const response = await getAllClients(page, 10, status, debouncedSearch || undefined)

        if (response.success && response.data) {
          setClients(response.data)
        } else {
          setError(response.message || "Failed to load clients")
        }
      } catch (err) {
        console.error("Failed to fetch clients:", err)
        setError("Failed to load clients. Please try again.")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [page, statusFilter, debouncedSearch],
  )

  // Initial load
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Refresh handler that updates both clients and stats
  const handleRefresh = useCallback(() => {
    fetchClients(true)
    fetchStats()
  }, [fetchClients, fetchStats])

  // Handle status filter change
  const handleStatusFilterChange = (status: ClientStatus | "all") => {
    setStatusFilter(status)
    setPage(0) // Reset to first page on filter change
  }

  if (isLoading && !clients) {
    return (
      <ProtectedRoute permission="BUSINESS_CLIENT_READ">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="BUSINESS_CLIENT_READ">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">Manage your business clients and their information</p>
        </div>

        {/* Stats Cards */}
        <ClientStatsCards stats={stats} isLoading={isStatsLoading} />

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchClients()} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <ClientsDataTable
          clients={clients}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
    </ProtectedRoute>
  )
}
