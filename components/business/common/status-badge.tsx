// ===== Generic Status Badge Component =====

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ClientStatus, ContractStatus, InvoiceStatus, PaymentStatus } from "@/lib/types/business"
import {
  getClientStatusColor,
  getClientStatusLabel,
  getContractStatusColor,
  getContractStatusLabel,
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from "@/lib/utils/business"

type StatusType = "client" | "contract" | "invoice" | "payment"
type StatusValue = ClientStatus | ContractStatus | InvoiceStatus | PaymentStatus

interface StatusBadgeProps {
  type: StatusType
  status: StatusValue
  className?: string
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let colorClass: string
  let label: string

  switch (type) {
    case "client":
      colorClass = getClientStatusColor(status as ClientStatus)
      label = getClientStatusLabel(status as ClientStatus)
      break
    case "contract":
      colorClass = getContractStatusColor(status as ContractStatus)
      label = getContractStatusLabel(status as ContractStatus)
      break
    case "invoice":
      colorClass = getInvoiceStatusColor(status as InvoiceStatus)
      label = getInvoiceStatusLabel(status as InvoiceStatus)
      break
    case "payment":
      colorClass = getPaymentStatusColor(status as PaymentStatus)
      label = getPaymentStatusLabel(status as PaymentStatus)
      break
    default:
      colorClass = "text-gray-500 bg-gray-500/10"
      label = status
  }

  return (
    <Badge variant="outline" className={cn("border font-medium", colorClass, className)}>
      {label}
    </Badge>
  )
}
