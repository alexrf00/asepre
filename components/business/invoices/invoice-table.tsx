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
import { MoreHorizontal, Eye, Send, DollarSign, XCircle, Download, Mail } from "lucide-react"
import type { Invoice } from "@/lib/types/business"
import { StatusBadge } from "../common/status-badge"
import { MoneyDisplay } from "../common/money-display"
import { formatDate } from "@/lib/utils/business"
import Link from "next/link"

interface InvoiceTableProps {
  invoices: Invoice[]
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
  onSend: (invoice: Invoice) => void
  onRegisterPayment: (invoice: Invoice) => void
  onCancel: (invoice: Invoice) => void
}

export function InvoiceTable({
  invoices,
  selectedIds,
  onSelectChange,
  onSend,
  onRegisterPayment,
  onCancel,
}: InvoiceTableProps) {
  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < invoices.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectChange([])
    } else {
      onSelectChange(invoices.map((i) => i.id))
    }
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectChange([...selectedIds, id])
    }
  }

  const isOverdue = (invoice: Invoice) => {
    return invoice.status === "sent" && new Date(invoice.dueDate) < new Date()
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
                aria-label="Seleccionar todas"
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead>NCF</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead>Emisión</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Pendiente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className={isOverdue(invoice) ? "bg-destructive/5" : ""}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(invoice.id)}
                  onCheckedChange={() => toggleOne(invoice.id)}
                  aria-label={`Seleccionar factura ${invoice.ncf}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/business/invoices/${invoice.id}`} className="text-emerald-600 hover:underline">
                  {invoice.ncf || invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{invoice.client?.companyName}</p>
                  <p className="text-sm text-muted-foreground">{invoice.client?.rnc}</p>
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/business/contracts/${invoice.contractId}`} className="text-sm hover:underline">
                  {invoice.contract?.contractNumber}
                </Link>
              </TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>
                <span className={isOverdue(invoice) ? "text-destructive font-medium" : ""}>
                  {formatDate(invoice.dueDate)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <MoneyDisplay amount={invoice.total} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyDisplay amount={invoice.balanceDue} className={invoice.balanceDue > 0 ? "text-amber-600" : ""} />
              </TableCell>
              <TableCell>
                <StatusBadge status={isOverdue(invoice) ? "overdue" : invoice.status} type="invoice" />
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
                      <Link href={`/business/invoices/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </DropdownMenuItem>
                    {invoice.status === "draft" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSend(invoice)}>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar al Cliente
                        </DropdownMenuItem>
                      </>
                    )}
                    {(invoice.status === "sent" || isOverdue(invoice)) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onRegisterPayment(invoice)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Registrar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Recordatorio
                        </DropdownMenuItem>
                      </>
                    )}
                    {invoice.status === "draft" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onCancel(invoice)} className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Anular
                        </DropdownMenuItem>
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
