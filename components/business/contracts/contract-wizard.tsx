"use client"

import { useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { createContractSchema, type CreateContractFormData } from "@/lib/validations/business"
import type { BillingFrequency } from "@/lib/types/business"

import { ClientSelector } from "@/components/business/common/client-selector"
import { ServiceSelector } from "@/components/business/common/service-selector"
import { CurrencyInput } from "@/components/business/common/currency-input"
import { MoneyDisplay } from "@/components/business/common/money-display"

interface ContractWizardProps {
  onSubmit: (data: CreateContractFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const BILLING_FREQUENCIES: { value: BillingFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "ANNUALLY", label: "Anual" },
  { value: "ONE_TIME", label: "Una vez" },
]

export function ContractWizard({ onSubmit, onCancel, isLoading }: ContractWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      clientId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      billingFrequency: "MONTHLY",
      billingDayOfMonth: 1,
      terms: "",
      notes: "",
      lines: [
        {
          serviceId: "",
          quantity: 1,
          billingUnitId: undefined,
          manualUnitPrice: 0,
          itbisApplicable: true,
          scheduleNotes: "",
        },
      ],
    },
    mode: "onChange",
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  const watchLines = form.watch("lines")
  const watchBillingFrequency = form.watch("billingFrequency")

  const totals = useMemo(() => {
    const subtotal = (watchLines ?? []).reduce((sum, l) => {
      const qty = Number(l.quantity || 0)
      const price = Number(l.manualUnitPrice ?? 0)
      return sum + qty * price
    }, 0)

    const itbis = (watchLines ?? []).reduce((sum, l) => {
      if (!l.itbisApplicable) return sum
      const qty = Number(l.quantity || 0)
      const price = Number(l.manualUnitPrice ?? 0)
      return sum + qty * price * 0.18
    }, 0)

    return { subtotal, itbis, total: subtotal + itbis }
  }, [watchLines])

  async function nextStep() {
    // Step validation gates
    if (currentStep === 1) {
      const ok = await form.trigger(["clientId", "startDate", "billingFrequency", "billingDayOfMonth"])
      if (!ok) return
    }
    if (currentStep === 2) {
      const ok = await form.trigger(["lines"])
      if (!ok) return
    }
    setCurrentStep((s) => Math.min(3, s + 1))
  }

  function prevStep() {
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  function addLine() {
    append({
      serviceId: "",
      quantity: 1,
      billingUnitId: undefined,
      manualUnitPrice: 0,
      itbisApplicable: true,
      scheduleNotes: "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center justify-between">
        <div className={cn("text-sm", currentStep === 1 ? "font-semibold" : "text-muted-foreground")}>
          1. Datos
        </div>
        <div className={cn("text-sm", currentStep === 2 ? "font-semibold" : "text-muted-foreground")}>
          2. Líneas
        </div>
        <div className={cn("text-sm", currentStep === 3 ? "font-semibold" : "text-muted-foreground")}>
          3. Confirmar
        </div>
      </div>

      <Separator />

      <form
        onSubmit={form.handleSubmit(async (data) => {
          await onSubmit(data)
        })}
        className="space-y-6"
      >
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-4">
<ClientSelector
  value={form.watch("clientId")}
  onValueChange={(clientId) => {
    form.setValue("clientId", clientId, { shouldValidate: true })
  }}
/>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha inicio</label>
                <Input type="date" {...form.register("startDate")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha fin (opcional)</label>
                <Input type="date" {...form.register("endDate")} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frecuencia de facturación</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.watch("billingFrequency")}
                  onChange={(e) => form.setValue("billingFrequency", e.target.value as BillingFrequency, { shouldValidate: true })}
                >
                  {BILLING_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {watchBillingFrequency !== "ONE_TIME" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Día del mes (si aplica)</label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={form.watch("billingDayOfMonth") ?? 1}
                    onChange={(e) => form.setValue("billingDayOfMonth", Number(e.target.value), { shouldValidate: true })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Términos (opcional)</label>
              <Textarea rows={3} {...form.register("terms")} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea rows={3} {...form.register("notes")} />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Servicios</h3>
              <Button type="button" variant="outline" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar línea
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => {
                const line = watchLines?.[idx]
                return (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Línea #{idx + 1}</div>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" onClick={() => remove(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

<ServiceSelector
  value={line?.serviceId ?? ""}
  onValueChange={(serviceId, service) => {
                        // Keep whatever your ServiceSelector provides; set safe defaults
                        update(idx, {
                          ...line,
                          serviceId,
                          billingUnitId: service?.billingUnitId ?? line?.billingUnitId,
                          itbisApplicable: service?.itbisApplicable ?? (line?.itbisApplicable ?? true),
                        } as any)
                      }}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cantidad</label>
                        <Input
                          type="number"
                          min={1}
                          value={line?.quantity ?? 1}
                          onChange={(e) => {
                            const quantity = Math.max(1, Number(e.target.value || 1))
                            update(idx, { ...line, quantity } as any)
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Precio unitario (manual)</label>
                        <CurrencyInput
                          value={Number(line?.manualUnitPrice ?? 0)}
                          onChange={(value) => update(idx, { ...line, manualUnitPrice: value } as any)}
                        />
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(line?.itbisApplicable)}
                            onCheckedChange={(checked) => update(idx, { ...line, itbisApplicable: checked } as any)}
                          />
                          <span className="text-sm">ITBIS</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notas de horario (opcional)</label>
                      <Input
                        value={line?.scheduleNotes ?? ""}
                        onChange={(e) => update(idx, { ...line, scheduleNotes: e.target.value } as any)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="h-5 w-5" />
              Resumen
            </h3>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <MoneyDisplay amount={totals.subtotal} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ITBIS (18%)</span>
                <MoneyDisplay amount={totals.itbis} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <MoneyDisplay amount={totals.total} />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            )}

            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear contrato"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
