"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getActiveClients } from "@/lib/api/clients"
import { getPaymentTypes, recordPayment } from "@/lib/api/payments"
import { getUnpaidInvoicesByClient } from "@/lib/api/invoices"
import { formatCurrency } from "@/lib/utils/formatters"

const allocationSchema = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  invoiceBalance: z.number(),
  amount: z.number().min(0),
  selected: z.boolean(),
})

const formSchema = z
  .object({
    clientId: z.string().min(1, "Client is required"),
    paymentTypeId: z.string().min(1, "Payment type is required"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    paymentDate: z.string().min(1, "Payment date is required"),
    reference: z.string().optional(),
    notes: z.string().optional(),
    generateReceipt: z.boolean(),
    allocations: z.array(allocationSchema),
  })
  .refine(
    (data) => {
      const totalAllocated = data.allocations.filter((a) => a.selected).reduce((sum, a) => sum + a.amount, 0)
      return totalAllocated <= data.amount
    },
    {
      message: "Total allocated cannot exceed payment amount",
      path: ["allocations"],
    },
  )

type FormValues = z.infer<typeof formSchema>

interface RecordPaymentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function RecordPaymentForm({ onSuccess, onCancel }: RecordPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  const { data: clientsRes } = useSWR("active-clients", () => getActiveClients())
  const { data: paymentTypesRes } = useSWR("payment-types-active", () => getPaymentTypes(true))
  const { data: unpaidInvoicesRes, isLoading: loadingInvoices } = useSWR(
    selectedClientId ? `unpaid-invoices-${selectedClientId}` : null,
    () => getUnpaidInvoicesByClient(selectedClientId),
  )

  const clients = clientsRes?.data ?? []
  const paymentTypes = paymentTypesRes?.data ?? []
  const unpaidInvoices = unpaidInvoicesRes?.data ?? []

  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      paymentTypeId: "",
      amount: 0,
      paymentDate: today,
      reference: "",
      notes: "",
      generateReceipt: true,
      allocations: [],
    },
  })

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "allocations",
  })

  const watchClientId = form.watch("clientId")
  const watchPaymentTypeId = form.watch("paymentTypeId")
  const watchAmount = form.watch("amount")
  const watchAllocations = form.watch("allocations")

  const selectedPaymentType = paymentTypes.find((pt) => pt.id === watchPaymentTypeId)

  // Update allocations when unpaid invoices change
  useEffect(() => {
    if (unpaidInvoices.length > 0) {
      replace(
        unpaidInvoices.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceBalance: inv.balance,
          amount: 0,
          selected: false,
        })),
      )
    } else {
      replace([])
    }
  }, [unpaidInvoices, replace])

  // Track selected client
  useEffect(() => {
    setSelectedClientId(watchClientId)
  }, [watchClientId])

  const totalAllocated = watchAllocations.filter((a) => a.selected).reduce((sum, a) => sum + (a.amount || 0), 0)

  const remainingToAllocate = (watchAmount || 0) - totalAllocated

  const handleAllocationSelect = (index: number, checked: boolean) => {
    const current = form.getValues(`allocations.${index}`)
    form.setValue(`allocations.${index}.selected`, checked)
    if (checked && current.amount === 0) {
      // Auto-fill with min of balance and remaining
      const autoAmount = Math.min(current.invoiceBalance, remainingToAllocate)
      form.setValue(`allocations.${index}.amount`, autoAmount)
    }
  }

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const allocations = values.allocations
        .filter((a) => a.selected && a.amount > 0)
        .map((a) => ({ invoiceId: a.invoiceId, amount: a.amount }))

      const result = await recordPayment({
        clientId: values.clientId,
        paymentTypeId: values.paymentTypeId,
        amount: values.amount,
        paymentDate: values.paymentDate,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
        allocations: allocations.length > 0 ? allocations : undefined,
        generateReceipt: values.generateReceipt,
      })

      if (result.success) {
        toast.success("Payment recorded successfully")
        onSuccess()
      } else {
        toast.error(result.error || "Failed to record payment")
      }
    } catch {
      toast.error("An error occurred while recording payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollArea className="h-full pr-4">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label htmlFor="clientId">Client *</Label>
          <Select value={form.watch("clientId")} onValueChange={(value) => form.setValue("clientId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.clientId && (
            <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
          )}
        </div>

        {/* Payment Type */}
        <div className="space-y-2">
          <Label htmlFor="paymentTypeId">Payment Type *</Label>
          <Select value={form.watch("paymentTypeId")} onValueChange={(value) => form.setValue("paymentTypeId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              {paymentTypes.map((pt) => (
                <SelectItem key={pt.id} value={pt.id}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.paymentTypeId && (
            <p className="text-sm text-destructive">{form.formState.errors.paymentTypeId.message}</p>
          )}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (DOP) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Date *</Label>
            <Input id="paymentDate" type="date" {...form.register("paymentDate")} />
            {form.formState.errors.paymentDate && (
              <p className="text-sm text-destructive">{form.formState.errors.paymentDate.message}</p>
            )}
          </div>
        </div>

        {/* Reference (conditionally required) */}
        <div className="space-y-2">
          <Label htmlFor="reference">Reference {selectedPaymentType?.requiresReference && "*"}</Label>
          <Input id="reference" placeholder="Transaction reference number" {...form.register("reference")} />
          {selectedPaymentType?.requiresReference && !form.watch("reference") && (
            <p className="text-sm text-amber-600">Reference is required for this payment type</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Optional notes..." rows={2} {...form.register("notes")} />
        </div>

        {/* Generate Receipt */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="generateReceipt"
            checked={form.watch("generateReceipt")}
            onCheckedChange={(checked) => form.setValue("generateReceipt", !!checked)}
          />
          <Label htmlFor="generateReceipt" className="font-normal">
            Generate receipt automatically
          </Label>
        </div>

        <Separator />

        {/* Invoice Allocations */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Allocate to Invoices</CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            {!watchClientId ? (
              <p className="text-sm text-muted-foreground">Select a client to see unpaid invoices</p>
            ) : loadingInvoices ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading invoices...
              </div>
            ) : fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unpaid invoices for this client</p>
            ) : (
              <>
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
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Allocated:</span>
                  <span className="font-medium">{formatCurrency(totalAllocated, "DOP")}</span>
                </div>
                {remainingToAllocate > 0 && totalAllocated > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Unallocated:</span>
                    <span className="font-medium text-amber-600">{formatCurrency(remainingToAllocate, "DOP")}</span>
                  </div>
                )}
                {form.formState.errors.allocations && (
                  <p className="text-sm text-destructive mt-2">{form.formState.errors.allocations.message}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || (selectedPaymentType?.requiresReference && !form.watch("reference"))}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </div>
      </form>
    </ScrollArea>
  )
}
