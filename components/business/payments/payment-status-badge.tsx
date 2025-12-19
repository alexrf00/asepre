"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, CircleDot } from "lucide-react"
import type { PaymentStatus } from "@/types/business"

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock; className: string }
> = {
  PENDING: {
    label: "Pending",
    variant: "outline",
    icon: Clock,
    className: "border-amber-500 text-amber-600 bg-amber-50",
  },
  PARTIAL: {
    label: "Partial",
    variant: "outline",
    icon: CircleDot,
    className: "border-blue-500 text-blue-600 bg-blue-50",
  },
  ALLOCATED: {
    label: "Allocated",
    variant: "outline",
    icon: CheckCircle2,
    className: "border-green-500 text-green-600 bg-green-50",
  },
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
