"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { ServicesDataTable } from "@/components/business/services/services-data-table"
import { BillingUnitsCard } from "@/components/business/services/billing-units-card"
import { getAllServices } from "@/lib/api/services"
import type { ServiceCatalog } from "@/types/business"
import type { PaginatedResponse } from "@/types"

const PAGE_SIZE = 10

export default function ServicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State from URL params
  const initialPage = Number.parseInt(searchParams.get("page") || "0")
  const initialSearch = searchParams.get("search") || ""
  const initialShowInactive = searchParams.get("showInactive") === "true"

  const [services, setServices] = useState<PaginatedResponse<ServiceCatalog> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter states
  const [page, setPage] = useState(initialPage)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [showInactive, setShowInactive] = useState(initialShowInactive)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)

  // Update URL when filters change
  const updateUrl = useCallback(
    (newPage: number, newSearch: string, newShowInactive: boolean) => {
      const params = new URLSearchParams()
      if (newPage > 0) params.set("page", newPage.toString())
      if (newSearch) params.set("search", newSearch)
      if (newShowInactive) params.set("showInactive", "true")
      const queryString = params.toString()
      router.replace(`/business/services${queryString ? `?${queryString}` : ""}`, { scroll: false })
    },
    [router],
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch services
  const fetchServices = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getAllServices(page, PAGE_SIZE, debouncedSearch || undefined, !showInactive)
      if (response.success && response.data) {
        setServices(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [page, debouncedSearch, showInactive])

  useEffect(() => {
    fetchServices()
    updateUrl(page, debouncedSearch, showInactive)
  }, [fetchServices, updateUrl, page, debouncedSearch, showInactive])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchServices()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleShowInactiveChange = (show: boolean) => {
    setShowInactive(show)
    setPage(0) // Reset to first page
  }

  return (
    <ProtectedRoute requiredPermissions={["BUSINESS_SERVICE_READ"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services Catalog</h1>
          <p className="text-muted-foreground">Manage the catalog of services available for contracts and invoicing.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <ServicesDataTable
            services={services}
            isLoading={isLoading}
            page={page}
            onPageChange={handlePageChange}
            showInactive={showInactive}
            onShowInactiveChange={handleShowInactiveChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <div className="hidden lg:block">
            <BillingUnitsCard />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
