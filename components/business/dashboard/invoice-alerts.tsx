"use client"

import Link from "next/link"
import { AlertTriangle, FileText, X } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyDisplay } from "@/components/business/common/money-display"
import type { BusinessDashboardStats, InvoiceStats } from "@/types/business"

interface InvoiceAlertsProps {
  stats: BusinessDashboardStats | null
  invoiceStats: InvoiceStats | null
  isLoading?: boolean
}

export function InvoiceAlerts({ stats, invoiceStats, isLoading }: InvoiceAlertsProps) {
  const [dismissedOverdue, setDismissedOverdue] = useState(false)
  const [dismissedDraft, setDismissedDraft] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const overdueCount = stats?.overdueInvoices ?? 0
  const overdueAmount = stats?.overdueReceivables ?? 0
  const draftCount = invoiceStats?.draft ?? 0

  const hasOverdueAlert = overdueCount > 0 && !dismissedOverdue
  const hasDraftAlert = draftCount > 0 && !dismissedDraft

  if (!hasOverdueAlert && !hasDraftAlert) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Overdue Invoices Alert */}
      {hasOverdueAlert && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Overdue Invoices</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => setDismissedOverdue(true)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""} totaling{" "}
              <MoneyDisplay amount={overdueAmount} className="font-semibold" />
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/business/invoices?status=overdue">View Overdue</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Draft Invoices Reminder */}
      {hasDraftAlert && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Draft Invoices</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => setDismissedDraft(true)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {draftCount} invoice{draftCount !== 1 ? "s" : ""} pending issuance
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/business/invoices?status=DRAFT">View Drafts</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
