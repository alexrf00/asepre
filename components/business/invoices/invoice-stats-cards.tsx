"use client"

import { FileText, Clock, CircleDot, CheckCircle2, AlertTriangle, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyDisplay } from "@/components/business/common/money-display"
import type { InvoiceStats } from "@/types/business"

interface InvoiceStatsCardsProps {
  stats: InvoiceStats | null
  isLoading?: boolean
}

export function InvoiceStatsCards({ stats, isLoading }: InvoiceStatsCardsProps) {
  const cards = [
    {
      title: "Draft",
      value: stats?.draft ?? 0,
      icon: FileText,
      variant: "default" as const,
    },
    {
      title: "Issued",
      value: stats?.issued ?? 0,
      icon: Clock,
      variant: "blue" as const,
    },
    {
      title: "Partial",
      value: stats?.partial ?? 0,
      icon: CircleDot,
      variant: "yellow" as const,
    },
    {
      title: "Paid",
      value: stats?.paid ?? 0,
      icon: CheckCircle2,
      variant: "green" as const,
    },
    {
      title: "Overdue",
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      variant: "red" as const,
    },
    {
      title: "Total Receivables",
      value: stats?.totalReceivables ?? 0,
      icon: DollarSign,
      variant: "default" as const,
      isMoney: true,
    },
  ]

  const variantStyles = {
    default: "text-foreground",
    blue: "text-blue-600",
    yellow: "text-amber-600",
    green: "text-green-600",
    red: "text-destructive",
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${variantStyles[card.variant]}`} />
                <span className="text-sm text-muted-foreground">{card.title}</span>
              </div>
              <div className="mt-2">
                {card.isMoney ? (
                  <MoneyDisplay amount={card.value} className="text-2xl font-bold" />
                ) : (
                  <p className={`text-2xl font-bold ${variantStyles[card.variant]}`}>{card.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
