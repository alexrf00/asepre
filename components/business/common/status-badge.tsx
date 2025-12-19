"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, Ban, FileText, Play, Pause, CircleDot } from "lucide-react"
import type { ClientStatus, ContractStatus, InvoiceStatus, PaymentStatus, ReceiptStatus } from "@/types/business"

type StatusType = "client" | "contract" | "invoice" | "payment" | "receipt"
type StatusValue = ClientStatus | ContractStatus | InvoiceStatus | PaymentStatus | ReceiptStatus

interface StatusBadgeProps {
  status: StatusValue
  type: StatusType
  className?: string
}

const statusConfig: Record<
  StatusType,
  Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
  >
> = {
  client: {
    ACTIVE: { label: "Active", variant: "default", icon: CheckCircle2 },
    INACTIVE: { label: "Inactive", variant: "secondary", icon: XCircle },
    SUSPENDED: { label: "Suspended", variant: "destructive", icon: Ban },
  },
  contract: {
    DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
    ACTIVE: { label: "Active", variant: "default", icon: Play },
    SUSPENDED: { label: "Suspended", variant: "outline", icon: Pause },
    TERMINATED: { label: "Terminated", variant: "destructive", icon: XCircle },
  },
  invoice: {
    DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
    ISSUED: { label: "Issued", variant: "outline", icon: Clock },
    PARTIAL: { label: "Partial", variant: "outline", icon: CircleDot },
    PAID: { label: "Paid", variant: "default", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelled", variant: "secondary", icon: XCircle },
    VOID: { label: "Void", variant: "destructive", icon: Ban },
  },
  payment: {
    PENDING: { label: "Pending", variant: "outline", icon: Clock },
    ALLOCATED: { label: "Allocated", variant: "default", icon: CheckCircle2 },
    PARTIAL: { label: "Partial", variant: "outline", icon: CircleDot },
  },
  receipt: {
    ACTIVE: { label: "Active", variant: "default", icon: CheckCircle2 },
    VOID: { label: "Void", variant: "destructive", icon: Ban },
  },
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const config = statusConfig[type]?.[status]

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }

  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "gap-1",
        type === "invoice" && (status === "CANCELLED" || status === "VOID") && "line-through",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
