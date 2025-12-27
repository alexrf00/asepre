"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { addDays, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClientSelector } from "@/components/business/common/client-selector"
import { InvoiceLinesEditor, type InvoiceLineInput } from "./invoice-lines-editor"
import { createInvoice } from "@/lib/api/invoices"
import type { CreateInvoiceRequest } from "@/types/business"

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateInvoiceFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateInvoiceForm({ onSuccess, onCancel }: CreateInvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lines, setLines] = useState<InvoiceLineInput[]>([])

  const today = format(new Date(), "yyyy-MM-dd")
  const defaultDueDate = format(addDays(new Date(), 30), "yyyy-MM-dd")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      issueDate: today,
      dueDate: defaultDueDate,
      notes: "",
    },
  })

  const clientId = watch("clientId")

  const onSubmit = async (data: FormData) => {
    if (lines.length === 0) {
      toast.error("At least one invoice line is required")
      return
    }

    // Validate all lines
    const invalidLines = lines.filter((line) => !line.serviceId || !line.billingUnitId || !line.quantity)
    if (invalidLines.length > 0) {
      toast.error("All lines must have service, quantity, and billing unit")
      return
    }

    setIsSubmitting(true)
    try {
      const request: CreateInvoiceRequest = {
        clientId: data.clientId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
        lines: lines.map((line) => ({
          serviceId: line.serviceId,
          description: line.description,
          quantity: line.quantity,
          billingUnitId: line.billingUnitId,
          unitPrice: line.unitPrice,
          itbisApplicable: line.itbisApplicable,
        })),
      }

      const result = await createInvoice(request)
      if (result.success) {
        toast.success("Invoice created as draft")
        onSuccess()
      } else {
        toast.error(result.error || "Failed to create invoice")
      }
    } catch {
      toast.error("An error occurred while creating the invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate totals
  const subtotal = lines.reduce((sum, line) => sum + (line.lineSubtotal || 0), 0)
  const itbisTotal = lines.reduce((sum, line) => sum + (line.itbisAmount || 0), 0)
  const total = subtotal + itbisTotal

  return (
    <ScrollArea className="h-full pr-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label>Client *</Label>
          <ClientSelector value={clientId} onChange={(value) => setValue("clientId", value || "")} />
          {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input type="date" id="issueDate" {...register("issueDate")} />
            {errors.issueDate && <p className="text-sm text-destructive">{errors.issueDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input type="date" id="dueDate" {...register("dueDate")} />
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Optional notes for this invoice..." rows={2} {...register("notes")} />
        </div>

        {/* Invoice Lines */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Invoice Lines</CardTitle>
          </CardHeader>
          <CardContent>
            {!clientId ? (
              <p className="text-muted-foreground text-center py-4">Select a client to add invoice lines</p>
            ) : (
              <InvoiceLinesEditor clientId={clientId} lines={lines} onChange={setLines} />
            )}
          </CardContent>
        </Card>

        {/* Totals Summary */}
        {lines.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">
                    {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ITBIS (18%)</span>
                  <span className="font-mono">
                    {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(itbisTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-medium border-t pt-2">
                  <span>Total</span>
                  <span className="font-mono">
                    {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Draft Invoice
          </Button>
        </div>
      </form>
    </ScrollArea>
  )
}