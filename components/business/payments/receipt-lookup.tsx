"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Search, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceiptDetail } from "./receipt-detail"
import { VoidReceiptDialog } from "./void-receipt-dialog"
import { getReceipt, getReceiptByPayment } from "@/lib/api/receipts"
import type { Receipt } from "@/types/business"

export function ReceiptLookup() {
  const [searchType, setSearchType] = useState<"receipt" | "payment">("receipt")
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Please enter a search value")
      return
    }

    setIsSearching(true)
    setReceipt(null)

    try {
      const result =
        searchType === "receipt" ? await getReceipt(searchValue.trim()) : await getReceiptByPayment(searchValue.trim())

      if (result.success && result.data) {
        setReceipt(result.data)
      } else {
        toast.error(result.error || "Receipt not found")
      }
    } catch {
      toast.error("An error occurred while searching")
    } finally {
      setIsSearching(false)
    }
  }

  const handleVoidSuccess = async () => {
    // Refresh the receipt
    if (receipt) {
      const result = await getReceipt(receipt.id)
      if (result.success && result.data) {
        setReceipt(result.data)
      }
    }
  }

  const handlePrint = () => {
    if (!receipt) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Unable to open print window")
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.receiptNumber}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .receipt-number { color: #666; margin-top: 8px; }
          .section { margin: 20px 0; }
          .label { color: #666; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; margin-top: 4px; }
          .amount { font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; }
          .amount-words { font-style: italic; color: #666; text-align: center; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .void-badge { background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; display: inline-block; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">RECEIPT</div>
          <div class="receipt-number">${receipt.receiptNumber}</div>
          ${receipt.status === "VOID" ? '<div class="void-badge">VOID</div>' : ""}
        </div>
        <div class="grid">
          <div class="section">
            <div class="label">Client</div>
            <div class="value">${receipt.clientName}</div>
          </div>
          <div class="section">
            <div class="label">RNC</div>
            <div class="value">${receipt.clientRnc || "—"}</div>
          </div>
        </div>
        <div class="amount">${new Intl.NumberFormat("es-DO", { style: "currency", currency: receipt.currency }).format(receipt.amount)}</div>
        <div class="amount-words">${receipt.amountInWords}</div>
        <div class="grid">
          <div class="section">
            <div class="label">Date</div>
            <div class="value">${new Date(receipt.receiptDate).toLocaleDateString()}</div>
          </div>
          <div class="section">
            <div class="label">Payment Type</div>
            <div class="value">${receipt.paymentTypeName}</div>
          </div>
          ${
            receipt.paymentReference
              ? `
          <div class="section">
            <div class="label">Reference</div>
            <div class="value">${receipt.paymentReference}</div>
          </div>
          `
              : ""
          }
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Lookup</CardTitle>
            <CardDescription>Search for a receipt by ID or payment ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="searchValue" className="sr-only">
                  Search
                </Label>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border rounded-md text-sm"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as "receipt" | "payment")}
                  >
                    <option value="receipt">Receipt ID</option>
                    <option value="payment">Payment ID</option>
                  </select>
                  <Input
                    id="searchValue"
                    placeholder={searchType === "receipt" ? "Enter receipt ID..." : "Enter payment ID..."}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {receipt && (
          <div ref={printRef}>
            <ReceiptDetail receipt={receipt} onVoid={() => setVoidDialogOpen(true)} onPrint={handlePrint} />
          </div>
        )}
      </div>

      <VoidReceiptDialog
        receipt={receipt}
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        onSuccess={handleVoidSuccess}
      />
    </>
  )
}
