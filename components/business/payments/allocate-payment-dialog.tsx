"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import useSWR from "swr"
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
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { allocatePayment } from "@/lib/api/payments"
import { getUnpaidInvoicesByClient } from "@/lib/api/invoices"
import { formatCurrency } from "@/lib/utils/formatters"
import type { Payment } from "@/types/business"

const allocationSchema = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  invoiceBalance: z.number(),
  amount: z.number().min(0),
  selected: z.boolean(),
})

const formSchema = z.object({
  allocations: z.array(allocationSchema),
})

type FormValues = z.infer<typeof formSchema>

interface AllocatePaymentDialogProps {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AllocatePaymentDialog({ payment, open, onOpenChange, onSuccess }: AllocatePaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: unpaidInvoicesRes, isLoading } = useSWR(
    payment && open ? `unpaid-invoices-allocate-${payment.clientId}` : null,
    () => getUnpaidInvoicesByClient(payment!.clientId),
  )

  const unpaidInvoices = unpaidInvoicesRes?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      allocations: [],
    },
  })

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "allocations",
  })

  const watchAllocations = form.watch("allocations")

  useEffect(() => {
    if (unpaidInvoices.length > 0 && open) {
      replace(
        unpaidInvoices.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceBalance: inv.balance,
          amount: 0,
          selected: false,
        })),
      )
    }
  }, [unpaidInvoices, open, replace])

  const totalAllocated = watchAllocations.filter((a) => a.selected).reduce((sum, a) => sum + (a.amount || 0), 0)

  const maxAllocatable = payment?.amountUnallocated ?? 0
  const isOverAllocated = totalAllocated > maxAllocatable

  const handleAllocationSelect = (index: number, checked: boolean) => {
    const current = form.getValues(`allocations.${index}`)
    form.setValue(`allocations.${index}.selected`, checked)
    if (checked && current.amount === 0) {
      const remaining = maxAllocatable - totalAllocated
      const autoAmount = Math.min(current.invoiceBalance, remaining)
      form.setValue(`allocations.${index}.amount`, Math.max(0, autoAmount))
    }
  }

  const handleSubmit = async (values: FormValues) => {
    if (!payment) return

    const allocations = values.allocations
      .filter((a) => a.selected && a.amount > 0)
      .map((a) => ({ invoiceId: a.invoiceId, amount: a.amount }))

    if (allocations.length === 0) {
      toast.error("Select at least one invoice to allocate")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await allocatePayment(payment.id, { allocations })
      if (result.success) {
        toast.success("Payment allocated successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to allocate payment")
      }
    } catch {
      toast.error("An error occurred while allocating payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Payment</DialogTitle>
          <DialogDescription>
            Allocate {payment ? formatCurrency(payment.amountUnallocated, payment.currency) : ""} to unpaid invoices
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No unpaid invoices for this client</p>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Allocate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Checkbox
                          checked={watchAllocations[index]?.selected || false}
                          onCheckedChange={(checked) => handleAllocationSelect(index, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{field.invoiceNumber}</TableCell>
                      <TableCell className="text-right">{formatCurrency(field.invoiceBalance, "DOP")}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={field.invoiceBalance}
                          className="w-28 text-right ml-auto"
                          disabled={!watchAllocations[index]?.selected}
                          {...form.register(`allocations.${index}.amount`, { valueAsNumber: true })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available to Allocate:</span>
                <span className="font-medium">{formatCurrency(maxAllocatable, "DOP")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Allocated:</span>
                <span className={`font-medium ${isOverAllocated ? "text-destructive" : ""}`}>
                  {formatCurrency(totalAllocated, "DOP")}
                </span>
              </div>
              {isOverAllocated && <p className="text-destructive text-sm">Total exceeds available amount</p>}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isOverAllocated || totalAllocated === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Allocate
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
