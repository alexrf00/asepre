"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, FileText, Printer } from "lucide-react"
import type { Payment } from "@/lib/types/business"
import { formatDateDO, getPaymentMethodLabel } from "@/lib/utils/business"

interface PaymentTableProps {
  payments: Payment[]
  onViewReceipt: (payment: Payment) => void
}

export function PaymentTable({ payments, onViewReceipt }: PaymentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Factura</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Recibo</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {payments.map((payment) => {
            const firstAllocation = payment.allocations?.[0]
            const invoicesCount = payment.allocations?.length ?? 0

            return (
              <TableRow key={payment.id}>
                <TableCell>{formatDateDO(payment.paymentDate)}</TableCell>

                <TableCell>
                  <div>
                    <p className="font-medium">{payment.clientName}</p>
                    <p className="text-xs text-muted-foreground">{payment.paymentNumber}</p>
                  </div>
                </TableCell>

                <TableCell>
                  {firstAllocation ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/business/invoices/${firstAllocation.invoiceId}`}
                        className="text-emerald-600 hover:underline text-sm"
                      >
                        {firstAllocation.invoiceNumber}
                      </Link>
                      {invoicesCount > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          +{invoicesCount - 1}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{getPaymentMethodLabel(payment.paymentTypeCode)}</Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">{payment.reference || "-"}</TableCell>

                <TableCell className="text-right">
                  <MoneyDisplay amount={payment.amount} className="font-medium text-emerald-600" />
                </TableCell>

                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onViewReceipt(payment)}>
                    Ver
                  </Button>
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
                      {firstAllocation ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/business/invoices/${firstAllocation.invoiceId}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Factura
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Factura
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => onViewReceipt(payment)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Recibo
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
