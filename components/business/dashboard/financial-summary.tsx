"use client"

import { Wallet, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyDisplay } from "@/components/business/common/money-display"
import type { BusinessDashboardStats } from "@/types/business"

interface FinancialSummaryProps {
  stats: BusinessDashboardStats | null
  isLoading?: boolean
}

export function FinancialSummary({ stats, isLoading }: FinancialSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasOverdue = (stats?.overdueReceivables ?? 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>Current receivables and outstanding amounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Total Receivables */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>Total Receivables</span>
            </div>
            <MoneyDisplay amount={stats?.totalReceivables ?? 0} className="text-3xl font-bold" />
          </div>

          {/* Overdue Amount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className={`h-4 w-4 ${hasOverdue ? "text-destructive" : ""}`} />
              <span>Overdue Amount</span>
            </div>
            <MoneyDisplay
              amount={stats?.overdueReceivables ?? 0}
              className={`text-3xl font-bold ${hasOverdue ? "text-destructive" : ""}`}
            />
          </div>

          {/* Overdue Invoices Count */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className={`h-4 w-4 ${hasOverdue ? "text-destructive" : ""}`} />
              <span>Overdue Invoices</span>
            </div>
            <p className={`text-3xl font-bold ${hasOverdue ? "text-destructive" : ""}`}>
              {stats?.overdueInvoices ?? 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
