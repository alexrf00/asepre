// ===== Money Display Component =====

import { cn } from "@/lib/utils"
import { formatDOP, formatAmount } from "@/lib/utils/business"

interface MoneyDisplayProps {
  amount: number
  currency?: string
  showSymbol?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function MoneyDisplay({
  amount,
  currency = "DOP",
  showSymbol = true,
  className,
  size = "md",
}: MoneyDisplayProps) {
  const formatted = showSymbol ? formatDOP(amount) : formatAmount(amount)

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl font-bold",
  }

  return <span className={cn("tabular-nums", sizeClasses[size], className)}>{formatted}</span>
}
