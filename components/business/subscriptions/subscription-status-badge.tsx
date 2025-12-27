"use client"

import { Badge } from "@/components/ui/badge"
import type { SubscriptionStatus } from "@/types/business"

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus
}

const statusConfig: Record<SubscriptionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "outline" },
}

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}