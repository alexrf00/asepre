"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/formatters"
import type { RevenueDataPoint } from "@/types/business"

interface RevenueChartProps {
  data: RevenueDataPoint[]
  isLoading?: boolean
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  // Transform data for chart display - safely handle empty/invalid data
  const chartData = (data || []).map((point) => {
    try {
      // point.month could be "2024-01" format, need to add day for valid ISO date
      const dateStr = point.month.includes("-") && point.month.length === 7 
        ? `${point.month}-01` 
        : point.month
      return {
        ...point,
        monthLabel: format(parseISO(dateStr), "MMM yyyy", { locale: es }),
      }
    } catch {
      // If date parsing fails, use the raw month string
      return {
        ...point,
        monthLabel: point.month,
      }
    }
  })

  // Calculate trend
  const hasData = chartData.length >= 2
  const lastMonth = chartData[chartData.length - 1]?.revenue ?? 0
  const prevMonth = chartData[chartData.length - 2]?.revenue ?? 0
  const trend = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 12 months</CardDescription>
          </div>
          {hasData && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className={`h-4 w-4 ${trend >= 0 ? "text-green-600" : "text-destructive"}`} />
              <span className={trend >= 0 ? "text-green-600" : "text-destructive"}>
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No revenue data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, "DOP").replace("RD$", "").trim()}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium">{payload[0].payload.monthLabel}</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(payload[0].value as number, "DOP")}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
