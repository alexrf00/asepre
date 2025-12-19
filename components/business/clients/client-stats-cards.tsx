"use client"

import { Users, UserCheck, UserX, UserMinus } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ClientStats } from "@/types/business"

interface ClientStatsCardsProps {
  stats: ClientStats | null
  isLoading: boolean
}

export function ClientStatsCards({ stats, isLoading }: ClientStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Clients"
        value={stats?.totalClients ?? 0}
        icon={Users}
        description="All registered clients"
      />
      <StatsCard
        title="Active"
        value={stats?.activeClients ?? 0}
        icon={UserCheck}
        description="Currently active clients"
        className="border-l-4 border-l-emerald-500"
      />
      <StatsCard
        title="Inactive"
        value={stats?.inactiveClients ?? 0}
        icon={UserMinus}
        description="Temporarily inactive"
        className="border-l-4 border-l-gray-500"
      />
      <StatsCard
        title="Suspended"
        value={stats?.suspendedClients ?? 0}
        icon={UserX}
        description="Account suspended"
        className="border-l-4 border-l-red-500"
      />
    </div>
  )
}
