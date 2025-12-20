"use client"

import { useState } from "react"
import useSWR from "swr"
import { Send, XCircle, Ban, FileText, Building2, Calendar, Hash } from "lucide-react"
import { toast } from "sonner"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PermissionGate } from "@/components/common/permission-gate"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { ConfirmationDialog } from "@/components/business/common/confirmation-dialog"
import { getInvoice, issueInvoice, cancelInvoice, voidInvoice } from "@/lib/api/invoices"
import { formatDate } from "@/lib/utils/formatters"
import { isBefore, startOfDay } from "date-fns"

interface InvoiceDetailSheetProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function InvoiceDetailSheet({ invoiceId, open, onOpenChange, onRefresh }: InvoiceDetailSheetProps) {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    data: invoiceRes,
    isLoading,
    mutate,
  } = useSWR(invoiceId && open ? `invoice-detail-${invoiceId}` : null, () => getInvoice(invoiceId!))

  const invoice = invoiceRes?.data

  const today = startOfDay(new Date())
  const isOverdue =
    invoice &&
    isBefore(new Date(invoice.dueDate), today) &&
    invoice.balance > 0 &&
    (invoice.status === "ISSUED" || invoice.status === "PARTIAL")

  const handleIssue = async () => {
    if (!invoice) return
    setIsProcessing(true)
    try {
      const result = await issueInvoice(invoice.id)
      if (result.success) {
        toast.success(`Invoice ${invoice.invoiceNumber} issued successfully`)
        mutate()
        onRefresh()
      } else {
        toast.error(result.error || "Failed to issue invoice")
      }
    } catch {
      toast.error("An error occurred while issuing the invoice")
    } finally {
      setIsProcessing(false)
      setIssueDialogOpen(false)
    }
  }

  const handleCancel = async (reason?: string) => {
    if (!invoice || !reason) return
    setIsProcessing(true)
    try {
      const result = await cancelInvoice(invoice.id, reason)
      if (result.success) {
        toast.success(`Invoice ${invoice.invoiceNumber} cancelled`)
        mutate()
        onRefresh()
      } else {
        toast.error(result.error || "Failed to cancel invoice")
      }
    } catch {
      toast.error("An error occurred while cancelling the invoice")
    } finally {
      setIsProcessing(false)
      setCancelDialogOpen(false)
    }
  }

  const handleVoid = async (reason?: string) => {
    if (!invoice || !reason) return
    setIsProcessing(true)
    try {
      const result = await voidInvoice(invoice.id, reason)
      if (result.success) {
        toast.success(`Invoice ${invoice.invoiceNumber} voided`)
        mutate()
        onRefresh()
      } else {
        toast.error(result.error || "Failed to void invoice")
      }
    } catch {
      toast.error("An error occurred while voiding the invoice")
    } finally {
      setIsProcessing(false)
      setVoidDialogOpen(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>{invoice ? `Invoice ${invoice.invoiceNumber}` : "Loading..."}</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : invoice ? (
              <>
                {/* Header: Invoice # & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-mono text-lg font-semibold">{invoice.invoiceNumber}</span>
                    </div>
                    {invoice.ncf && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>NCF: {invoice.ncf}</span>
                      </div>
                    )}
                  </div>
                  <InvoiceStatusBadge status={invoice.status} isOverdue={isOverdue} />
                </div>

                <Separator />

                {/* Client Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Client</span>
                  </div>
                  <div>
                    <p className="font-medium">{invoice.clientName}</p>
                    <p className="text-sm text-muted-foreground">RNC: {invoice.clientRnc}</p>
                  </div>
                </div>

                {/* Contract Reference */}
                {invoice.contractNumber && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Contract</p>
                    <p className="font-mono">{invoice.contractNumber}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Issue Date
                    </div>
                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className={`font-medium ${isOverdue ? "text-destructive" : ""}`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                  </div>
                </div>

                <Separator />

                {/* Invoice Lines */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Invoice Lines</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-4">
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">ITBIS</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{line.serviceName}</p>
                                  {line.description && (
                                    <p className="text-xs text-muted-foreground">{line.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {line.quantity} {line.billingUnitCode}
                              </TableCell>
                              <TableCell className="text-right">
                                <MoneyDisplay amount={line.unitPrice} currency={invoice.currency} />
                              </TableCell>
                              <TableCell className="text-right">
                                {line.itbisApplicable ? (
                                  <MoneyDisplay amount={line.itbisAmount} currency={invoice.currency} />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <MoneyDisplay amount={line.lineTotal} currency={invoice.currency} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <MoneyDisplay amount={invoice.subtotal} currency={invoice.currency} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ITBIS ({(invoice.itbisRate * 100).toFixed(0)}%)</span>
                        <MoneyDisplay amount={invoice.itbisAmount} currency={invoice.currency} />
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <MoneyDisplay amount={invoice.total} currency={invoice.currency} className="text-lg" />
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <MoneyDisplay
                          amount={invoice.amountPaid}
                          currency={invoice.currency}
                          className="text-green-600"
                        />
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Balance Due</span>
                        <MoneyDisplay
                          amount={invoice.balance}
                          currency={invoice.currency}
                          className={invoice.balance > 0 ? "text-amber-600" : "text-green-600"}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {invoice.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{invoice.notes}</p>
                  </div>
                )}

                {/* Cancellation Info */}
                {invoice.cancellationReason && (
                  <div className="text-sm bg-destructive/10 p-3 rounded-md">
                    <p className="font-medium text-destructive mb-1">
                      {invoice.status === "CANCELLED" ? "Cancelled" : "Voided"} on{" "}
                      {invoice.cancelledAt && formatDate(invoice.cancelledAt)}
                    </p>
                    <p className="text-sm">{invoice.cancellationReason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {invoice.status === "DRAFT" && (
                    <PermissionGate permission="BUSINESS_INVOICE_UPDATE">
                      <Button onClick={() => setIssueDialogOpen(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Issue Invoice
                      </Button>
                      <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </PermissionGate>
                  )}

                  {(invoice.status === "ISSUED" || invoice.status === "PARTIAL" || invoice.status === "PAID") && (
                    <PermissionGate permission="BUSINESS_INVOICE_DELETE">
                      <Button variant="destructive" onClick={() => setVoidDialogOpen(true)}>
                        <Ban className="mr-2 h-4 w-4" />
                        Void Invoice
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Invoice not found</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <ConfirmationDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title="Issue Invoice"
        description={`Are you sure you want to issue invoice ${invoice?.invoiceNumber}? This will assign an NCF and the invoice cannot be edited afterwards.`}
        confirmLabel="Issue Invoice"
        onConfirm={handleIssue}
        isLoading={isProcessing}
      />

      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Invoice"
        description={`Are you sure you want to cancel invoice ${invoice?.invoiceNumber}?`}
        confirmLabel="Cancel Invoice"
        onConfirm={handleCancel}
        destructive
        requireReason
        reasonLabel="Cancellation Reason"
        reasonPlaceholder="Enter the reason for cancellation..."
        isLoading={isProcessing}
      />

      <ConfirmationDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        title="Void Invoice"
        description={`Are you sure you want to void invoice ${invoice?.invoiceNumber}?`}
        confirmLabel="Void Invoice"
        onConfirm={handleVoid}
        destructive
        requireReason
        reasonLabel="Void Reason"
        reasonPlaceholder="Enter the reason for voiding..."
        isLoading={isProcessing}
      />
    </>
  )
}
