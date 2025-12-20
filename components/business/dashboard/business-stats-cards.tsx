"use client"

import Link from "next/link"
import { Users, FileText, Receipt, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyDisplay } from "@/components/business/common/money-display"
import type { BusinessDashboardStats } from "@/types/business"

interface BusinessStatsCardsProps {
  stats: BusinessDashboardStats | null
  isLoading?: boolean
}

export function BusinessStatsCards({ stats, isLoading }: BusinessStatsCardsProps) {
  const cards = [
    {
      title: "Total Clients",
      value: stats?.totalClients ?? 0,
      subtitle: `${stats?.activeClients ?? 0} active`,
      icon: Users,
      href: "/business/clients",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Contracts",
      value: stats?.activeContracts ?? 0,
      icon: FileText,
      href: "/business/contracts",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Pending Invoices",
      value: stats?.pendingInvoices ?? 0,
      icon: Receipt,
      href: "/business/invoices",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Monthly Revenue",
      value: stats?.monthlyRevenue ?? 0,
      icon: DollarSign,
      href: "/business/payments",
      color: "text-green-600",
      bgColor: "bg-green-50",
      isMoney: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.title} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    {card.isMoney ? (
                      <MoneyDisplay amount={card.value} className="text-2xl font-bold" />
                    ) : (
                      <p className="text-2xl font-bold">{card.value}</p>
                    )}
                    {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
