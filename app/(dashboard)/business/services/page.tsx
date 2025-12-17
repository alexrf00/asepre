"use client"

// ===== Services Catalog Page =====

import { useState, useEffect, useCallback } from "react"
import { Briefcase, Plus, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { PermissionGate } from "@/components/common/permission-gate"
import { ServiceTable } from "@/components/business/services/service-table"
import { CreateServiceDialog } from "@/components/business/services/create-service-dialog"
import { SetPriceDialog } from "@/components/business/pricing/set-price-dialog"
import { PriceHistorySheet } from "@/components/business/pricing/price-history-sheet"
import { getServices, deleteService } from "@/lib/api/business/services"
import type { ServiceCatalog } from "@/lib/types/business"

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pricingService, setPricingService] = useState<ServiceCatalog | null>(null)
  const [historyService, setHistoryService] = useState<ServiceCatalog | null>(null)
  const [deactivatingService, setDeactivatingService] = useState<ServiceCatalog | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadServices = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getServices(!showInactive)
      setServices(data)
    } catch {
      toast.error("Error al cargar servicios")
    } finally {
      setIsLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Filter services by search term
  const filteredServices = services.filter(
    (service) =>
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  async function handleDeactivate() {
    if (!deactivatingService) return

    setIsDeactivating(true)
    try {
      const response = await deleteService(deactivatingService.id)
      if (response.success) {
        toast.success("Servicio desactivado")
        loadServices()
      } else {
        toast.error(response.message || "Error al desactivar servicio")
      }
    } catch {
      toast.error("Error al desactivar servicio")
    } finally {
      setIsDeactivating(false)
      setDeactivatingService(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h1>
          <p className="text-muted-foreground">Gestione los servicios ofrecidos por ASEPRE</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadServices}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <PermissionGate permissions={["BUSINESS_SERVICE_CREATE"]}>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Servicio
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="showInactive" checked={showInactive} onCheckedChange={(v) => setShowInactive(v as boolean)} />
          <Label htmlFor="showInactive" className="text-sm text-muted-foreground cursor-pointer">
            Mostrar inactivos
          </Label>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No hay servicios"
          description={searchTerm ? "No se encontraron servicios con ese criterio" : "Comience agregando un servicio"}
          action={
            !searchTerm && (
              <PermissionGate permissions={["BUSINESS_SERVICE_CREATE"]}>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Servicio
                </Button>
              </PermissionGate>
            )
          }
        />
      ) : (
        <ServiceTable
          services={filteredServices}
          onEdit={() => {}}
          onSetPrice={(service) => setPricingService(service)}
          onViewHistory={(service) => setHistoryService(service)}
          onDeactivate={(service) => setDeactivatingService(service)}
        />
      )}

      {/* Dialogs */}
      <CreateServiceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={loadServices} />

      <SetPriceDialog
        service={pricingService}
        open={!!pricingService}
        onOpenChange={(open) => !open && setPricingService(null)}
        onSuccess={loadServices}
      />

      <PriceHistorySheet
        service={historyService}
        open={!!historyService}
        onOpenChange={(open) => !open && setHistoryService(null)}
      />

      <ConfirmDialog
        open={!!deactivatingService}
        onOpenChange={(open) => !open && setDeactivatingService(null)}
        title="Desactivar Servicio"
        description={`¿Está seguro de desactivar "${deactivatingService?.name}"? El servicio no podrá ser seleccionado para nuevos contratos.`}
        confirmText="Desactivar"
        variant="destructive"
        onConfirm={handleDeactivate}
        isLoading={isDeactivating}
      />
    </div>
  )
}
