"use client"

import { useState } from "react"
import { Send, XCircle, Ban } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PermissionGate } from "@/components/common/permission-gate"
import { ConfirmationDialog } from "@/components/business/common/confirmation-dialog"
import { issueInvoice, cancelInvoice, voidInvoice } from "@/lib/api/invoices"
import type { Invoice } from "@/types/business"

interface InvoiceActionsProps {
  invoice: Invoice
  onSuccess: () => void
  variant?: "buttons" | "compact"
}

export function InvoiceActions({ invoice, onSuccess, variant = "buttons" }: InvoiceActionsProps) {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleIssue = async () => {
    setIsProcessing(true)
    try {
      const result = await issueInvoice(invoice.id)
      if (result.success) {
        toast.success(`Invoice ${invoice.invoiceNumber} issued successfully`)
        onSuccess()
      } else {
        toast.error(result.error || "Failed to issue invoice")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsProcessing(false)
      setIssueDialogOpen(false)
    }
  }

  const handleCancel = async (reason?: string) => {
    if (!reason) return
    setIsProcessing(true)
    try {
      const result = await cancelInvoice(invoice.id, reason)
      if (result.success) {
        toast.success(`Invoice ${invoice.invoiceNumber} cancelled`)
        onSuccess()
      } else {
        toast.error(result.error || "Failed to cancel invoice")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsProcessing(false)
      setCancelDialogOpen(false)
    }
  }

  const handleVoid = async (reason?: string) => {
    if (!reason) return
    setIsProcessing(true)
    try {
      const result = await voidInvoice(invoice.id, reason)
      if (result.success) {
        toast.success(`Invoice ${invoice.invoiceNumber} voided`)
        onSuccess()
      } else {
        toast.error(result.error || "Failed to void invoice")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsProcessing(false)
      setVoidDialogOpen(false)
    }
  }

  const renderActions = () => {
    switch (invoice.status) {
      case "DRAFT":
        return (
          <>
            <PermissionGate permission="INVOICES_WRITE">
              <Button size={variant === "compact" ? "sm" : "default"} onClick={() => setIssueDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Issue
              </Button>
            </PermissionGate>
            <PermissionGate permission="INVOICES_CANCEL">
              <Button
                size={variant === "compact" ? "sm" : "default"}
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </PermissionGate>
          </>
        )
      case "ISSUED":
      case "PARTIAL":
      case "PAID":
        return (
          <PermissionGate permission="INVOICES_CANCEL">
            <Button
              size={variant === "compact" ? "sm" : "default"}
              variant="destructive"
              onClick={() => setVoidDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Void
            </Button>
          </PermissionGate>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">{renderActions()}</div>

      <ConfirmationDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title="Issue Invoice"
        description={`Are you sure you want to issue invoice ${invoice.invoiceNumber}? This will assign an NCF (fiscal number) and the invoice cannot be edited afterwards.`}
        confirmLabel="Issue Invoice"
        onConfirm={handleIssue}
        isLoading={isProcessing}
      />

      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Invoice"
        description={`Are you sure you want to cancel invoice ${invoice.invoiceNumber}?`}
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
        description={`Are you sure you want to void invoice ${invoice.invoiceNumber}?`}
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