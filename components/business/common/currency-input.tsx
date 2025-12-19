"use client"

import type React from "react"

import { forwardRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, disabled, className, placeholder = "0.00" }, ref) => {
    const formatForDisplay = useCallback((val: number | undefined): string => {
      if (val === undefined || isNaN(val)) return ""
      return val.toFixed(2)
    }, [])

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.]/g, "")

        // Handle empty input
        if (rawValue === "" || rawValue === ".") {
          onChange(undefined)
          return
        }

        // Ensure only one decimal point
        const parts = rawValue.split(".")
        if (parts.length > 2) return

        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) return

        const numValue = Number.parseFloat(rawValue)
        if (!isNaN(numValue)) {
          onChange(numValue)
        }
      },
      [onChange],
    )

    const handleBlur = useCallback(() => {
      // Format to 2 decimal places on blur
      if (value !== undefined && !isNaN(value)) {
        onChange(Math.round(value * 100) / 100)
      }
    }, [value, onChange])

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={formatForDisplay(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn("pl-7 text-right", className)}
          placeholder={placeholder}
        />
      </div>
    )
  },
)

CurrencyInput.displayName = "CurrencyInput"
