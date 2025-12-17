"use client"

// ===== Client Detail Page =====

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Pencil,
  Ban,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
  CreditCard,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { PermissionGate } from "@/components/common/permission-gate"
import { StatusBadge } from "@/components/business/common/status-badge"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { EditClientDialog } from "@/components/business/clients/edit-client-dialog"
import { getClientById, deleteClient } from "@/lib/api/business/clients"
import { getContracts } from "@/lib/api/business/contracts"
import { getInvoices } from "@/lib/api/business/invoices"
import { getPayments } from "@/lib/api/business/payments"
import { formatRNC, formatDateDO } from "@/lib/utils/business"
import type { Client, Contract, Invoice, Payment } from "@/lib/types/business"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ClientDetailPage(props: ClientDetailPageProps) {
  const params = use(props.params)
  const router = useRouter()

  const [client, setClient] = useState<Client | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [clientData, contractsData, invoicesData, paymentsData] = await Promise.all([
        getClientById(params.id),
        getContracts(0, 10, params.id),
        getInvoices(0, 10, params.id),
        getPayments(0, 10, params.id),
      ])

      setClient(clientData)
      setContracts(contractsData.content)
      setInvoices(invoicesData.content)
      setPayments(paymentsData.content)
    } catch {
      toast.error("Error al cargar cliente")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDeactivate() {
    if (!client) return

    setIsDeactivating(true)
    try {
      const response = await deleteClient(client.id)
      if (response.success) {
        toast.success("Cliente desactivado")
        router.push("/business/clients")
      } else {
        toast.error(response.message || "Error al desactivar cliente")
      }
    } catch {
      toast.error("Error al desactivar cliente")
    } finally {
      setIsDeactivating(false)
      setIsDeactivateOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Cliente no encontrado</h2>
        <Button asChild variant="link" className="mt-2">
          <Link href="/business/clients">Volver a clientes</Link>
        </Button>
      </div>
    )
  }

  // Calculate account summary
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/business/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <StatusBadge type="client" status={client.status} />
          </div>
          <p className="text-muted-foreground pl-10">
            {client.legalTypeName} {client.rnc && `• RNC: ${formatRNC(client.rnc)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <PermissionGate permissions={["BUSINESS_CLIENT_UPDATE"]}>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </PermissionGate>
          {client.status === "ACTIVE" && (
            <PermissionGate permissions={["BUSINESS_CLIENT_DELETE"]}>
              <Button variant="destructive" onClick={() => setIsDeactivateOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Desactivar
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
          <TabsTrigger value="invoices">Facturas ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments">Pagos ({payments.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-4 w-4" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contactPerson && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contacto principal</p>
                    <p className="font-medium">{client.contactPerson}</p>
                  </div>
                )}
                {client.primaryEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.primaryEmail}`} className="hover:underline">
                      {client.primaryEmail}
                    </a>
                  </div>
                )}
                {client.secondaryEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.secondaryEmail}`} className="hover:underline">
                      {client.secondaryEmail}
                    </a>
                  </div>
                )}
                {client.primaryPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.primaryPhone}</span>
                  </div>
                )}
                {client.secondaryPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.secondaryPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  Resumen de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total facturado</span>
                  <MoneyDisplay amount={totalInvoiced} className="font-medium" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total pagado</span>
                  <MoneyDisplay amount={totalPaid} className="font-medium text-emerald-500" />
                </div>
                <div className="flex justify-between border-t pt-4">
                  <span className="font-medium">Balance pendiente</span>
                  <MoneyDisplay amount={totalBalance} className="font-bold" size="lg" />
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  Dirección de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.billingAddressLine1 ? (
                  <div className="space-y-1">
                    <p>{client.billingAddressLine1}</p>
                    {client.billingAddressLine2 && <p>{client.billingAddressLine2}</p>}
                    <p>
                      {[client.billingCity, client.billingProvince, client.billingPostalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p>{client.billingCountry}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin dirección registrada</p>
                )}
              </CardContent>
            </Card>

            {/* Service Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  Dirección de Servicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.serviceAddressLine1 ? (
                  <div className="space-y-1">
                    <p>{client.serviceAddressLine1}</p>
                    {client.serviceAddressLine2 && <p>{client.serviceAddressLine2}</p>}
                    <p>
                      {[client.serviceCity, client.serviceProvince, client.servicePostalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {client.serviceCountry && <p>{client.serviceCountry}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin dirección registrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contratos</CardTitle>
                <CardDescription>Contratos asociados a este cliente</CardDescription>
              </div>
              <PermissionGate permissions={["BUSINESS_CONTRACT_CREATE"]}>
                <Button asChild>
                  <Link href={`/business/contracts?action=new&clientId=${client.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Nuevo Contrato
                  </Link>
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent>
              {contracts.length > 0 ? (
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <Link href={`/business/contracts/${contract.id}`} className="font-medium hover:underline">
                          {contract.contractNumber}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDateDO(contract.startDate)} -{" "}
                          {contract.endDate ? formatDateDO(contract.endDate) : "Indefinido"}
                        </p>
                      </div>
                      <StatusBadge type="contract" status={contract.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No hay contratos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Facturas</CardTitle>
                <CardDescription>Facturas emitidas a este cliente</CardDescription>
              </div>
              <PermissionGate permissions={["BUSINESS_INVOICE_CREATE"]}>
                <Button asChild>
                  <Link href={`/business/invoices?action=new&clientId=${client.id}`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Nueva Factura
                  </Link>
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <Link href={`/business/invoices/${invoice.id}`} className="font-medium hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-sm text-muted-foreground">{formatDateDO(invoice.issueDate)}</p>
                      </div>
                      <div className="text-right">
                        <MoneyDisplay amount={invoice.total} className="font-medium" />
                        <StatusBadge type="invoice" status={invoice.status} className="ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No hay facturas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pagos</CardTitle>
                <CardDescription>Pagos recibidos de este cliente</CardDescription>
              </div>
              <PermissionGate permissions={["BUSINESS_PAYMENT_CREATE"]}>
                <Button asChild>
                  <Link href={`/business/payments?action=new&clientId=${client.id}`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Registrar Pago
                  </Link>
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <Link href={`/business/payments/${payment.id}`} className="font-medium hover:underline">
                          {payment.paymentNumber}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDateDO(payment.paymentDate)} • {payment.paymentTypeName}
                        </p>
                      </div>
                      <MoneyDisplay amount={payment.amount} className="font-medium text-emerald-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No hay pagos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditClientDialog client={client} open={isEditOpen} onOpenChange={setIsEditOpen} onSuccess={loadData} />

      <ConfirmDialog
        open={isDeactivateOpen}
        onOpenChange={setIsDeactivateOpen}
        title="Desactivar Cliente"
        description={`¿Está seguro de desactivar a ${client.name}? El cliente no podrá ser seleccionado para nuevos contratos o facturas.`}
        confirmText="Desactivar"
        variant="destructive"
        onConfirm={handleDeactivate}
        isLoading={isDeactivating}
      />
    </div>
  )
}
