"use client"

// ===== Searchable Service Selector =====

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getServices } from "@/lib/api/business/services"
import type { ServiceCatalog } from "@/lib/types/business"

interface ServiceSelectorProps {
  value?: string
  onValueChange: (value: string, service?: ServiceCatalog) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ServiceSelector({
  value,
  onValueChange,
  placeholder = "Seleccionar servicio...",
  disabled = false,
  className,
}: ServiceSelectorProps) {
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadServices() {
      setIsLoading(true)
      try {
        const data = await getServices(true)
        setServices(data)
      } catch (error) {
        console.error("Failed to load services:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadServices()
  }, [])

  const selectedService = services.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {selectedService ? (
            <span className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              {selectedService.code} - {selectedService.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar servicio..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Cargando..." : "No se encontraron servicios."}</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  key={service.id}
                  value={`${service.code} ${service.name}`}
                  onSelect={() => {
                    onValueChange(service.id, service)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === service.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{service.code}</span>
                      {service.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{service.billingUnitName}</span>
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
