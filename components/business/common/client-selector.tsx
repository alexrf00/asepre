"use client"

// ===== Searchable Client Selector =====

import { useEffect, useState } from "react"
import { Building2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getClients } from "@/lib/api/business/clients"
import type { Client } from "@/lib/types/business"

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
    { [K in Keys]-?: Required<Pick<T, K>> & Partial<Omit<T, K>> }[Keys]

type ClientSelectorProps = {
  value?: string
  placeholder?: string
  disabled?: boolean
  className?: string
} & RequireAtLeastOne<
  {
    onValueChange?: (value: string, client?: Client) => void
    onChange?: (value: string) => void
  },
  "onValueChange" | "onChange"
>

export function ClientSelector(props: ClientSelectorProps) {
  const {
    value,
    placeholder = "Seleccionar cliente...",
    disabled = false,
    className,
    onValueChange,
    onChange,
  } = props

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

  const emitChange = (client: Client) => {
    onValueChange?.(client.id, client)
    onChange?.(client.id)
  }

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
                    emitChange(client)
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
