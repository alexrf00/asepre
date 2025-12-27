"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PermissionGate } from "@/components/common/permission-gate"
import { PaymentsDataTable } from "@/components/business/payments/payments-data-table"
import { RecordPaymentForm } from "@/components/business/payments/record-payment-form"
import { PaymentDetailSheet } from "@/components/business/payments/payment-detail-sheet"
import { PaymentTypesTable } from "@/components/business/payments/payment-types-table"
import { ReceiptLookup } from "@/components/business/payments/receipt-lookup"
import { getAllPayments } from "@/lib/api/payments"
import { getActiveClients } from "@/lib/api/clients"
import { useAuthStore } from "@/lib/store/auth-store"
import type { Payment } from "@/types/business"

export default function PaymentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  // Tab state
  const activeTab = searchParams.get("tab") || "payments"

  // Payments state
  const [page, setPage] = useState(0)
  const [clientFilter, setClientFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Fetch data
  const {
    data: paymentsRes,
    isLoading: loadingPayments,
    mutate: refreshPayments,
    isValidating,
  } = useSWR(["payments", page, clientFilter, startDate, endDate], () =>
    getAllPayments(
      page,
      10,
      clientFilter !== "all" ? clientFilter : undefined,
      startDate || undefined,
      endDate || undefined,
    ),
  )

  const { data: clientsRes } = useSWR("active-clients-payments", () => getActiveClients())

  const payments = paymentsRes?.data ?? null
  const clients = clientsRes?.data ?? []

  const isSuperAdmin = user?.roles?.includes("SUPERADMIN")

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`?${params.toString()}`)
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailSheetOpen(true)
  }

  const handleRecordSuccess = () => {
    setRecordPaymentOpen(false)
    refreshPayments()
  }

  return (
    <PermissionGate permission="PAYMENTS_READ" showError>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Receipts</h1>
          <p className="text-muted-foreground">Record payments, allocate to invoices, and manage receipts</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="types">Payment Types</TabsTrigger>}
            <TabsTrigger value="receipts">Receipt Lookup</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-6">
            <PaymentsDataTable
              payments={payments}
              clients={clients}
              isLoading={loadingPayments}
              page={page}
              onPageChange={setPage}
              clientFilter={clientFilter}
              onClientFilterChange={(value) => {
                setClientFilter(value)
                setPage(0)
              }}
              startDate={startDate}
              onStartDateChange={(value) => {
                setStartDate(value)
                setPage(0)
              }}
              endDate={endDate}
              onEndDateChange={(value) => {
                setEndDate(value)
                setPage(0)
              }}
              onRefresh={refreshPayments}
              isRefreshing={isValidating}
              onRecordPayment={() => setRecordPaymentOpen(true)}
              onViewPayment={handleViewPayment}
            />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="types" className="mt-6">
              <PaymentTypesTable />
            </TabsContent>
          )}

          <TabsContent value="receipts" className="mt-6">
            <ReceiptLookup />
          </TabsContent>
        </Tabs>

        {/* Record Payment Sheet */}
        <Sheet open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
            <SheetHeader>
              <SheetTitle>Record Payment</SheetTitle>
              <SheetDescription>Record a new payment and optionally allocate to invoices</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-hidden py-4">
              <RecordPaymentForm onSuccess={handleRecordSuccess} onCancel={() => setRecordPaymentOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Payment Detail Sheet */}
        <PaymentDetailSheet
          paymentId={selectedPayment?.id ?? null}
          open={detailSheetOpen}
          onOpenChange={(open) => {
            setDetailSheetOpen(open)
            if (!open) setSelectedPayment(null)
          }}
          onRefresh={refreshPayments}
        />
      </div>
    </PermissionGate>
  )
}