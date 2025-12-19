"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Printer, Ban } from "lucide-react"
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

  return (
    <Card className={isVoid ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
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
            <PermissionGate permission="BUSINESS_RECEIPT_DELETE">
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

        {/* Amount */}
        <div>
          <p className="text-muted-foreground text-sm">Amount</p>
          <p className="text-3xl font-bold">{formatCurrency(receipt.amount, receipt.currency)}</p>
          <p className="text-sm text-muted-foreground italic mt-1">{receipt.amountInWords}</p>
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
