"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { DollarSign, Search, Filter, AlertTriangle, CreditCard, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { StatsCard } from "@/components/dashboard/stats-card"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { PaymentTable } from "@/components/business/payments/payment-table"
import { MoneyDisplay } from "@/components/business/common/money-display"

import type { Payment, Receipt } from "@/lib/types/business"
import { getPayments } from "@/lib/api/business/payments"
import { getReceiptByPayment } from "@/lib/api/business/receipts"
import { formatDOP, formatDateDO, getPaymentMethodLabel } from "@/lib/utils/business"

const PAGE_SIZE = 10

export default function PaymentsPage() {
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isReceiptLoading, setIsReceiptLoading] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(["payments", page], () => getPayments(page - 1, PAGE_SIZE))

  const paymentsRaw = data?.content ?? []

  const payments = useMemo(() => {
    const s = search.trim().toLowerCase()
    return paymentsRaw.filter((p) => {
      const matchesSearch =
        !s ||
        p.clientName.toLowerCase().includes(s) ||
        p.paymentNumber.toLowerCase().includes(s) ||
        (p.reference ?? "").toLowerCase().includes(s)

      const matchesMethod =
        methodFilter === "all" || (p.paymentTypeCode ?? "").toLowerCase() === methodFilter.toLowerCase()

      return matchesSearch && matchesMethod
    })
  }, [paymentsRaw, search, methodFilter])

  const stats = useMemo(() => {
    const totalElements = data?.totalElements ?? payments.length

    const thisMonth = payments.filter((p) => {
      const d = new Date(p.paymentDate)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const avgPayment = payments.length > 0 ? totalAmount / payments.length : 0

    return { totalElements, thisMonth, totalAmount, avgPayment }
  }, [data?.totalElements, payments])

  async function handleViewReceipt(payment: Payment) {
    setReceiptPayment(payment)
    setReceipt(null)
    setIsReceiptLoading(true)

    try {
      const r = await getReceiptByPayment(payment.id)
      if (!r) {
        toast.message("Este pago no tiene recibo todavía")
      }
      setReceipt(r)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando recibo")
      setReceipt(null)
    } finally {
      setIsReceiptLoading(false)
    }
  }

  function closeReceipt() {
    setReceiptPayment(null)
    setReceipt(null)
    setIsReceiptLoading(false)
  }

  const firstInvoice = receiptPayment?.allocations?.[0]

  return (
    <PermissionGate permissions={["payments.view"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
            <p className="text-muted-foreground">Historial de pagos recibidos</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            <>
              <StatsCard title="Total Pagos" value={stats.totalElements} icon={DollarSign} />
              <StatsCard title="Este Mes" value={stats.thisMonth} icon={TrendingUp} />
              <StatsCard title="Monto Total" value={formatDOP(stats.totalAmount)} icon={CreditCard} className="border-emerald-500" />
              <StatsCard title="Promedio por Pago" value={formatDOP(stats.avgPayment)} icon={DollarSign} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, referencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-96" />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error al cargar"
            description="No se pudieron cargar los pagos"
            action={{ label: "Reintentar", onClick: () => mutate() }}
          />
        ) : payments.length === 0 ? (
          <EmptyState icon={DollarSign} title="Sin pagos" description="No hay pagos que coincidan con los filtros" />
        ) : (
          <PaymentTable payments={payments} onViewReceipt={handleViewReceipt} />
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {payments.length} de {data.totalElements} pagos
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        <Sheet open={!!receiptPayment} onOpenChange={(open) => !open && closeReceipt()}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Recibo de Pago</SheetTitle>
              <SheetDescription>
                {isReceiptLoading ? "Cargando..." : receipt?.receiptNumber ?? "Sin recibo"}
              </SheetDescription>
            </SheetHeader>

            {receiptPayment && (
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span>{formatDateDO(receipt?.receiptDate ?? receiptPayment.paymentDate)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{receiptPayment.clientName}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Factura:</span>
                    <span>{firstInvoice?.invoiceNumber ?? "-"}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span>{getPaymentMethodLabel(receiptPayment.paymentTypeCode)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referencia:</span>
                    <span>{receiptPayment.reference || "-"}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Monto:</span>
                    <MoneyDisplay amount={receiptPayment.amount} className="text-emerald-600" />
                  </div>
                </div>

                <Button className="w-full" disabled={!receipt || isReceiptLoading}>
                  Imprimir Recibo
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PermissionGate>
  )
}
