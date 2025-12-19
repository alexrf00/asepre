"use client"

import { useState } from "react"
import useSWR from "swr"
import { ExternalLink, Receipt } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PermissionGate } from "@/components/common/permission-gate"
import { PaymentStatusBadge } from "./payment-status-badge"
import { AllocatePaymentDialog } from "./allocate-payment-dialog"
import { getPayment } from "@/lib/api/payments"
import { getReceiptByPayment } from "@/lib/api/receipts"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"

interface PaymentDetailSheetProps {
  paymentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function PaymentDetailSheet({ paymentId, open, onOpenChange, onRefresh }: PaymentDetailSheetProps) {
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)

  const {
    data: paymentRes,
    isLoading,
    mutate,
  } = useSWR(paymentId && open ? `payment-detail-${paymentId}` : null, () => getPayment(paymentId!))

  const { data: receiptRes } = useSWR(paymentId && open ? `receipt-by-payment-${paymentId}` : null, () =>
    getReceiptByPayment(paymentId!),
  )

  const payment = paymentRes?.data
  const receipt = receiptRes?.data

  const handleAllocateSuccess = () => {
    mutate()
    onRefresh()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payment Details</SheetTitle>
            <SheetDescription>{payment ? `Payment ${payment.paymentNumber}` : "Loading..."}</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : payment ? (
              <>
                {/* Status & Amount */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
                  </div>
                </div>

                <Separator />

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-medium">{payment.clientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Type</p>
                    <p className="font-medium">{payment.paymentTypeName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                  </div>
                  {payment.reference && (
                    <div>
                      <p className="text-muted-foreground">Reference</p>
                      <p className="font-medium font-mono">{payment.reference}</p>
                    </div>
                  )}
                </div>

                {payment.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="mt-1">{payment.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Allocation Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Allocated</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(payment.amountAllocated, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unallocated</p>
                    <p className={`font-medium ${payment.amountUnallocated > 0 ? "text-amber-600" : ""}`}>
                      {formatCurrency(payment.amountUnallocated, payment.currency)}
                    </p>
                  </div>
                </div>

                {/* Allocations Table */}
                {payment.allocations.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Allocations</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-4">
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="hidden sm:table-cell">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payment.allocations.map((alloc) => (
                              <TableRow key={alloc.id}>
                                <TableCell className="font-mono">{alloc.invoiceNumber}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(alloc.amount, payment.currency)}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{formatDate(alloc.createdAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Allocate Button */}
                {payment.amountUnallocated > 0 && (
                  <PermissionGate permission="BUSINESS_PAYMENT_UPDATE">
                    <Button className="w-full" onClick={() => setAllocateDialogOpen(true)}>
                      Allocate Remaining
                    </Button>
                  </PermissionGate>
                )}

                {/* Receipt Link */}
                {receipt && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Receipt
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono font-medium">{receipt.receiptNumber}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(receipt.receiptDate)}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`/business/payments?receipt=${receipt.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Payment not found</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AllocatePaymentDialog
        payment={payment ?? null}
        open={allocateDialogOpen}
        onOpenChange={setAllocateDialogOpen}
        onSuccess={handleAllocateSuccess}
      />
    </>
  )
}
