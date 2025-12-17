"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatsCard } from "@/components/dashboard/stats-card"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { InvoiceTable } from "@/components/business/invoices/invoice-table"
import { CreateInvoiceDialog } from "@/components/business/invoices/create-invoice-dialog"
import { RegisterPaymentDialog } from "@/components/business/payments/register-payment-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Plus, Search, Filter, AlertTriangle, DollarSign, Clock } from "lucide-react"
import type { Invoice, InvoiceStatus, CreateInvoiceRequest } from "@/lib/types/business"
import { getInvoices, createInvoice, issueInvoice, cancelInvoice, getInvoiceStats } from "@/lib/api/business/invoices"
import { recordPayment } from "@/lib/api/business/payments"
import { formatDOP } from "@/lib/utils/business"
import { toast } from "sonner"

export default function InvoicesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null)
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null)
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null)

  const { data, error, isLoading, mutate } = useSWR(["invoices", search, statusFilter, page], () =>
    getInvoices(page, 10, undefined, statusFilter !== "all" ? (statusFilter as InvoiceStatus) : undefined, undefined),
  )

  const { data: statsData } = useSWR("invoice-stats", getInvoiceStats)

  const handleCreate = async (formData: CreateInvoiceRequest) => {
    try {
      await createInvoice(formData)
      toast.success("Factura creada exitosamente")
      mutate()
    } catch {
      toast.error("Error al crear la factura")
      throw new Error("Error")
    }
  }

  const handleSend = async () => {
    if (!invoiceToSend) return
    try {
      await issueInvoice(invoiceToSend.id)
      toast.success("Factura enviada al cliente")
      mutate()
    } catch {
      toast.error("Error al enviar la factura")
    } finally {
      setInvoiceToSend(null)
    }
  }

  const handleCancel = async () => {
    if (!invoiceToCancel) return
    try {
      await cancelInvoice(invoiceToCancel.id, { reason: "Anulada por usuario" })
      toast.success("Factura anulada")
      mutate()
    } catch {
      toast.error("Error al anular la factura")
    } finally {
      setInvoiceToCancel(null)
    }
  }

  const handleRegisterPayment = async (paymentData: {
    invoiceId: string
    amount: number
    paymentMethodId: string
    reference?: string
  }) => {
    if (!invoiceForPayment) return
    try {
      await recordPayment({
        clientId: invoiceForPayment.clientId,
        paymentTypeId: paymentData.paymentMethodId,
        amount: paymentData.amount,
        paymentDate: new Date().toISOString().split("T")[0],
        reference: paymentData.reference,
        allocations: [
          {
            invoiceId: paymentData.invoiceId,
            amount: paymentData.amount,
          },
        ],
        generateReceipt: true,
      })
      toast.success("Pago registrado exitosamente")
      mutate()
    } catch {
      toast.error("Error al registrar el pago")
      throw new Error("Error")
    }
  }

  const invoices = data?.content || []
  const totalPages = data?.totalPages || 1
  const totalElements = data?.totalElements || 0

  const stats = {
    total: statsData?.draft ?? 0 + (statsData?.issued ?? 0) + (statsData?.partial ?? 0) + (statsData?.paid ?? 0),
    pending: statsData?.issued ?? 0,
    overdue: statsData?.overdue ?? 0,
    totalPending: statsData?.totalReceivables ?? 0,
  }

  return (
    <PermissionGate permissions={["invoices.view"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground">Gestione la facturación de sus servicios</p>
          </div>
          <PermissionGate permissions={["invoices.create"]}>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            <>
              <StatsCard title="Total Facturas" value={totalElements} icon={FileText} />
              <StatsCard title="Por Cobrar" value={stats.pending} icon={Clock} />
              <StatsCard
                title="Vencidas"
                value={stats.overdue}
                icon={AlertTriangle}
                className={stats.overdue > 0 ? "border-destructive" : ""}
              />
              <StatsCard
                title="Monto Pendiente"
                value={formatDOP(stats.totalPending)}
                icon={DollarSign}
                className={stats.totalPending > 0 ? "border-amber-500" : ""}
              />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por NCF, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="ISSUED">Emitida</SelectItem>
                <SelectItem value="PARTIAL">Pago Parcial</SelectItem>
                <SelectItem value="PAID">Pagada</SelectItem>
                <SelectItem value="CANCELLED">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error al cargar"
            description="No se pudieron cargar las facturas"
            action={<Button onClick={() => mutate()}>Reintentar</Button>}
          />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin facturas"
            description="No hay facturas que coincidan con los filtros"
            action={<Button onClick={() => setCreateDialogOpen(true)}>Crear Factura</Button>}
          />
        ) : (
          <InvoiceTable
            invoices={invoices}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onSend={setInvoiceToSend}
            onRegisterPayment={setInvoiceForPayment}
            onCancel={setInvoiceToCancel}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {invoices.length} de {totalElements} facturas
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Create Dialog */}
        <CreateInvoiceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSubmit={handleCreate} />

        {/* Register Payment Dialog */}
        <RegisterPaymentDialog
          open={!!invoiceForPayment}
          onOpenChange={() => setInvoiceForPayment(null)}
          invoice={invoiceForPayment}
          onSubmit={handleRegisterPayment}
        />

        {/* Send Dialog */}
        <AlertDialog open={!!invoiceToSend} onOpenChange={() => setInvoiceToSend(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enviar Factura</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea enviar la factura {invoiceToSend?.ncf || invoiceToSend?.invoiceNumber} al
                cliente? Esto asignará el NCF oficial y enviará el documento por correo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSend}>Enviar Factura</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={!!invoiceToCancel} onOpenChange={() => setInvoiceToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anular Factura</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea anular la factura {invoiceToCancel?.ncf || invoiceToCancel?.invoiceNumber}? Esta
                acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                Sí, anular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGate>
  )
}
