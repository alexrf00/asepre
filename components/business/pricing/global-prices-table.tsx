"use client"

// ===== Global Prices Table =====

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DollarSign, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { formatDOP, formatDateDO } from "@/lib/utils/business"
import { getAllGlobalPrices } from "@/lib/api/business/pricing"
import { getServices } from "@/lib/api/business/services"
import type { GlobalServicePrice, ServiceCatalog } from "@/lib/types/business"

interface GlobalPricesTableProps {
  onSetPrice: (service: ServiceCatalog) => void
  onViewHistory: (service: ServiceCatalog) => void
}

export function GlobalPricesTable({ onSetPrice, onViewHistory }: GlobalPricesTableProps) {
  const [prices, setPrices] = useState<GlobalServicePrice[]>([])
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [pricesData, servicesData] = await Promise.all([getAllGlobalPrices(), getServices(true)])
        setPrices(pricesData)
        setServices(servicesData)
      } catch {
        toast.error("Error al cargar precios")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  // Combine services with their prices
  const servicesWithPrices = services.map((service) => ({
    service,
    price: prices.find((p) => p.serviceId === service.id),
  }))

  if (servicesWithPrices.length === 0) {
    return <EmptyState icon={DollarSign} title="Sin servicios" description="No hay servicios en el catálogo" />
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Servicio</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Precio actual</TableHead>
            <TableHead>Vigente desde</TableHead>
            <TableHead className="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicesWithPrices.map(({ service, price }) => (
            <TableRow key={service.id}>
              <TableCell className="font-mono text-sm">{service.code}</TableCell>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{service.billingUnitName}</TableCell>
              <TableCell>
                {price ? (
                  <span className="font-medium">{formatDOP(price.price)}</span>
                ) : (
                  <Badge variant="secondary">Sin precio</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {price ? formatDateDO(price.effectiveFrom) : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <PermissionGate permissions={["BUSINESS_PRICE_UPDATE"]}>
                    <Button variant="ghost" size="icon" onClick={() => onSetPrice(service)} title="Establecer precio">
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  </PermissionGate>
                  <Button variant="ghost" size="icon" onClick={() => onViewHistory(service)} title="Ver historial">
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
