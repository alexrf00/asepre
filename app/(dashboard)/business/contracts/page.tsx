"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"

import { ContractsDataTable } from "@/components/business/contracts/contracts-data-table"
import { getAllContracts } from "@/lib/api/contracts"
import { getActiveClients } from "@/lib/api/clients"
import type { ContractStatus, Client } from "@/types/business"

export default function ContractsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">(
    (searchParams.get("status") as ContractStatus) || "all",
  )
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get("clientId") || "all")
  const [clients, setClients] = useState<Client[]>([])

  // Fetch clients for filter dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await getActiveClients()
        if (response.success && response.data) {
          setClients(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      }
    }
    fetchClients()
  }, [])

  // Fetch contracts
  const {
    data: contractsResponse,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    ["contracts", page, statusFilter, clientFilter],
    () =>
      getAllContracts(
        page,
        10,
        clientFilter !== "all" ? clientFilter : undefined,
        statusFilter !== "all" ? statusFilter : undefined,
      ),
    { revalidateOnFocus: false },
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (clientFilter !== "all") params.set("clientId", clientFilter)

    const queryString = params.toString()
    router.replace(`/business/contracts${queryString ? `?${queryString}` : ""}`, { scroll: false })
  }, [statusFilter, clientFilter, router])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleStatusFilterChange = (status: ContractStatus | "all") => {
    setStatusFilter(status)
    setPage(0)
  }

  const handleClientFilterChange = (clientId: string) => {
    setClientFilter(clientId)
    setPage(0)
  }

  const handleRefresh = () => {
    mutate()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground">Manage client service contracts and agreements</p>
      </div>

      <ContractsDataTable
        contracts={contractsResponse?.data ?? null}
        clients={clients}
        isLoading={isLoading}
        page={page}
        onPageChange={handlePageChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        clientFilter={clientFilter}
        onClientFilterChange={handleClientFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isValidating}
      />
    </div>
  )
}
