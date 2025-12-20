"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileText, Clock, CircleDot, CheckCircle2, XCircle, Ban, AlertTriangle } from "lucide-react"
import type { InvoiceStatus } from "@/types/business"

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  isOverdue?: boolean
  className?: string
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: React.ElementType
  }
> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
  ISSUED: { label: "Issued", variant: "outline", icon: Clock },
  PARTIAL: { label: "Partial", variant: "outline", icon: CircleDot },
  PAID: { label: "Paid", variant: "default", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "secondary", icon: XCircle },
  VOID: { label: "Void", variant: "destructive", icon: Ban },
}

export function InvoiceStatusBadge({ status, isOverdue, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status]

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }

  // If overdue, show overdue badge instead
  if (isOverdue && (status === "ISSUED" || status === "PARTIAL")) {
    return (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <AlertTriangle className="h-3 w-3" />
        Overdue
      </Badge>
    )
  }

  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1", (status === "CANCELLED" || status === "VOID") && "line-through", className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
