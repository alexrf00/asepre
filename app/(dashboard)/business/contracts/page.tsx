"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatsCard } from "@/components/dashboard/stats-card"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { ContractTable } from "@/components/business/contracts/contract-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Plus, Search, Filter, AlertTriangle } from "lucide-react"
import type { Contract } from "@/lib/types/business"
import { contractsApi } from "@/lib/api/business/contracts"
import { formatCurrency } from "@/lib/utils/business"
import { toast } from "sonner"
import Link from "next/link"

export default function ContractsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contractToCancel, setContractToCancel] = useState<Contract | null>(null)
  const [contractToActivate, setContractToActivate] = useState<Contract | null>(null)

  const { data, error, isLoading, mutate } = useSWR(["contracts", search, statusFilter, page], () =>
    contractsApi.getAll({
      search,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page,
      limit: 10,
    }),
  )

  const handleCancel = async () => {
    if (!contractToCancel) return
    try {
      await contractsApi.cancel(contractToCancel.id)
      toast.success("Contrato cancelado exitosamente")
      mutate()
    } catch {
      toast.error("Error al cancelar el contrato")
    } finally {
      setContractToCancel(null)
    }
  }

  const handleActivate = async () => {
    if (!contractToActivate) return
    try {
      await contractsApi.activate(contractToActivate.id)
      toast.success("Contrato activado exitosamente")
      mutate()
    } catch {
      toast.error("Error al activar el contrato")
    } finally {
      setContractToActivate(null)
    }
  }

  const contracts = data?.data || []
  const stats = {
    total: data?.pagination?.total || 0,
    active: contracts.filter((c) => c.status === "active").length,
    expiringSoon: contracts.filter((c) => {
      if (!c.endDate) return false
      const daysUntilEnd = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilEnd <= 30 && daysUntilEnd > 0
    }).length,
    monthlyRevenue: contracts.filter((c) => c.status === "active").reduce((sum, c) => sum + c.monthlyValue, 0),
  }

  return (
    <PermissionGate permissions={["contracts.view"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
            <p className="text-muted-foreground">Gestione los contratos de servicios con sus clientes</p>
          </div>
          <PermissionGate permissions={["contracts.create"]}>
            <Button asChild>
              <Link href="/business/contracts/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Contrato
              </Link>
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            <>
              <StatsCard title="Total Contratos" value={stats.total} icon={FileText} />
              <StatsCard
                title="Contratos Activos"
                value={stats.active}
                icon={FileText}
                trend={{ value: 0, isPositive: true }}
              />
              <StatsCard
                title="Por Vencer (30 días)"
                value={stats.expiringSoon}
                icon={AlertTriangle}
                className={stats.expiringSoon > 0 ? "border-amber-500" : ""}
              />
              <StatsCard title="Ingreso Mensual" value={formatCurrency(stats.monthlyRevenue)} icon={FileText} />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de contrato o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error al cargar"
            description="No se pudieron cargar los contratos"
            action={{
              label: "Reintentar",
              onClick: () => mutate(),
            }}
          />
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin contratos"
            description="No hay contratos que coincidan con los filtros"
            action={{
              label: "Crear Contrato",
              href: "/business/contracts/new",
            }}
          />
        ) : (
          <ContractTable
            contracts={contracts}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onEdit={() => {}}
            onCancel={setContractToCancel}
            onActivate={setContractToActivate}
            onRenew={() => {}}
          />
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {contracts.length} de {data.pagination.total} contratos
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Dialog */}
        <AlertDialog open={!!contractToCancel} onOpenChange={() => setContractToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Contrato</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea cancelar el contrato {contractToCancel?.contractNumber}? Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                Sí, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Activate Dialog */}
        <AlertDialog open={!!contractToActivate} onOpenChange={() => setContractToActivate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activar Contrato</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea activar el contrato {contractToActivate?.contractNumber}? Una vez activado, se
                comenzará a facturar según los términos establecidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleActivate}>Activar Contrato</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGate>
  )
}
