"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { StatusBadge } from "@/components/business/common/status-badge"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { ArrowLeft, Building2, FileText, Download, Send, DollarSign, Printer, Mail } from "lucide-react"
import { invoicesApi } from "@/lib/api/business/invoices"
import { formatDate, formatNCF, getPaymentMethodLabel } from "@/lib/utils/business"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: invoice, error, isLoading } = useSWR(["invoice", id], () => invoicesApi.getById(id))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <EmptyState
        icon={FileText}
        title="Factura no encontrada"
        description="La factura solicitada no existe o fue eliminada"
        action={{ label: "Volver a Facturas", href: "/business/invoices" }}
      />
    )
  }

  const isOverdue = invoice.status === "sent" && new Date(invoice.dueDate) < new Date()

  return (
    <PermissionGate permissions={["invoices.view"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/business/invoices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{formatNCF(invoice.ncf) || invoice.invoiceNumber}</h1>
                <StatusBadge status={isOverdue ? "overdue" : invoice.status} type="invoice" />
              </div>
              <p className="text-muted-foreground">Factura a {invoice.client?.companyName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            {invoice.status === "draft" && (
              <Button size="sm">
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            )}
            {(invoice.status === "sent" || isOverdue) && (
              <>
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Recordatorio
                </Button>
                <Button size="sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              Esta factura está vencida desde el {formatDate(invoice.dueDate)}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Invoice Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">De:</h3>
                    <p className="font-medium">ASEPRE S.R.L.</p>
                    <p className="text-sm text-muted-foreground">Agentes de Seguridad Preventiva</p>
                    <p className="text-sm text-muted-foreground">RNC: 1-23-45678-9</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Para:</h3>
                    <p className="font-medium">{invoice.client?.companyName}</p>
                    <p className="text-sm text-muted-foreground">RNC: {invoice.client?.rnc}</p>
                    {invoice.client?.billingAddress && (
                      <p className="text-sm text-muted-foreground">{invoice.client.billingAddress}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Lines */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de la Factura</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">ITBIS</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lines?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <p className="font-medium">{line.service?.name}</p>
                          {line.description && <p className="text-sm text-muted-foreground">{line.description}</p>}
                        </TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">
                          <MoneyDisplay amount={line.unitPrice} />
                        </TableCell>
                        <TableCell className="text-right">
                          {line.itbisAmount > 0 ? <MoneyDisplay amount={line.itbisAmount} /> : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <MoneyDisplay amount={line.subtotal} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <MoneyDisplay amount={invoice.subtotal} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ITBIS (18%):</span>
                      <MoneyDisplay amount={invoice.itbisTotal} />
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <MoneyDisplay amount={invoice.total} />
                    </div>
                    {invoice.balanceDue !== invoice.total && (
                      <>
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Pagado:</span>
                          <MoneyDisplay amount={invoice.total - invoice.balanceDue} />
                        </div>
                        <div className="flex justify-between font-medium text-amber-600">
                          <span>Pendiente:</span>
                          <MoneyDisplay amount={invoice.balanceDue} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments */}
            {invoice.payments && invoice.payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pagos Recibidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                          <TableCell>{payment.reference || "-"}</TableCell>
                          <TableCell className="text-right">
                            <MoneyDisplay amount={payment.amount} className="text-emerald-600" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NCF:</span>
                  <span className="font-mono">{formatNCF(invoice.ncf)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo NCF:</span>
                  <span>{invoice.ncfType}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Emisión:</span>
                  <span>{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vencimiento:</span>
                  <span className={isOverdue ? "text-destructive font-medium" : ""}>{formatDate(invoice.dueDate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{invoice.client?.companyName}</p>
                  <p className="text-sm text-muted-foreground">RNC: {invoice.client?.rnc}</p>
                </div>
                <Separator />
                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href={`/business/clients/${invoice.clientId}`}>Ver Cliente</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Contract Info */}
            {invoice.contract && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{invoice.contract.contractNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Vigencia: {formatDate(invoice.contract.startDate)} -{" "}
                      {invoice.contract.endDate ? formatDate(invoice.contract.endDate) : "Indefinido"}
                    </p>
                  </div>
                  <Separator />
                  <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                    <Link href={`/business/contracts/${invoice.contractId}`}>Ver Contrato</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  )
}
