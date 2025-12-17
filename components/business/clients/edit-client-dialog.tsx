"use client"

// ===== Edit Client Dialog =====

import { useState } from "react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientForm } from "./client-form"
import { updateClient } from "@/lib/api/business/clients"
import type { Client } from "@/lib/types/business"
import type { CreateClientFormData } from "@/lib/validations/business"

interface EditClientDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditClientDialog({ client, open, onOpenChange, onSuccess }: EditClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: CreateClientFormData) {
    if (!client) return

    setIsLoading(true)
    try {
      const response = await updateClient(client.id, data)
      if (response.success) {
        toast.success("Cliente actualizado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.message || "Error al actualizar cliente")
      }
    } catch {
      toast.error("Error al actualizar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Modifique la información del cliente</DialogDescription>
        </DialogHeader>
        {client && <ClientForm client={client} onSubmit={handleSubmit} isLoading={isLoading} />}
      </DialogContent>
    </Dialog>
  )
}
