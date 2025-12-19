"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getActiveServices } from "@/lib/api/services"
import type { ServiceCatalog } from "@/types/business"

interface ServiceSelectorProps {
  value: string | undefined
  onChange: (value: string | undefined, service?: ServiceCatalog) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ServiceSelector({
  value,
  onChange,
  disabled,
  placeholder = "Select service...",
  className,
}: ServiceSelectorProps) {
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useSWR("active-services", async () => {
    const response = await getActiveServices()
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  const services = data ?? []
  const selectedService = services.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn("w-full justify-between font-normal", className)}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : selectedService ? (
            <span className="truncate">
              {selectedService.code} - {selectedService.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search services..." />
          <CommandList>
            <CommandEmpty>No service found.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  key={service.id}
                  value={`${service.code} ${service.name}`}
                  onSelect={() => {
                    onChange(service.id === value ? undefined : service.id, service.id === value ? undefined : service)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === service.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>
                      {service.code} - {service.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {service.billingUnitName}
                      {service.itbisApplicable && " • ITBIS"}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
