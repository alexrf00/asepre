"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/common/empty-state"
import { PermissionGate } from "@/components/common/permission-gate"
import { StatusBadge } from "@/components/business/common/status-badge"
import { MoneyDisplay } from "@/components/business/common/money-display"
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Pencil,
  RefreshCw,
  XCircle,
  CheckCircle,
  Download,
} from "lucide-react"
import { contractsApi } from "@/lib/api/business/contracts"
import { formatDate } from "@/lib/utils/business"

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: contract, error, isLoading } = useSWR(["contract", id], () => contractsApi.getById(id))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40 md:col-span-2" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <EmptyState
        icon={FileText}
        title="Contrato no encontrado"
        description="El contrato solicitado no existe o fue eliminado"
        action={{ label: "Volver a Contratos", href: "/business/contracts" }}
      />
    )
  }

  const daysUntilEnd = contract.endDate
    ? Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <PermissionGate permissions={["contracts.view"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/business/contracts">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{contract.contractNumber}</h1>
                <StatusBadge status={contract.status} type="contract" />
              </div>
              <p className="text-muted-foreground">Contrato con {contract.client?.companyName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            {contract.status === "draft" && (
              <>
                <PermissionGate permissions={["contracts.edit"]}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </PermissionGate>
                <PermissionGate permissions={["contracts.activate"]}>
                  <Button size="sm">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activar
                  </Button>
                </PermissionGate>
              </>
            )}
            {contract.status === "active" && (
              <>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renovar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Warning for expiring contracts */}
        {daysUntilEnd !== null && daysUntilEnd <= 30 && daysUntilEnd > 0 && (
          <div className="rounded-lg border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Este contrato vence en {daysUntilEnd} días ({formatDate(contract.endDate!)})
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="services">Servicios</TabsTrigger>
                <TabsTrigger value="invoices">Facturas</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Contrato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 md:grid-cols-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Tipo de Contrato</dt>
                        <dd className="font-medium">
                          {contract.contractType === "fixed" ? "Precio Fijo" : "Por Hora"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Fecha de Inicio</dt>
                        <dd className="font-medium">{formatDate(contract.startDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Fecha de Fin</dt>
                        <dd className="font-medium">
                          {contract.endDate ? formatDate(contract.endDate) : "Indefinido"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Renovación Automática</dt>
                        <dd className="font-medium">{contract.autoRenew ? "Sí" : "No"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Día de Facturación</dt>
                        <dd className="font-medium">Día {contract.billingDay} de cada mes</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Días de Crédito</dt>
                        <dd className="font-medium">{contract.paymentTermDays} días</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {contract.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle>Líneas de Servicio</CardTitle>
                    <CardDescription>Servicios incluidos en este contrato</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">ITBIS</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.lines?.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell className="font-medium">{line.service?.name}</TableCell>
                            <TableCell>{line.description || "-"}</TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">
                              <MoneyDisplay amount={line.unitPrice} />
                            </TableCell>
                            <TableCell className="text-right">
                              {line.itbisAmount > 0 ? <MoneyDisplay amount={line.itbisAmount} /> : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              <MoneyDisplay amount={line.subtotal} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <CardTitle>Facturas del Contrato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmptyState
                      icon={FileText}
                      title="Sin facturas"
                      description="No se han generado facturas para este contrato"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Cambios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">Contrato creado</p>
                          <p className="text-sm text-muted-foreground">{formatDate(contract.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{contract.client?.companyName}</p>
                  <p className="text-sm text-muted-foreground">RNC: {contract.client?.rnc}</p>
                </div>
                <Separator />
                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href={`/business/clients/${contract.clientId}`}>Ver Cliente</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <MoneyDisplay amount={contract.subtotal} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ITBIS (18%):</span>
                  <MoneyDisplay amount={contract.itbisTotal} />
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Valor Mensual:</span>
                  <MoneyDisplay amount={contract.monthlyValue} className="text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Vigencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inicio:</span>
                    <span>{formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin:</span>
                    <span>{contract.endDate ? formatDate(contract.endDate) : "Indefinido"}</span>
                  </div>
                  {daysUntilEnd !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Días restantes:</span>
                      <Badge variant={daysUntilEnd <= 30 ? "destructive" : "secondary"}>{daysUntilEnd} días</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGate>
  )
}
