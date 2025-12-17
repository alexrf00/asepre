"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Eye, FileText, Printer } from "lucide-react"
import type { Payment } from "@/lib/types/business"
import { MoneyDisplay } from "../common/money-display"
import { formatDate, getPaymentMethodLabel } from "@/lib/utils/business"
import Link from "next/link"

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
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{payment.invoice?.client?.companyName}</p>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/business/invoices/${payment.invoiceId}`}
                  className="text-emerald-600 hover:underline text-sm"
                >
                  {payment.invoice?.ncf || payment.invoice?.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{getPaymentMethodLabel(payment.paymentMethod)}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{payment.reference || "-"}</TableCell>
              <TableCell className="text-right">
                <MoneyDisplay amount={payment.amount} className="font-medium text-emerald-600" />
              </TableCell>
              <TableCell>
                {payment.receipt ? (
                  <Button variant="ghost" size="sm" onClick={() => onViewReceipt(payment)}>
                    {payment.receipt.receiptNumber}
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
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
                      <Link href={`/business/invoices/${payment.invoiceId}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Factura
                      </Link>
                    </DropdownMenuItem>
                    {payment.receipt && (
                      <DropdownMenuItem onClick={() => onViewReceipt(payment)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Recibo
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </DropdownMenuItem>
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
