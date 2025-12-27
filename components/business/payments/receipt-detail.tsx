"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Ban, Receipt as ReceiptIcon, Package } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"
import { PermissionGate } from "@/components/common/permission-gate"
import type { Receipt } from "@/types/business"

interface ReceiptDetailProps {
  receipt: Receipt
  onVoid: () => void
  onPrint: () => void
}

export function ReceiptDetail({ receipt, onVoid, onPrint }: ReceiptDetailProps) {
  const isVoid = receipt.status === "VOID"
  const hasLines = receipt.lines && receipt.lines.length > 0

  // Calculate totals from lines if available
  const subtotal = hasLines
    ? receipt.lines.reduce((sum, line) => sum + line.lineSubtotal, 0)
    : receipt.amount
  const totalItbis = hasLines
    ? receipt.lines.reduce((sum, line) => sum + line.itbisAmount, 0)
    : 0

  return (
    <Card className={isVoid ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5" />
            Receipt {receipt.receiptNumber}
            <Badge variant={isVoid ? "destructive" : "default"}>{receipt.status}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(receipt.receiptDate)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {!isVoid && (
            <PermissionGate permission="RECEIPTS_VOID">
              <Button variant="destructive" size="sm" onClick={onVoid}>
                <Ban className="mr-2 h-4 w-4" />
                Void
              </Button>
            </PermissionGate>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Client</p>
            <p className="font-medium">{receipt.clientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">RNC</p>
            <p className="font-medium font-mono">{receipt.clientRnc || "—"}</p>
          </div>
        </div>

        <Separator />

        {/* Line Items (Enterprise Feature) */}
        {hasLines ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              Services Paid ({receipt.lines.length} items)
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Service</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">ITBIS</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{line.description}</p>
                          {line.serviceName && line.serviceName !== line.description && (
                            <p className="text-xs text-muted-foreground">{line.serviceName}</p>
                          )}
                          {line.chargeType && line.chargeType !== "RECURRING" && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {line.chargeType === "ONE_TIME" ? "One-time" : "Setup"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{line.quantity}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(line.unitPrice, receipt.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {line.itbisApplicable ? formatCurrency(line.itbisAmount, receipt.currency) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(line.lineTotal, receipt.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end space-y-1 text-sm">
              <div className="flex justify-between w-48">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal, receipt.currency)}</span>
              </div>
              {totalItbis > 0 && (
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">ITBIS (18%):</span>
                  <span className="font-mono">{formatCurrency(totalItbis, receipt.currency)}</span>
                </div>
              )}
              <Separator className="w-48" />
              <div className="flex justify-between w-48 font-medium">
                <span>Total:</span>
                <span className="font-mono">{formatCurrency(receipt.amount, receipt.currency)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Legacy display for receipts without lines */
          <div>
            <p className="text-muted-foreground text-sm">Amount</p>
            <p className="text-3xl font-bold">{formatCurrency(receipt.amount, receipt.currency)}</p>
          </div>
        )}

        {/* Amount in Words */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Amount in words</p>
          <p className="text-sm italic">{receipt.amountInWords}</p>
        </div>

        <Separator />

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Payment Type</p>
            <p className="font-medium">{receipt.paymentTypeName}</p>
          </div>
          {receipt.paymentReference && (
            <div>
              <p className="text-muted-foreground">Reference</p>
              <p className="font-medium font-mono">{receipt.paymentReference}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Payment #</p>
            <p className="font-medium font-mono">{receipt.paymentNumber}</p>
          </div>
        </div>

        {/* Void Info */}
        {isVoid && (
          <>
            <Separator />
            <div className="rounded-lg bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">Voided</p>
              <p className="text-muted-foreground mt-1">{receipt.voidedAt && `On ${formatDate(receipt.voidedAt)}`}</p>
              {receipt.voidReason && (
                <p className="mt-2">
                  <span className="text-muted-foreground">Reason: </span>
                  {receipt.voidReason}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}