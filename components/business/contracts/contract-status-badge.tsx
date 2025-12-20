"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { FileEdit, CheckCircle2, PauseCircle, XCircle, Clock } from "lucide-react"
import type { ContractStatus } from "@/types/business"

interface ContractStatusBadgeProps {
  status: ContractStatus
}

const statusConfig: Record<
  ContractStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: React.ElementType
    className: string
  }
> = {
  DRAFT: {
    label: "Draft",
    variant: "outline",
    icon: FileEdit,
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
  },
  ACTIVE: {
    label: "Active",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  SUSPENDED: {
    label: "Suspended",
    variant: "outline",
    icon: PauseCircle,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  },
  TERMINATED: {
    label: "Terminated",
    variant: "destructive",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  EXPIRED: {
    label: "Expired",
    variant: "secondary",
    icon: Clock,
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
