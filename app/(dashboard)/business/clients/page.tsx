"use client"

// ===== Clients List Page =====

import { useState, useEffect, useCallback } from "react"
import { Building2, Plus, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatsCard } from "@/components/dashboard/stats-card"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { PermissionGate } from "@/components/common/permission-gate"
import { ClientTable } from "@/components/business/clients/client-table"
import { CreateClientDialog } from "@/components/business/clients/create-client-dialog"
import { EditClientDialog } from "@/components/business/clients/edit-client-dialog"
import { getClients, getClientStats, deleteClient, getLegalTypes } from "@/lib/api/business/clients"
import type { Client, ClientStatus, LegalType } from "@/lib/types/business"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function ClientsPage() {
  // Data state
  const [clients, setClients] = useState<Client[]>([])
  const [legalTypes, setLegalTypes] = useState<LegalType[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, suspended: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Pagination state
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "ALL">("ALL")
  const [legalTypeFilter, setLegalTypeFilter] = useState<string>("ALL")

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deactivatingClient, setDeactivatingClient] = useState<Client | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [clientsResponse, statsResponse, typesResponse] = await Promise.all([
        getClients(page, pageSize, statusFilter === "ALL" ? undefined : statusFilter, searchTerm || undefined),
        getClientStats(),
        getLegalTypes(),
      ])

      setClients(clientsResponse.content)
      setTotalPages(clientsResponse.totalPages)
      setStats(statsResponse)
      setLegalTypes(typesResponse)
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchTerm])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  async function handleDeactivate() {
    if (!deactivatingClient) return

    setIsDeactivating(true)
    try {
      const response = await deleteClient(deactivatingClient.id)
      if (response.success) {
        toast.success("Cliente desactivado")
        loadData()
      } else {
        toast.error(response.message || "Error al desactivar cliente")
      }
    } catch {
      toast.error("Error al desactivar cliente")
    } finally {
      setIsDeactivating(false)
      setDeactivatingClient(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestione los clientes de ASEPRE</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <PermissionGate permissions={["BUSINESS_CLIENT_CREATE"]}>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Clientes" value={stats.total} icon={Building2} />
        <StatsCard title="Activos" value={stats.active} icon={Building2} className="border-l-4 border-l-emerald-500" />
        <StatsCard
          title="Inactivos / Suspendidos"
          value={stats.inactive + stats.suspended}
          icon={Building2}
          className="border-l-4 border-l-gray-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RNC o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatus | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="ACTIVE">Activo</SelectItem>
            <SelectItem value="INACTIVE">Inactivo</SelectItem>
            <SelectItem value="SUSPENDED">Suspendido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={legalTypeFilter} onValueChange={setLegalTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo legal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {legalTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hay clientes"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "No se encontraron clientes con los filtros aplicados"
              : "Comience agregando su primer cliente"
          }
          action={
            !searchTerm &&
            statusFilter === "ALL" && (
              <PermissionGate permissions={["BUSINESS_CLIENT_CREATE"]}>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </PermissionGate>
            )
          }
        />
      ) : (
        <>
          <ClientTable
            clients={clients}
            onEdit={(client) => setEditingClient(client)}
            onDeactivate={(client) => setDeactivatingClient(client)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink onClick={() => setPage(i)} isActive={page === i} className="cursor-pointer">
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    className={page === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Dialogs */}
      <CreateClientDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={loadData} />

      <EditClientDialog
        client={editingClient}
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        onSuccess={loadData}
      />

      <ConfirmDialog
        open={!!deactivatingClient}
        onOpenChange={(open) => !open && setDeactivatingClient(null)}
        title="Desactivar Cliente"
        description={`¿Está seguro de desactivar a ${deactivatingClient?.name}? El cliente no podrá ser seleccionado para nuevos contratos o facturas.`}
        confirmText="Desactivar"
        variant="destructive"
        onConfirm={handleDeactivate}
        isLoading={isDeactivating}
      />
    </div>
  )
}
