"use client"

// ===== Service Catalog Table =====

import { MoreHorizontal, Pencil, DollarSign, History, Ban, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PermissionGate } from "@/components/common/permission-gate"
import type { ServiceCatalog } from "@/lib/types/business"

interface ServiceTableProps {
  services: ServiceCatalog[]
  onEdit: (service: ServiceCatalog) => void
  onSetPrice: (service: ServiceCatalog) => void
  onViewHistory: (service: ServiceCatalog) => void
  onDeactivate: (service: ServiceCatalog) => void
}

export function ServiceTable({ services, onEdit, onSetPrice, onViewHistory, onDeactivate }: ServiceTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>ITBIS</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id} className={!service.active ? "opacity-50" : ""}>
              <TableCell className="font-mono text-sm">{service.code}</TableCell>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {service.description || "-"}
              </TableCell>
              <TableCell>{service.billingUnitName}</TableCell>
              <TableCell>
                {service.itbisApplicable ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>
                <Badge variant={service.active ? "default" : "secondary"}>
                  {service.active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <PermissionGate permissions={["BUSINESS_SERVICE_UPDATE"]}>
                      <DropdownMenuItem onClick={() => onEdit(service)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuSeparator />
                    <PermissionGate permissions={["BUSINESS_PRICE_UPDATE"]}>
                      <DropdownMenuItem onClick={() => onSetPrice(service)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Establecer precio
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuItem onClick={() => onViewHistory(service)}>
                      <History className="mr-2 h-4 w-4" />
                      Historial de precios
                    </DropdownMenuItem>
                    {service.active && (
                      <>
                        <DropdownMenuSeparator />
                        <PermissionGate permissions={["BUSINESS_SERVICE_DELETE"]}>
                          <DropdownMenuItem
                            onClick={() => onDeactivate(service)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        </PermissionGate>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
