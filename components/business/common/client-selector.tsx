"use client"

// ===== Searchable Client Selector =====

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getClients } from "@/lib/api/business/clients"
import type { Client } from "@/lib/types/business"

interface ClientSelectorProps {
  value?: string
  onValueChange: (value: string, client?: Client) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ClientSelector({
  value,
  onValueChange,
  placeholder = "Seleccionar cliente...",
  disabled = false,
  className,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadClients() {
      setIsLoading(true)
      try {
        const response = await getClients(0, 100, "ACTIVE")
        setClients(response.content)
      } catch (error) {
        console.error("Failed to load clients:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadClients()
  }, [])

  const selectedClient = clients.find((c) => c.id === value)

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
          {selectedClient ? (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {selectedClient.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Cargando..." : "No se encontraron clientes."}</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onValueChange(client.id, client)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === client.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    {client.rnc && <span className="text-xs text-muted-foreground">RNC: {client.rnc}</span>}
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
