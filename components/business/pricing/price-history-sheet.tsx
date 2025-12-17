"use client"

// ===== Price History Sheet =====

import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { formatDOP, formatDateDO } from "@/lib/utils/business"
import { getGlobalPriceHistory } from "@/lib/api/business/pricing"
import type { ServiceCatalog, GlobalServicePrice } from "@/lib/types/business"

interface PriceHistorySheetProps {
  service: ServiceCatalog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PriceHistorySheet({ service, open, onOpenChange }: PriceHistorySheetProps) {
  const [history, setHistory] = useState<GlobalServicePrice[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (service && open) {
      setIsLoading(true)
      getGlobalPriceHistory(service.id)
        .then(setHistory)
        .catch(() => toast.error("Error al cargar historial"))
        .finally(() => setIsLoading(false))
    }
  }, [service, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Historial de Precios</SheetTitle>
          <SheetDescription>
            {service && (
              <>
                Servicio: <strong>{service.name}</strong> ({service.code})
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No hay historial de precios</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Precio</TableHead>
                  <TableHead>Vigente desde</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((price, index) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{formatDOP(price.price)}</TableCell>
                    <TableCell>{formatDateDO(price.effectiveFrom)}</TableCell>
                    <TableCell>
                      {index === 0 && price.active ? (
                        <Badge variant="default" className="bg-emerald-500">
                          Actual
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Histórico</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
