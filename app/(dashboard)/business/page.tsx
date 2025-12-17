"use client"

// ===== Business Dashboard Page =====

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Building2, FileText, Receipt, DollarSign, Plus, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/business/common/status-badge"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { PermissionGate } from "@/components/common/permission-gate"
import { formatDateDO } from "@/lib/utils/business"
import type { Invoice, BusinessDashboardStats, RevenueDataPoint } from "@/lib/types/business"
import { getDashboardStats, getRevenueData } from "@/lib/api/business/dashboard"
import { getInvoices } from "@/lib/api/business/invoices"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

export default function BusinessDashboardPage() {
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [statsData, revenue, recent, overdue] = await Promise.all([
        getDashboardStats(),
        getRevenueData(),
        getInvoices(0, 5, undefined, undefined, false),
        getInvoices(0, 5, undefined, "ISSUED", true),
      ])

      setStats(statsData)
      setRevenueData(revenue)
      setRecentInvoices(recent.content)
      setOverdueInvoices(overdue.content)
    } catch {
      toast.error("Error al cargar datos del dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Overview</h1>
          <p className="text-muted-foreground">Panel de control para gestión comercial de ASEPRE</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadDashboardData}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clientes"
          value={stats?.totalClients ?? 0}
          description={`${stats?.activeClients ?? 0} activos`}
          icon={Building2}
        />
        <StatsCard title="Contratos Activos" value={stats?.activeContracts ?? 0} icon={FileText} />
        <StatsCard
          title="Facturas Pendientes"
          value={stats?.pendingInvoices ?? 0}
          description={`${stats?.overdueInvoices ?? 0} vencidas`}
          icon={Receipt}
        />
        <StatsCard
          title="Ingresos del Mes"
          value={<MoneyDisplay amount={stats?.monthlyRevenue ?? 0} size="lg" />}
          icon={DollarSign}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ingresos Mensuales
            </CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Ingresos",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No hay datos de ingresos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Operaciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PermissionGate permissions={["BUSINESS_CLIENT_CREATE"]}>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/business/clients?action=new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permissions={["BUSINESS_CONTRACT_CREATE"]}>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/business/contracts?action=new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Contrato
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permissions={["BUSINESS_INVOICE_CREATE"]}>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/business/invoices?action=new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Factura
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permissions={["BUSINESS_PAYMENT_CREATE"]}>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/business/payments?action=new">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Link>
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Facturas Recientes</CardTitle>
              <CardDescription>Últimas 5 facturas creadas</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/business/invoices">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <Link href={`/business/invoices/${invoice.id}`} className="font-medium hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <MoneyDisplay amount={invoice.total} className="font-medium" />
                      <StatusBadge type="invoice" status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Receipt} title="Sin facturas" description="No hay facturas recientes" />
            )}
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Facturas Vencidas
              </CardTitle>
              <CardDescription>Requieren atención inmediata</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/business/invoices?status=overdue">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length > 0 ? (
              <div className="space-y-4">
                {overdueInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <Link href={`/business/invoices/${invoice.id}`} className="font-medium hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                      <p className="text-xs text-red-500">Venció: {formatDateDO(invoice.dueDate)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <MoneyDisplay amount={invoice.balance} className="font-medium text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Receipt} title="Sin vencimientos" description="No hay facturas vencidas" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
