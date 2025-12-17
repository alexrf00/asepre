"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGate } from "@/components/common/permission-gate"
import { MoneyDisplay } from "@/components/business/common/money-display"
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileCheck,
  Calendar,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

// Sample data for charts
const revenueData = [
  { month: "Ene", ingresos: 450000, gastos: 180000 },
  { month: "Feb", ingresos: 520000, gastos: 195000 },
  { month: "Mar", ingresos: 480000, gastos: 175000 },
  { month: "Abr", ingresos: 590000, gastos: 210000 },
  { month: "May", ingresos: 620000, gastos: 225000 },
  { month: "Jun", ingresos: 680000, gastos: 240000 },
]

const collectionsData = [
  { month: "Ene", cobrado: 420000, pendiente: 80000 },
  { month: "Feb", cobrado: 490000, pendiente: 95000 },
  { month: "Mar", cobrado: 450000, pendiente: 110000 },
  { month: "Abr", cobrado: 560000, pendiente: 85000 },
  { month: "May", cobrado: 590000, pendiente: 70000 },
  { month: "Jun", cobrado: 650000, pendiente: 60000 },
]

const chartConfig = {
  ingresos: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
  gastos: {
    label: "Gastos",
    color: "hsl(var(--chart-2))",
  },
  cobrado: {
    label: "Cobrado",
    color: "hsl(var(--chart-1))",
  },
  pendiente: {
    label: "Pendiente",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [reportType, setReportType] = useState("revenue")

  const summaryStats = {
    totalRevenue: 3340000,
    revenueGrowth: 12.5,
    totalCollected: 3160000,
    collectionRate: 94.6,
    activeContracts: 45,
    activeClients: 38,
    overdueAmount: 180000,
    overdueInvoices: 5,
  }

  const handleExport = (format: "pdf" | "excel") => {
    // Export logic would go here
    console.log(`Exporting report as ${format}`)
  }

  return (
    <PermissionGate permissions={["reports.view"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground">Análisis financiero y operativo del negocio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Date Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select defaultValue="month">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Semanal</SelectItem>
                    <SelectItem value="month">Mensual</SelectItem>
                    <SelectItem value="quarter">Trimestral</SelectItem>
                    <SelectItem value="year">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <MoneyDisplay amount={summaryStats.totalRevenue} className="text-2xl font-bold" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${summaryStats.revenueGrowth > 0 ? "text-emerald-600" : "text-destructive"}`}
                >
                  {summaryStats.revenueGrowth > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(summaryStats.revenueGrowth)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cobrado</p>
                  <MoneyDisplay amount={summaryStats.totalCollected} className="text-2xl font-bold text-emerald-600" />
                </div>
                <div className="text-sm text-muted-foreground">{summaryStats.collectionRate}% cobrado</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contratos Activos</p>
                  <p className="text-2xl font-bold">{summaryStats.activeContracts}</p>
                </div>
                <FileCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{summaryStats.activeClients} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Por Cobrar (Vencido)</p>
                  <MoneyDisplay amount={summaryStats.overdueAmount} className="text-2xl font-bold text-amber-600" />
                </div>
                <DollarSign className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{summaryStats.overdueInvoices} facturas vencidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Ingresos vs Gastos</TabsTrigger>
            <TabsTrigger value="collections">Cobranza</TabsTrigger>
            <TabsTrigger value="clients">Por Cliente</TabsTrigger>
            <TabsTrigger value="services">Por Servicio</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos vs Gastos</CardTitle>
                <CardDescription>Comparativa mensual de ingresos y gastos operativos</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}K`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" fill="var(--color-gastos)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Cobranza</CardTitle>
                <CardDescription>Montos cobrados vs pendientes por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={collectionsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}K`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="cobrado"
                        stroke="var(--color-cobrado)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pendiente"
                        stroke="var(--color-pendiente)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Cliente</CardTitle>
                <CardDescription>Top 10 clientes por facturación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Supermercados Nacional", amount: 520000, percentage: 15.6 },
                    { name: "Banco Popular Dominicano", amount: 480000, percentage: 14.4 },
                    { name: "Grupo Ramos", amount: 420000, percentage: 12.6 },
                    { name: "CCN", amount: 380000, percentage: 11.4 },
                    { name: "Farmacia Carol", amount: 340000, percentage: 10.2 },
                    { name: "Plaza Lama", amount: 300000, percentage: 9.0 },
                    { name: "Jumbo", amount: 280000, percentage: 8.4 },
                    { name: "La Sirena", amount: 260000, percentage: 7.8 },
                    { name: "Carrefour", amount: 200000, percentage: 6.0 },
                    { name: "Otros", amount: 160000, percentage: 4.8 },
                  ].map((client, index) => (
                    <div key={client.name} className="flex items-center gap-4">
                      <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{client.name}</span>
                          <MoneyDisplay amount={client.amount} className="font-medium" />
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${client.percentage * 4}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-sm text-muted-foreground text-right">{client.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Servicio</CardTitle>
                <CardDescription>Distribución de ingresos por tipo de servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Vigilancia Física 24/7", amount: 1200000, percentage: 35.9, color: "bg-emerald-500" },
                    { name: "Vigilancia Física 12h", amount: 800000, percentage: 24.0, color: "bg-blue-500" },
                    { name: "Escoltas Ejecutivos", amount: 520000, percentage: 15.6, color: "bg-purple-500" },
                    { name: "Monitoreo CCTV", amount: 420000, percentage: 12.6, color: "bg-amber-500" },
                    { name: "Seguridad Eventos", amount: 280000, percentage: 8.4, color: "bg-pink-500" },
                    { name: "Otros Servicios", amount: 120000, percentage: 3.6, color: "bg-slate-500" },
                  ].map((service) => (
                    <div key={service.name} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${service.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{service.name}</span>
                          <MoneyDisplay amount={service.amount} className="font-medium" />
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${service.color} rounded-full`}
                            style={{ width: `${service.percentage * 2.5}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-sm text-muted-foreground text-right">{service.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Reports */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:border-emerald-500 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Reporte 606
              </CardTitle>
              <CardDescription>Compras de bienes y servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Generar
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-emerald-500 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Reporte 607
              </CardTitle>
              <CardDescription>Ventas de bienes y servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Generar
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-emerald-500 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Cartera de Clientes
              </CardTitle>
              <CardDescription>Listado completo de clientes activos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Generar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  )
}
