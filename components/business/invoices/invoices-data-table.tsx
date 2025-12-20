"use client"

import { useState } from "react"
import { isBefore, startOfDay } from "date-fns"
import { Plus, RefreshCw, FileText, MoreHorizontal, Eye, Send, XCircle, Ban, FileStack } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BusinessDataTable } from "@/components/business/common/business-data-table"
import { DateRangePicker } from "@/components/business/common/date-range-picker"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { ConfirmationDialog } from "@/components/business/common/confirmation-dialog"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { issueInvoice, cancelInvoice, voidInvoice } from "@/lib/api/invoices"
import { formatDate } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"
import type { Invoice, InvoiceStatus, Client } from "@/types/business"
import type { PaginatedResponse } from "@/types"

interface InvoicesDataTableProps {
  invoices: PaginatedResponse<Invoice> | null
  clients: Client[]
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  clientFilter: string
  onClientFilterChange: (value: string) => void
  statusFilter: InvoiceStatus | "all"
  onStatusFilterChange: (value: InvoiceStatus | "all") => void
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  onRefresh: () => void
  isRefreshing: boolean
  onViewInvoice: (invoice: Invoice) => void
  onCreateInvoice: () => void
  onGenerateFromContract: () => void
  canCreate: boolean
}

export function InvoicesDataTable({
  invoices,
  clients,
  isLoading,
  page,
  onPageChange,
  clientFilter,
  onClientFilterChange,
  statusFilter,
  onStatusFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  isRefreshing,
  onViewInvoice,
  onCreateInvoice,
  onGenerateFromContract,
  canCreate,
}: InvoicesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionInvoice, setActionInvoice] = useState<Invoice | null>(null)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const today = startOfDay(new Date())

  const isOverdue = (invoice: Invoice): boolean => {
    const dueDate = new Date(invoice.dueDate)
    return (
      isBefore(dueDate, today) && invoice.balance > 0 && (invoice.status === "ISSUED" || invoice.status === "PARTIAL")
    )
  }

  // Filter by search query (client-side)
  const filteredData =
    invoices?.content?.filter(
      (invoice) =>
        !searchQuery ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.ncf?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? []

  const handleIssue = async () => {
    if (!actionInvoice) return
    setIsProcessing(true)
    try {
      const result = await issueInvoice(actionInvoice.id)
      if (result.success) {
        toast.success(`Invoice ${actionInvoice.invoiceNumber} issued successfully`)
        onRefresh()
      } else {
        toast.error(result.error || "Failed to issue invoice")
      }
    } catch {
      toast.error("An error occurred while issuing the invoice")
    } finally {
      setIsProcessing(false)
      setIssueDialogOpen(false)
      setActionInvoice(null)
    }
  }

  const handleCancel = async (reason?: string) => {
    if (!actionInvoice || !reason) return
    setIsProcessing(true)
    try {
      const result = await cancelInvoice(actionInvoice.id, reason)
      if (result.success) {
        toast.success(`Invoice ${actionInvoice.invoiceNumber} cancelled`)
        onRefresh()
      } else {
        toast.error(result.error || "Failed to cancel invoice")
      }
    } catch {
      toast.error("An error occurred while cancelling the invoice")
    } finally {
      setIsProcessing(false)
      setCancelDialogOpen(false)
      setActionInvoice(null)
    }
  }

  const handleVoid = async (reason?: string) => {
    if (!actionInvoice || !reason) return
    setIsProcessing(true)
    try {
      const result = await voidInvoice(actionInvoice.id, reason)
      if (result.success) {
        toast.success(`Invoice ${actionInvoice.invoiceNumber} voided`)
        onRefresh()
      } else {
        toast.error(result.error || "Failed to void invoice")
      }
    } catch {
      toast.error("An error occurred while voiding the invoice")
    } finally {
      setIsProcessing(false)
      setVoidDialogOpen(false)
      setActionInvoice(null)
    }
  }

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      cell: (invoice: Invoice) => (
        <button
          onClick={() => onViewInvoice(invoice)}
          className="font-mono text-sm font-medium text-primary hover:underline"
        >
          {invoice.invoiceNumber}
        </button>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      cell: (invoice: Invoice) => <span className="font-medium">{invoice.clientName}</span>,
    },
    {
      key: "ncf",
      header: "NCF",
      cell: (invoice: Invoice) => <span className="font-mono text-sm text-muted-foreground">{invoice.ncf || "—"}</span>,
    },
    {
      key: "issueDate",
      header: "Issue Date",
      cell: (invoice: Invoice) => <span className="text-sm">{formatDate(invoice.issueDate)}</span>,
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (invoice: Invoice) => (
        <span className={cn("text-sm", isOverdue(invoice) && "text-destructive font-medium")}>
          {formatDate(invoice.dueDate)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      cell: (invoice: Invoice) => <MoneyDisplay amount={invoice.total} currency={invoice.currency} />,
    },
    {
      key: "balance",
      header: "Balance",
      className: "text-right",
      cell: (invoice: Invoice) => (
        <MoneyDisplay
          amount={invoice.balance}
          currency={invoice.currency}
          className={invoice.balance > 0 ? "text-amber-600" : "text-green-600"}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (invoice: Invoice) => <InvoiceStatusBadge status={invoice.status} isOverdue={isOverdue(invoice)} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-[50px]",
      cell: (invoice: Invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewInvoice(invoice)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            {invoice.status === "DRAFT" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setActionInvoice(invoice)
                    setIssueDialogOpen(true)
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Issue Invoice
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setActionInvoice(invoice)
                    setCancelDialogOpen(true)
                  }}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}

            {(invoice.status === "ISSUED" || invoice.status === "PARTIAL" || invoice.status === "PAID") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setActionInvoice(invoice)
                    setVoidDialogOpen(true)
                  }}
                  className="text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Void Invoice
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              {canCreate && (
                <>
                  <Button variant="outline" size="sm" onClick={onGenerateFromContract}>
                    <FileStack className="mr-2 h-4 w-4" />
                    From Contract
                  </Button>
                  <Button size="sm" onClick={onCreateInvoice}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <Input
                placeholder="Search invoice #, client, NCF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <Select value={clientFilter} onValueChange={onClientFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as InvoiceStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="VOID">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />

          {/* Data Table */}
          <BusinessDataTable
            columns={columns}
            data={filteredData}
            pageInfo={
              invoices
                ? {
                    number: invoices.number,
                    size: invoices.size,
                    totalElements: invoices.totalElements,
                    totalPages: invoices.totalPages,
                    first: invoices.first,
                    last: invoices.last,
                  }
                : undefined
            }
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyIcon={FileText}
            emptyTitle="No invoices found"
            emptyDescription="Create your first invoice or adjust your filters."
            rowClassName={(invoice) => (isOverdue(invoice) ? "bg-destructive/5" : "")}
          />
        </CardContent>
      </Card>

      {/* Issue Confirmation Dialog */}
      <ConfirmationDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title="Issue Invoice"
        description={`Are you sure you want to issue invoice ${actionInvoice?.invoiceNumber}? This will assign an NCF (fiscal number) and the invoice cannot be edited afterwards.`}
        confirmLabel="Issue Invoice"
        onConfirm={handleIssue}
        isLoading={isProcessing}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Invoice"
        description={`Are you sure you want to cancel invoice ${actionInvoice?.invoiceNumber}? This action cannot be undone.`}
        confirmLabel="Cancel Invoice"
        onConfirm={handleCancel}
        destructive
        requireReason
        reasonLabel="Cancellation Reason"
        reasonPlaceholder="Enter the reason for cancellation..."
        isLoading={isProcessing}
      />

      {/* Void Confirmation Dialog */}
      <ConfirmationDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        title="Void Invoice"
        description={`Are you sure you want to void invoice ${actionInvoice?.invoiceNumber}? This will reverse the invoice in accounting records.`}
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
