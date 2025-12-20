"use client"

import { useState } from "react"
import { format } from "date-fns"
import useSWR from "swr"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PermissionGate } from "@/components/common/permission-gate"
import { InvoiceStatsCards } from "@/components/business/invoices/invoice-stats-cards"
import { InvoicesDataTable } from "@/components/business/invoices/invoices-data-table"
import { InvoiceDetailSheet } from "@/components/business/invoices/invoice-detail-sheet"
import { CreateInvoiceForm } from "@/components/business/invoices/create-invoice-form"
import { GenerateFromContractForm } from "@/components/business/invoices/generate-from-contract-form"
import { RecurringInvoicingCard } from "@/components/business/invoices/recurring-invoicing-card"
import { getAllInvoices, getInvoiceStats } from "@/lib/api/invoices"
import { getActiveClients } from "@/lib/api/clients"
import { useAuthStore } from "@/lib/store/auth-store"
import type { Invoice, InvoiceStatus } from "@/types/business"

export default function InvoicesPage() {
  const { user } = useAuthStore()

  // Table state
  const [page, setPage] = useState(0)
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  // Sheet/dialog state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [generateFromContractOpen, setGenerateFromContractOpen] = useState(false)

  // Fetch invoices
  const {
    data: invoicesRes,
    isLoading: loadingInvoices,
    mutate: refreshInvoices,
    isValidating,
  } = useSWR(
    ["invoices", page, clientFilter, statusFilter, startDate, endDate],
    () =>
      getAllInvoices(
        page,
        10,
        clientFilter !== "all" ? clientFilter : undefined,
        statusFilter !== "all" ? statusFilter : undefined,
        startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      ),
    { revalidateOnFocus: false },
  )

  // Fetch stats
  const {
    data: statsRes,
    isLoading: loadingStats,
    mutate: refreshStats,
  } = useSWR("invoice-stats", () => getInvoiceStats(), { revalidateOnFocus: false })

  // Fetch clients for filter dropdown
  const { data: clientsRes } = useSWR("active-clients-invoices", () => getActiveClients())

  const invoices = invoicesRes?.data ?? null
  const stats = statsRes?.data ?? null
  const clients = clientsRes?.data ?? []

  const isSuperAdmin = user?.roles?.includes("SUPERADMIN")
  const canCreate = user?.permissions?.includes("BUSINESS_INVOICE_CREATE") || isSuperAdmin

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDetailSheetOpen(true)
  }

  const handleRefresh = () => {
    refreshInvoices()
    refreshStats()
  }

  const handleCreateSuccess = () => {
    setCreateInvoiceOpen(false)
    handleRefresh()
  }

  const handleGenerateSuccess = () => {
    setGenerateFromContractOpen(false)
    handleRefresh()
  }

  return (
    <PermissionGate permission="BUSINESS_INVOICE_READ" showError>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage client invoices and billing</p>
        </div>

        {/* Stats Cards */}
        <InvoiceStatsCards stats={stats} isLoading={loadingStats} />

        {/* Data Table with Filters */}
        <InvoicesDataTable
          invoices={invoices}
          clients={clients}
          isLoading={loadingInvoices}
          page={page}
          onPageChange={setPage}
          clientFilter={clientFilter}
          onClientFilterChange={(value) => {
            setClientFilter(value)
            setPage(0)
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => {
            setStatusFilter(value)
            setPage(0)
          }}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => {
            setStartDate(date)
            setPage(0)
          }}
          onEndDateChange={(date) => {
            setEndDate(date)
            setPage(0)
          }}
          onRefresh={handleRefresh}
          isRefreshing={isValidating}
          onViewInvoice={handleViewInvoice}
          onCreateInvoice={() => setCreateInvoiceOpen(true)}
          onGenerateFromContract={() => setGenerateFromContractOpen(true)}
          canCreate={canCreate}
        />

        {/* Recurring Invoicing Card (for admins) */}
        {canCreate && <RecurringInvoicingCard onSuccess={handleRefresh} />}

        {/* Create Invoice Sheet */}
        <Sheet open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
            <SheetHeader>
              <SheetTitle>Create Invoice</SheetTitle>
              <SheetDescription>Create a new draft invoice for a client</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-hidden py-4">
              <CreateInvoiceForm onSuccess={handleCreateSuccess} onCancel={() => setCreateInvoiceOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Generate from Contract Sheet */}
        <Sheet open={generateFromContractOpen} onOpenChange={setGenerateFromContractOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
            <SheetHeader>
              <SheetTitle>Generate Invoice from Contract</SheetTitle>
              <SheetDescription>Create an invoice based on an existing contract</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-hidden py-4">
              <GenerateFromContractForm
                onSuccess={handleGenerateSuccess}
                onCancel={() => setGenerateFromContractOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Invoice Detail Sheet */}
        <InvoiceDetailSheet
          invoiceId={selectedInvoice?.id ?? null}
          open={detailSheetOpen}
          onOpenChange={(open) => {
            setDetailSheetOpen(open)
            if (!open) setSelectedInvoice(null)
          }}
          onRefresh={handleRefresh}
        />
      </div>
    </PermissionGate>
  )
}
