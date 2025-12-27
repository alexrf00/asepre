"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Zap, Calendar, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { getActiveClients } from "@/lib/api/clients"
import { getActiveServices, getBillingUnits } from "@/lib/api/services"
import { resolvePrice } from "@/lib/api/pricing"
import { createSubscription } from "@/lib/api/subscriptions"
import type { Client, ServiceCatalog, BillingUnit, ChargeType, BillingFrequency } from "@/types/business"

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  serviceId: z.string().min(1, "Service is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  billingUnitId: z.string().min(1, "Billing unit is required"),
  manualUnitPrice: z.number().optional(),
  useManualPrice: z.boolean(),
  itbisApplicable: z.boolean(),
  chargeType: z.enum(["RECURRING", "ONE_TIME", "SETUP"]),
  billingFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  scheduleNotes: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface QuickServiceAssignmentProps {
  /** Pre-selected client ID (e.g., from client detail page) */
  preSelectedClientId?: string
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Quick Service Assignment Form
 * 
 * Allows assigning services to clients without creating a formal contract.
 * This is ideal for:
 * - Walk-in clients
 * - One-time services
 * - Quick recurring subscriptions
 * - Testing/demo scenarios
 */
export function QuickServiceAssignment({ preSelectedClientId, onSuccess, onCancel }: QuickServiceAssignmentProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [billingUnits, setBillingUnits] = useState<BillingUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resolvedPrice, setResolvedPrice] = useState<number | null>(null)
  const [priceSource, setPriceSource] = useState<string>("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: preSelectedClientId || "",
      serviceId: "",
      quantity: 1,
      billingUnitId: "",
      useManualPrice: false,
      itbisApplicable: true,
      chargeType: "RECURRING",
      billingFrequency: "MONTHLY",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      scheduleNotes: "",
      notes: "",
    },
  })

  const clientId = watch("clientId")
  const serviceId = watch("serviceId")
  const quantity = watch("quantity")
  const useManualPrice = watch("useManualPrice")
  const manualUnitPrice = watch("manualUnitPrice")
  const chargeType = watch("chargeType")

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [clientsResponse, servicesResponse, unitsResponse] = await Promise.all([
          getActiveClients(),
          getActiveServices(),
          getBillingUnits(),
        ])
        setClients(clientsResponse.data ?? [])
        setServices(servicesResponse.data ?? [])
        setBillingUnits(unitsResponse.data ?? [])
      } catch (error) {
        console.error("Failed to load data:", error)
        toast.error("Failed to load form data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Resolve price when client and service change
  useEffect(() => {
    async function loadPrice() {
      if (!clientId || !serviceId) {
        setResolvedPrice(null)
        setPriceSource("")
        return
      }

      try {
        const response = await resolvePrice(serviceId, clientId)
        if (response.data) {
          setResolvedPrice(response.data.price)
          setPriceSource(response.data.source === "CLIENT" ? "Client-specific" : "Global")
        }
      } catch (error) {
        console.error("Failed to resolve price:", error)
        setResolvedPrice(null)
        setPriceSource("")
      }
    }
    loadPrice()
  }, [clientId, serviceId])

  // Update billing unit when service changes
  useEffect(() => {
    if (serviceId) {
      const service = services.find((s) => s.id === serviceId)
      if (service) {
        setValue("billingUnitId", service.billingUnitId)
        setValue("itbisApplicable", service.itbisApplicable)
        if (service.defaultChargeType) {
          setValue("chargeType", service.defaultChargeType as ChargeType)
        }
      }
    }
  }, [serviceId, services, setValue])

  // Update billing frequency when charge type changes
  useEffect(() => {
    if (chargeType === "ONE_TIME" || chargeType === "SETUP") {
      setValue("billingFrequency", "ONE_TIME")
    }
  }, [chargeType, setValue])

  const selectedService = services.find((s) => s.id === serviceId)
  const selectedClient = clients.find((c) => c.id === clientId)
  const effectivePrice = useManualPrice ? (manualUnitPrice || 0) : (resolvedPrice || 0)
  const lineTotal = effectivePrice * (quantity || 1)

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await createSubscription({
        clientId: data.clientId,
        serviceId: data.serviceId,
        quantity: data.quantity,
        billingUnitId: data.billingUnitId,
        manualUnitPrice: data.useManualPrice ? data.manualUnitPrice : undefined,
        itbisApplicable: data.itbisApplicable,
        chargeType: data.chargeType,
        billingFrequency: data.billingFrequency,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        scheduleNotes: data.scheduleNotes || undefined,
        notes: data.notes || undefined,
      })

      toast.success("Service assigned successfully!")
      onSuccess()
    } catch (error: any) {
      console.error("Failed to create subscription:", error)
      toast.error(error.response?.data?.message || "Failed to assign service")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Quick Service Assignment</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Assign a service to a client without creating a formal contract. 
        Ideal for walk-in clients and one-time services.
      </p>

      <Separator />

      {/* Client Selection */}
      <div className="space-y-2">
        <Label htmlFor="clientId">Client *</Label>
        <Select
          value={clientId}
          onValueChange={(value) => setValue("clientId", value)}
          disabled={!!preSelectedClientId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.rnc && `(${client.rnc})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
      </div>

      {/* Service Selection */}
      <div className="space-y-2">
        <Label htmlFor="serviceId">Service *</Label>
        <Select
          value={serviceId}
          onValueChange={(value) => setValue("serviceId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} ({service.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId.message}</p>}
      </div>

      {/* Quantity and Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Quantity & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingUnitId">Billing Unit</Label>
              <Select
                value={watch("billingUnitId")}
                onValueChange={(value) => setValue("billingUnitId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {billingUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Display/Override */}
          <div className="space-y-3">
            {resolvedPrice !== null && !useManualPrice && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Resolved Price</p>
                  <p className="text-xs text-muted-foreground">{priceSource} pricing</p>
                </div>
                <p className="text-lg font-bold">DOP {resolvedPrice.toFixed(2)}</p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="useManualPrice"
                checked={useManualPrice}
                onCheckedChange={(checked) => setValue("useManualPrice", checked === true)}
              />
              <Label htmlFor="useManualPrice" className="text-sm font-normal">
                Override with manual price
              </Label>
            </div>

            {useManualPrice && (
              <div className="space-y-2">
                <Label htmlFor="manualUnitPrice">Manual Unit Price (DOP)</Label>
                <Input
                  id="manualUnitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("manualUnitPrice", { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Line Total Preview */}
          {effectivePrice > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Line Total:</span>
              <span className="text-lg font-bold">DOP {lineTotal.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charge Type and Billing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Billing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type *</Label>
              <Select
                value={chargeType}
                onValueChange={(value) => setValue("chargeType", value as ChargeType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECURRING">Recurring</SelectItem>
                  <SelectItem value="ONE_TIME">One-Time</SelectItem>
                  <SelectItem value="SETUP">Setup Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingFrequency">Billing Frequency</Label>
              <Select
                value={watch("billingFrequency")}
                onValueChange={(value) => setValue("billingFrequency", value as BillingFrequency)}
                disabled={chargeType !== "RECURRING"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                  <SelectItem value="ONE_TIME">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="itbisApplicable"
              checked={watch("itbisApplicable")}
              onCheckedChange={(checked) => setValue("itbisApplicable", checked === true)}
            />
            <Label htmlFor="itbisApplicable" className="text-sm font-normal">
              ITBIS (18%) applies to this service
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes about this service assignment..."
          {...register("notes")}
        />
      </div>

      {/* Summary */}
      {selectedClient && selectedService && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-sm text-muted-foreground">for {selectedClient.name}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{chargeType}</Badge>
                  {chargeType === "RECURRING" && (
                    <Badge variant="secondary">{watch("billingFrequency")}</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">DOP {lineTotal.toFixed(2)}</p>
                {chargeType === "RECURRING" && (
                  <p className="text-sm text-muted-foreground">per {watch("billingFrequency").toLowerCase()}</p>
                )}
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
          Assign Service
        </Button>
      </div>
    </form>
  )
}