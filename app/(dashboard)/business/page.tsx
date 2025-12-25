"use client"

import { format } from "date-fns"
import useSWR from "swr"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { BusinessStatsCards } from "@/components/business/dashboard/business-stats-cards"
import { FinancialSummary } from "@/components/business/dashboard/financial-summary"
import { RevenueChart } from "@/components/business/dashboard/revenue-chart"
import { QuickActions } from "@/components/business/dashboard/quick-actions"
import { InvoiceAlerts } from "@/components/business/dashboard/invoice-alerts"
import { getBusinessStats, getRevenueData } from "@/lib/api/business-dashboard"
import { getInvoiceStats } from "@/lib/api/invoices"

export default function BusinessDashboardPage() {
  // Fetch business stats
  const {
    data: statsRes,
    isLoading: loadingStats,
    mutate: refreshStats,
  } = useSWR("business-stats", () => getBusinessStats(), { revalidateOnFocus: false })

  // Fetch revenue data (last 12 months)
  const { data: revenueRes, isLoading: loadingRevenue } = useSWR("revenue-data", () => getRevenueData(12), {
    revalidateOnFocus: false,
  })

  // Fetch invoice stats for alerts
  const {
    data: invoiceStatsRes,
    isLoading: loadingInvoiceStats,
    mutate: refreshInvoiceStats,
  } = useSWR("invoice-stats-dashboard", () => getInvoiceStats(), { revalidateOnFocus: false })

  const stats = statsRes?.data ?? null
  const revenueData = revenueRes?.data ?? []
  const invoiceStats = invoiceStatsRes?.data ?? null

  const handleRefresh = () => {
    refreshStats()
    refreshInvoiceStats()
  }

  return (
    <ProtectedRoute permission="DASHBOARD_READ">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Business Dashboard</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <p>Overview of your business operations</p>
            <span className="text-xs">· Last updated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        </div>

        {/* Alerts Section */}
        <InvoiceAlerts stats={stats} invoiceStats={invoiceStats} isLoading={loadingStats || loadingInvoiceStats} />

        {/* Key Metrics Cards */}
        <BusinessStatsCards stats={stats} isLoading={loadingStats} />

        {/* Financial Overview and Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinancialSummary stats={stats} isLoading={loadingStats} />
          </div>
          <div>
            <QuickActions onRecurringInvoicingSuccess={handleRefresh} />
          </div>
        </div>

        {/* Revenue Chart */}
        <RevenueChart data={revenueData} isLoading={loadingRevenue} />
      </div>
    </ProtectedRoute>
  )
}