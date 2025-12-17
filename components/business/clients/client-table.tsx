"use client"

// ===== Client Data Table =====

import { MoreHorizontal, Eye, Pencil, FileText, Receipt, Ban } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/business/common/status-badge"
import { PermissionGate } from "@/components/common/permission-gate"
import { formatDateDO, formatRNC } from "@/lib/utils/business"
import type { Client } from "@/lib/types/business"

interface ClientTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDeactivate: (client: Client) => void
}

export function ClientTable({ clients, onEdit, onDeactivate }: ClientTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>RNC</TableHead>
            <TableHead>Tipo Legal</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div>
                  <Link href={`/business/clients/${client.id}`} className="font-medium hover:underline">
                    {client.name}
                  </Link>
                  {client.legalName && client.legalName !== client.name && (
                    <p className="text-sm text-muted-foreground">{client.legalName}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{client.rnc ? formatRNC(client.rnc) : "-"}</TableCell>
              <TableCell>{client.legalTypeName}</TableCell>
              <TableCell className="text-sm">{client.primaryEmail || "-"}</TableCell>
              <TableCell className="text-sm">{client.primaryPhone || "-"}</TableCell>
              <TableCell>
                <StatusBadge type="client" status={client.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDateDO(client.createdAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/business/clients/${client.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGate permissions={["BUSINESS_CLIENT_UPDATE"]}>
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/business/contracts?clientId=${client.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver contratos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/business/invoices?clientId=${client.id}`}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Ver facturas
                      </Link>
                    </DropdownMenuItem>
                    {client.status === "ACTIVE" && (
                      <>
                        <DropdownMenuSeparator />
                        <PermissionGate permissions={["BUSINESS_CLIENT_DELETE"]}>
                          <DropdownMenuItem
                            onClick={() => onDeactivate(client)}
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
