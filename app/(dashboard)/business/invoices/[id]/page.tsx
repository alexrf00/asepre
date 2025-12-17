"use client"

import { use } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { RegisterPaymentDialog } from "@/components/business/payments/register-payment-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { ArrowLeft, FileText, AlertTriangle, Send, Ban, CreditCard, Building2, Calendar, Hash } from "lucide-react"
import type { Invoice, RecordPaymentRequest } from "@/lib/types/business"
import { getInvoiceById, issueInvoice, cancelInvoice } from "@/lib/api/business/invoices"
import { recordPayment } from "@/lib/api/business/payments"
import { formatDOP, getInvoiceStatusLabel, getInvoiceStatusColor } from "@/lib/utils/business"
import { toast } from "sonner"
import { useState } from "react"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  const { data: invoice, error, isLoading, mutate } = useSWR<Invoice>(["invoice", id], () => getInvoiceById(id))

  const handleSend = async () => {
    try {
      await issueInvoice(id)
      toast.success("Factura emitida exitosamente")
      mutate()
    } catch {
      toast.error("Error al emitir la factura")
    } finally {
      setShowSendDialog(false)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelInvoice(id, { reason: "Anulada por usuario" })
      toast.success("Factura anulada")
      mutate()
    } catch {
      toast.error("Error al anular la factura")
    } finally {
      setShowCancelDialog(false)
    }
  }

  const handleRegisterPayment = async (paymentData: {
    invoiceId: string
    amount: number
    paymentDate: string
    paymentMethod: string
    reference?: string
    notes?: string
  }) => {
    if (!invoice) return

    try {
      const request: RecordPaymentRequest = {
        clientId: invoice.clientId,
        paymentTypeId: paymentData.paymentMethod, // Map paymentMethod to paymentTypeId
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        reference: paymentData.reference,
        notes: paymentData.notes,
        allocations: [
          {
            invoiceId: paymentData.invoiceId,
            amount: paymentData.amount,
          },
        ],
        generateReceipt: true,
      }
      await recordPayment(request)
      toast.success("Pago registrado exitosamente")
      mutate()
    } catch {
      toast.error("Error al registrar el pago")
      throw new Error("Error")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Error al cargar"
        description="No se pudo cargar la factura"
        action={
          <Button variant="outline" onClick={() => router.push("/business/invoices")}>
            Volver
          </Button>
        }
      />
    )
  }

  const canIssue = invoice.status === "DRAFT"
  const canCancel = invoice.status === "DRAFT" || invoice.status === "ISSUED"
  const canRegisterPayment = invoice.status === "ISSUED" || invoice.status === "PARTIAL"

  return (
    <PermissionGate permissions={["invoices.view"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/business/invoices")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{invoice.ncf || invoice.invoiceNumber}</h1>
                <Badge className={getInvoiceStatusColor(invoice.status)}>{getInvoiceStatusLabel(invoice.status)}</Badge>
              </div>
              <p className="text-muted-foreground">Detalles de la factura</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canIssue && (
              <PermissionGate permissions={["invoices.issue"]}>
                <Button onClick={() => setShowSendDialog(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Emitir
                </Button>
              </PermissionGate>
            )}
            {canRegisterPayment && (
              <PermissionGate permissions={["payments.create"]}>
                <Button variant="outline" onClick={() => setShowPaymentDialog(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Button>
              </PermissionGate>
            )}
            {canCancel && (
              <PermissionGate permissions={["invoices.cancel"]}>
                <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Anular
                </Button>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{invoice.clientName}</p>
              <p className="text-sm text-muted-foreground">{invoice.clientRnc}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Emisión:</span>
                <span>{new Date(invoice.issueDate).toLocaleDateString("es-DO")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span>{new Date(invoice.dueDate).toLocaleDateString("es-DO")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Hash className="h-4 w-4" />
                Referencias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NCF:</span>
                <span className="font-mono">{invoice.ncf || "Pendiente"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-mono">{invoice.invoiceNumber}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle de Factura
            </CardTitle>
            <CardDescription>Productos y servicios facturados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">ITBIS</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.serviceCode && (
                          <p className="text-sm text-muted-foreground">Código: {item.serviceCode}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatDOP(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatDOP(item.taxAmount || 0)}</TableCell>
                    <TableCell className="text-right font-medium">{formatDOP(item.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Subtotal</TableCell>
                  <TableCell className="text-right">{formatDOP(invoice.subtotal)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>ITBIS (18%)</TableCell>
                  <TableCell className="text-right">{formatDOP(invoice.taxAmount)}</TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">{formatDOP(invoice.totalAmount)}</TableCell>
                </TableRow>
                {invoice.paidAmount > 0 && (
                  <>
                    <TableRow className="text-green-600">
                      <TableCell colSpan={4}>Pagado</TableCell>
                      <TableCell className="text-right">-{formatDOP(invoice.paidAmount)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-amber-600">
                      <TableCell colSpan={4}>Balance Pendiente</TableCell>
                      <TableCell className="text-right">{formatDOP(invoice.balanceDue)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Issue Dialog */}
        <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Emitir Factura</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea emitir esta factura? Esto asignará el NCF oficial y enviará el documento al
                cliente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSend}>Emitir Factura</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anular Factura</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea anular esta factura? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                Sí, anular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Register Payment Dialog */}
        <RegisterPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          invoice={invoice}
          onSubmit={handleRegisterPayment}
        />
      </div>
    </PermissionGate>
  )
}
