"use client"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/formatters"

interface MoneyDisplayProps {
  amount: number
  currency?: string
  className?: string
  showSign?: boolean
}

export function MoneyDisplay({ amount, currency = "DOP", className, showSign = false }: MoneyDisplayProps) {
  const isNegative = amount < 0
  const displayAmount = Math.abs(amount)
  const formatted = formatCurrency(displayAmount, currency)

  return (
    <span className={cn("tabular-nums", isNegative && "text-destructive", className)}>
      {isNegative ? `(${formatted})` : showSign && amount > 0 ? `+${formatted}` : formatted}
    </span>
  )
}
