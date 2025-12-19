"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { voidReceipt } from "@/lib/api/receipts"
import type { Receipt } from "@/types/business"

const formSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
})

type FormValues = z.infer<typeof formSchema>

interface VoidReceiptDialogProps {
  receipt: Receipt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function VoidReceiptDialog({ receipt, open, onOpenChange, onSuccess }: VoidReceiptDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  })

  const handleSubmit = async (values: FormValues) => {
    if (!receipt) return

    setIsSubmitting(true)
    try {
      const result = await voidReceipt(receipt.id, values.reason)
      if (result.success) {
        toast.success("Receipt voided successfully")
        form.reset()
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to void receipt")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void Receipt</DialogTitle>
          <DialogDescription>
            This will mark receipt {receipt?.receiptNumber} as void. This action cannot be undone. Note: Voiding a
            receipt does NOT reverse the payment allocation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Why is this receipt being voided?"
              rows={3}
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Void Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
