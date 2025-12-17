"use client"

import type React from "react"

// ===== Currency Input Component (DOP) =====

import { forwardRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number
  onChange?: (value: number) => void
  currency?: string
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currency = "RD$", className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")

    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatForDisplay(value))
      }
    }, [value])

    function formatForDisplay(num: number): string {
      return new Intl.NumberFormat("es-DO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }

    function parseFromDisplay(str: string): number {
      // Remove thousands separators and convert decimal separator
      const cleaned = str.replace(/[^\d,.-]/g, "").replace(",", ".")
      const parsed = Number.parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const rawValue = e.target.value
      setDisplayValue(rawValue)
    }

    function handleBlur() {
      const numValue = parseFromDisplay(displayValue)
      setDisplayValue(formatForDisplay(numValue))
      onChange?.(numValue)
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currency}</span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn("pl-12 text-right tabular-nums", className)}
          {...props}
        />
      </div>
    )
  },
)

CurrencyInput.displayName = "CurrencyInput"
