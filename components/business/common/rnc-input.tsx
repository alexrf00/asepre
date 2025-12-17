"use client"

import type React from "react"

// ===== RNC Input Component with Validation =====

import { forwardRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { validateRNC, formatRNC } from "@/lib/utils/business"

interface RNCInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string
  onChange?: (value: string) => void
  showValidation?: boolean
}

export const RNCInput = forwardRef<HTMLInputElement, RNCInputProps>(
  ({ value = "", onChange, showValidation = true, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")
    const [isValid, setIsValid] = useState(true)

    useEffect(() => {
      if (value) {
        setDisplayValue(formatRNC(value))
        setIsValid(validateRNC(value))
      } else {
        setDisplayValue("")
        setIsValid(true)
      }
    }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const rawValue = e.target.value.replace(/[^\d-]/g, "")
      setDisplayValue(rawValue)

      // Clean for API
      const cleaned = rawValue.replace(/-/g, "")
      onChange?.(cleaned)

      if (cleaned.length > 0) {
        setIsValid(validateRNC(cleaned))
      } else {
        setIsValid(true)
      }
    }

    function handleBlur() {
      if (displayValue) {
        const cleaned = displayValue.replace(/-/g, "")
        setDisplayValue(formatRNC(cleaned))
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="000-00000-0"
        className={cn(
          "font-mono",
          showValidation && !isValid && displayValue.length > 0 && "border-red-500 focus-visible:ring-red-500",
          className,
        )}
        {...props}
      />
    )
  },
)

RNCInput.displayName = "RNCInput"
