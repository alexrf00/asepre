"use client"

import { TableCell } from "@/components/ui/table"

import { TableBody } from "@/components/ui/table"

import { TableHead } from "@/components/ui/table"

import { TableRow } from "@/components/ui/table"

import { TableHeader } from "@/components/ui/table"

import { Table } from "@/components/ui/table"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { contractSchema, type ContractFormData } from "@/lib/validations/business"
import { ClientSelector } from "../common/client-selector"
import { ServiceSelector } from "../common/service-selector"
import { CurrencyInput } from "../common/currency-input"
import { MoneyDisplay } from "../common/money-display"
import { calculateITBIS, calculateSubtotal, calculateTotal } from "@/lib/utils/business"

interface ContractWizardProps {
  onSubmit: (data: ContractFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const steps = [
  { id: 1, name: "Cliente", description: "Seleccionar cliente" },
  { id: 2, name: "Servicios", description: "Agregar líneas de servicio" },
  { id: 3, name: "Términos", description: "Definir condiciones" },
  { id: 4, name: "Revisión", description: "Confirmar contrato" },
]

export function ContractWizard({ onSubmit, onCancel, isLoading }: ContractWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientId: "",
      contractType: "fixed",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      autoRenew: true,
      renewalNoticeDays: 30,
      billingDay: 1,
      paymentTermDays: 30,
      lines: [],
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  const watchLines = form.watch("lines")
  const subtotal = calculateSubtotal(watchLines.map((l) => ({ ...l, subtotal: l.quantity * l.unitPrice })))
  const itbis = calculateITBIS(
    watchLines.map((l) => ({
      ...l,
      subtotal: l.quantity * l.unitPrice,
      itbisAmount: l.applyItbis ? l.quantity * l.unitPrice * 0.18 : 0,
    })),
  )
  const total = calculateTotal(subtotal, itbis)

  const nextStep = async () => {
    let fieldsToValidate: (keyof ContractFormData)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["clientId"]
        break
      case 2:
        fieldsToValidate = ["lines"]
        break
      case 3:
        fieldsToValidate = ["startDate", "billingDay", "paymentTermDays"]
        break
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data)
  })

  const addServiceLine = () => {
    append({
      serviceId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      applyItbis: true,
    })
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <nav aria-label="Progreso">
        <ol className="flex items-center">
          {steps.map((step, index) => (
            <li key={step.id} className={cn("relative", index !== steps.length - 1 && "flex-1")}>
              <div className="flex items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium",
                    step.id < currentStep
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : step.id === currentStep
                        ? "border-emerald-600 text-emerald-600"
                        : "border-muted-foreground/25 text-muted-foreground",
                  )}
                >
                  {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
                </span>
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      "ml-4 h-0.5 w-full",
                      step.id < currentStep ? "bg-emerald-600" : "bg-muted-foreground/25",
                    )}
                  />
                )}
              </div>
              <div className="mt-2">
                <span className="text-sm font-medium">{step.name}</span>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <Form {...form}>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Client Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Cliente</CardTitle>
                <CardDescription>Seleccione el cliente para este contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <FormControl>
                        <ClientSelector value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Precio Fijo</SelectItem>
                          <SelectItem value="hourly">Por Hora</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Precio Fijo: tarifa mensual fija. Por Hora: facturación según horas trabajadas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Service Lines */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Líneas de Servicio</CardTitle>
                <CardDescription>Agregue los servicios incluidos en este contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Línea {index + 1}</h4>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.serviceId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Servicio *</FormLabel>
                            <FormControl>
                              <ServiceSelector value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Descripción adicional" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio Unitario *</FormLabel>
                            <FormControl>
                              <CurrencyInput value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`lines.${index}.applyItbis`}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Aplicar ITBIS (18%)</FormLabel>
                            <FormDescription>Incluir impuesto en esta línea</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="text-right text-sm">
                      <span className="text-muted-foreground">Subtotal: </span>
                      <MoneyDisplay amount={(watchLines[index]?.quantity || 0) * (watchLines[index]?.unitPrice || 0)} />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addServiceLine} className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Línea
                </Button>

                {fields.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-right">
                      <div className="flex justify-end gap-4">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <MoneyDisplay amount={subtotal} className="font-medium" />
                      </div>
                      <div className="flex justify-end gap-4">
                        <span className="text-muted-foreground">ITBIS (18%):</span>
                        <MoneyDisplay amount={itbis} className="font-medium" />
                      </div>
                      <div className="flex justify-end gap-4 text-lg">
                        <span className="font-semibold">Total Mensual:</span>
                        <MoneyDisplay amount={total} className="font-bold text-emerald-600" />
                      </div>
                    </div>
                  </>
                )}

                {form.formState.errors.lines && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lines.message || "Debe agregar al menos una línea de servicio"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Contract Terms */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Términos del Contrato</CardTitle>
                <CardDescription>Configure las condiciones de vigencia y facturación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Dejar vacío para contrato indefinido</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="autoRenew"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Renovación Automática</FormLabel>
                        <FormDescription>El contrato se renovará automáticamente al vencer</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("autoRenew") && (
                  <FormField
                    control={form.control}
                    name="renewalNoticeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días de Aviso para Renovación</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Días de anticipación para notificar sobre la renovación</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billingDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Día de Facturación *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={28}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Día del mes en que se genera la factura (1-28)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTermDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días de Crédito *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Días para pago después de emitida la factura</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Internas</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notas o comentarios sobre este contrato..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Revisión del Contrato</CardTitle>
                <CardDescription>Revise los detalles antes de crear el contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Información General</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Tipo de Contrato:</dt>
                        <dd className="font-medium">
                          {form.watch("contractType") === "fixed" ? "Precio Fijo" : "Por Hora"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Fecha de Inicio:</dt>
                        <dd className="font-medium">{form.watch("startDate")}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Fecha de Fin:</dt>
                        <dd className="font-medium">{form.watch("endDate") || "Indefinido"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Renovación Automática:</dt>
                        <dd className="font-medium">{form.watch("autoRenew") ? "Sí" : "No"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Facturación</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Día de Facturación:</dt>
                        <dd className="font-medium">{form.watch("billingDay")}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Días de Crédito:</dt>
                        <dd className="font-medium">{form.watch("paymentTermDays")}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Líneas de Servicio ({fields.length})</h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">ITBIS</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {watchLines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell>{line.description || `Servicio ${index + 1}`}</TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">
                              <MoneyDisplay amount={line.unitPrice} />
                            </TableCell>
                            <TableCell className="text-right">{line.applyItbis ? "18%" : "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <MoneyDisplay amount={line.quantity * line.unitPrice} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <MoneyDisplay amount={subtotal} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ITBIS (18%):</span>
                      <MoneyDisplay amount={itbis} />
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Mensual:</span>
                      <MoneyDisplay amount={total} className="text-emerald-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              )}
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear Contrato"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
