"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBillingUnits } from "@/lib/api/services"
import type { BillingUnit, CreateServiceRequest, ServiceCatalog, UpdateServiceRequest } from "@/types/business"

const serviceFormSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens, and underscores"),
  name: z.string().min(1, "Name is required").max(150, "Name must be less than 150 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")),
  billingUnitId: z.string().min(1, "Billing unit is required"),
  itbisApplicable: z.boolean(),
  active: z.boolean(),
})

type ServiceFormData = z.infer<typeof serviceFormSchema>

interface ServiceFormProps {
  service?: ServiceCatalog
  onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ServiceForm({ service, onSubmit, onCancel, isLoading = false }: ServiceFormProps) {
  const [billingUnits, setBillingUnits] = useState<BillingUnit[]>([])
  const [loadingBillingUnits, setLoadingBillingUnits] = useState(true)

  const isEditing = !!service

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: service
      ? {
          code: service.code,
          name: service.name,
          description: service.description || "",
          billingUnitId: service.billingUnitId,
          itbisApplicable: service.itbisApplicable,
          active: service.active,
        }
      : {
          code: "",
          name: "",
          description: "",
          billingUnitId: "",
          itbisApplicable: true,
          active: true,
        },
  })

  // Fetch billing units
  useEffect(() => {
    const fetchBillingUnits = async () => {
      try {
        const response = await getBillingUnits()
        if (response.success && response.data) {
          const activeUnits = response.data.filter((unit) => unit.active)
          setBillingUnits(activeUnits)
        }
      } catch (error) {
        console.error("Failed to fetch billing units:", error)
      } finally {
        setLoadingBillingUnits(false)
      }
    }

    fetchBillingUnits()
  }, [])

  // Auto-uppercase code as user types
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
    setValue("code", value)
  }

  const handleFormSubmit = async (data: ServiceFormData) => {
    if (isEditing) {
      const updateData: UpdateServiceRequest = {
        name: data.name,
        description: data.description || undefined,
        billingUnitId: data.billingUnitId,
        itbisApplicable: data.itbisApplicable,
        active: data.active,
      }
      await onSubmit(updateData)
    } else {
      const createData: CreateServiceRequest = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        billingUnitId: data.billingUnitId,
        itbisApplicable: data.itbisApplicable,
      }
      await onSubmit(createData)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code *</Label>
        <Input
          id="code"
          placeholder="SERVICE_CODE"
          value={watch("code")}
          onChange={handleCodeChange}
          disabled={isEditing}
          className="font-mono"
        />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        <p className="text-xs text-muted-foreground">
          Unique code for this service.{" "}
          {isEditing ? "Cannot be changed." : "Uppercase letters, numbers, hyphens, and underscores only."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" placeholder="Service name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the service..."
          rows={3}
          {...register("description")}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingUnitId">Billing Unit *</Label>
        {loadingBillingUnits ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading billing units...</span>
          </div>
        ) : (
          <Select value={watch("billingUnitId")} onValueChange={(value) => setValue("billingUnitId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select billing unit" />
            </SelectTrigger>
            <SelectContent>
              {billingUnits.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <span className="font-mono text-muted-foreground mr-2">{unit.code}</span>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.billingUnitId && <p className="text-sm text-destructive">{errors.billingUnitId.message}</p>}
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Checkbox
          id="itbisApplicable"
          checked={watch("itbisApplicable")}
          onCheckedChange={(checked) => setValue("itbisApplicable", checked === true)}
        />
        <div className="space-y-0.5">
          <Label htmlFor="itbisApplicable" className="cursor-pointer">
            ITBIS Applicable
          </Label>
          <p className="text-xs text-muted-foreground">Check if this service is subject to ITBIS (18% Dominican VAT)</p>
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="active">Active</Label>
            <p className="text-xs text-muted-foreground">Inactive services cannot be used in new contracts</p>
          </div>
          <Switch id="active" checked={watch("active")} onCheckedChange={(checked) => setValue("active", checked)} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || loadingBillingUnits}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  )
}