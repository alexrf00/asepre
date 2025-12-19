"use client"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import type { Client } from "@/types/business"

interface DeleteClientDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export function DeleteClientDialog({ client, open, onOpenChange, onConfirm, isLoading }: DeleteClientDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Client"
      description={
        <span>
          Are you sure you want to delete <strong>{client?.name}</strong>? This action cannot be undone and will remove
          all associated data including contracts, invoices, and payment history.
        </span>
      }
      confirmText="Delete"
      onConfirm={onConfirm}
      variant="destructive"
      isLoading={isLoading}
    />
  )
}
