"use client"

// ===== Create Client Dialog =====

import { useState } from "react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientForm } from "./client-form"
import { createClient } from "@/lib/api/business/clients"
import type { CreateClientFormData } from "@/lib/validations/business"

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: CreateClientFormData) {
    setIsLoading(true)
    try {
      const response = await createClient(data)
      if (response.success) {
        toast.success("Cliente creado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.message || "Error al crear cliente")
      }
    } catch {
      toast.error("Error al crear cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>Complete la información del nuevo cliente</DialogDescription>
        </DialogHeader>
        <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
}
