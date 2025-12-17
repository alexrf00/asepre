"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Eye, Pencil, FileText, XCircle, CheckCircle, RotateCcw } from "lucide-react"
import type { Contract } from "@/lib/types/business"
import { StatusBadge } from "../common/status-badge"
import { MoneyDisplay } from "../common/money-display"
import { formatDate } from "@/lib/utils/business"
import Link from "next/link"

interface ContractTableProps {
  contracts: Contract[]
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
  onEdit: (contract: Contract) => void
  onCancel: (contract: Contract) => void
  onActivate: (contract: Contract) => void
  onRenew: (contract: Contract) => void
}

export function ContractTable({
  contracts,
  selectedIds,
  onSelectChange,
  onEdit,
  onCancel,
  onActivate,
  onRenew,
}: ContractTableProps) {
  const allSelected = contracts.length > 0 && selectedIds.length === contracts.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < contracts.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectChange([])
    } else {
      onSelectChange(contracts.map((c) => c.id))
    }
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectChange([...selectedIds, id])
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todos"
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead className="text-right">Valor Mensual</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(contract.id)}
                  onCheckedChange={() => toggleOne(contract.id)}
                  aria-label={`Seleccionar contrato ${contract.contractNumber}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/business/contracts/${contract.id}`} className="text-emerald-600 hover:underline">
                  {contract.contractNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{contract.client?.companyName}</p>
                  <p className="text-sm text-muted-foreground">{contract.client?.rnc}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize">{contract.contractType === "fixed" ? "Precio Fijo" : "Por Hora"}</span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{formatDate(contract.startDate)}</p>
                  <p className="text-muted-foreground">
                    {contract.endDate ? formatDate(contract.endDate) : "Indefinido"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <MoneyDisplay amount={contract.monthlyValue} />
              </TableCell>
              <TableCell>
                <StatusBadge status={contract.status} type="contract" />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Acciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/business/contracts/${contract.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                      </Link>
                    </DropdownMenuItem>
                    {contract.status === "draft" && (
                      <DropdownMenuItem onClick={() => onEdit(contract)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/business/invoices?contractId=${contract.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Facturas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {contract.status === "draft" && (
                      <DropdownMenuItem onClick={() => onActivate(contract)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activar
                      </DropdownMenuItem>
                    )}
                    {contract.status === "active" && (
                      <DropdownMenuItem onClick={() => onRenew(contract)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Renovar
                      </DropdownMenuItem>
                    )}
                    {(contract.status === "draft" || contract.status === "active") && (
                      <DropdownMenuItem onClick={() => onCancel(contract)} className="text-destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </DropdownMenuItem>
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
