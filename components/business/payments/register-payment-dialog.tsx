"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { paymentSchema, type PaymentFormData } from "@/lib/validations/business"
import type { Invoice } from "@/lib/types/business"
import { CurrencyInput } from "../common/currency-input"
import { MoneyDisplay } from "../common/money-display"
import { formatDateDO } from "@/lib/utils/business"

interface RegisterPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSubmit: (data: PaymentFormData) => Promise<void>
}

export function RegisterPaymentDialog({ open, onOpenChange, invoice, onSubmit }: RegisterPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: invoice?.id || "",
      amount: invoice?.balanceDue || 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "transfer",
      reference: "",
      notes: "",
    },
  })

  const watchAmount = form.watch("amount")

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true)
    try {
      await onSubmit({ ...data, invoiceId: invoice?.id || "" })
      form.reset()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  })

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>Registre un pago para la factura {invoice.ncf || invoice.invoiceNumber}</DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{invoice.client?.companyName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vencimiento:</span>
            <span>{formatDateDO(invoice.dueDate)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Factura:</span>
            <MoneyDisplay amount={invoice.total} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pagado:</span>
            <MoneyDisplay amount={invoice.total - invoice.balanceDue} />
          </div>
          <div className="flex justify-between font-medium">
            <span>Pendiente:</span>
            <MoneyDisplay amount={invoice.balanceDue} className="text-amber-600" />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto a Pagar *</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    {watchAmount < invoice.balanceDue
                      ? `Pago parcial. Quedará pendiente: RD$ ${(invoice.balanceDue - watchAmount).toLocaleString("es-DO")}`
                      : watchAmount === invoice.balanceDue
                        ? "Pago total"
                        : "El monto excede el balance pendiente"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Pago *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Número de transferencia, cheque, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Notas adicionales..." rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || watchAmount > invoice.balanceDue}>
                {isLoading ? "Registrando..." : "Registrar Pago"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
