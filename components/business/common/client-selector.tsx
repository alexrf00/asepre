"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getActiveClients } from "@/lib/api/clients"

interface ClientSelectorProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ClientSelector({
  value,
  onChange,
  disabled,
  placeholder = "Select client...",
  className,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useSWR("active-clients", async () => {
    const response = await getActiveClients()
    if (!response.success) throw new Error(response.error)
    return response.data
  })

  const clients = data ?? []
  const selectedClient = clients.find((c) => c.id === value)

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
          ) : selectedClient ? (
            <span className="truncate">
              {selectedClient.name}
              {selectedClient.rnc && <span className="text-muted-foreground ml-1">({selectedClient.rnc})</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.name} ${client.rnc}`}
                  onSelect={() => {
                    onChange(client.id === value ? undefined : client.id)
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
