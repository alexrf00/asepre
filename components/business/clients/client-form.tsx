"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getLegalTypes } from "@/lib/api/clients"
import type { Client, ClientStatus, CreateClientRequest, LegalType, UpdateClientRequest } from "@/types/business"

// RNC validation regex (Dominican tax ID: 9 digits for businesses, 11 for individuals)
const rncRegex = /^(\d{9}|\d{11})$/

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  legalName: z.string().max(255, "Legal name must be less than 255 characters").optional().or(z.literal("")),
  legalTypeId: z.string().min(1, "Legal type is required"),
  rnc: z.string().optional().or(z.literal("")),
  primaryEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  secondaryEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  primaryPhone: z.string().max(20).optional().or(z.literal("")),
  secondaryPhone: z.string().max(20).optional().or(z.literal("")),
  contactPerson: z.string().max(255).optional().or(z.literal("")),
  billingAddressLine1: z.string().max(255).optional().or(z.literal("")),
  billingAddressLine2: z.string().max(255).optional().or(z.literal("")),
  billingCity: z.string().max(100).optional().or(z.literal("")),
  billingProvince: z.string().max(100).optional().or(z.literal("")),
  billingPostalCode: z.string().max(20).optional().or(z.literal("")),
  serviceAddressLine1: z.string().max(255).optional().or(z.literal("")),
  serviceAddressLine2: z.string().max(255).optional().or(z.literal("")),
  serviceCity: z.string().max(100).optional().or(z.literal("")),
  serviceProvince: z.string().max(100).optional().or(z.literal("")),
  servicePostalCode: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
})

type ClientFormData = z.infer<typeof clientFormSchema>

interface ClientFormProps {
  client?: Client
  onSubmit: (data: CreateClientRequest | UpdateClientRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [legalTypes, setLegalTypes] = useState<LegalType[]>([])
  const [loadingLegalTypes, setLoadingLegalTypes] = useState(true)
  const [sameAsBilling, setSameAsBilling] = useState(false)
  const [selectedLegalType, setSelectedLegalType] = useState<LegalType | null>(null)

  const isEditing = !!client

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client
      ? {
          name: client.name,
          legalName: client.legalName || "",
          legalTypeId: "", // Will be set after legal types load
          rnc: client.rnc || "",
          primaryEmail: client.primaryEmail || "",
          secondaryEmail: client.secondaryEmail || "",
          primaryPhone: client.primaryPhone || "",
          secondaryPhone: client.secondaryPhone || "",
          contactPerson: client.contactPerson || "",
          billingAddressLine1: client.billingAddressLine1 || "",
          billingAddressLine2: client.billingAddressLine2 || "",
          billingCity: client.billingCity || "",
          billingProvince: client.billingProvince || "",
          billingPostalCode: client.billingPostalCode || "",
          serviceAddressLine1: client.serviceAddressLine1 || "",
          serviceAddressLine2: client.serviceAddressLine2 || "",
          serviceCity: client.serviceCity || "",
          serviceProvince: client.serviceProvince || "",
          servicePostalCode: client.servicePostalCode || "",
          notes: client.notes || "",
          status: client.status,
        }
      : {
          name: "",
          legalName: "",
          legalTypeId: "",
          rnc: "",
          primaryEmail: "",
          secondaryEmail: "",
          primaryPhone: "",
          secondaryPhone: "",
          contactPerson: "",
          billingAddressLine1: "",
          billingAddressLine2: "",
          billingCity: "",
          billingProvince: "",
          billingPostalCode: "",
          serviceAddressLine1: "",
          serviceAddressLine2: "",
          serviceCity: "",
          serviceProvince: "",
          servicePostalCode: "",
          notes: "",
        },
  })

  // Fetch legal types
  useEffect(() => {
    const fetchLegalTypes = async () => {
      try {
        const response = await getLegalTypes()
        if (response.success && response.data) {
          const activeLegalTypes = response.data.filter((lt) => lt.active)
          setLegalTypes(activeLegalTypes)

          // If editing, find and set the legal type ID based on code
          if (client) {
            const matchingType = activeLegalTypes.find((lt) => lt.code === client.legalTypeCode)
            if (matchingType) {
              setValue("legalTypeId", matchingType.id)
              setSelectedLegalType(matchingType)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch legal types:", error)
      } finally {
        setLoadingLegalTypes(false)
      }
    }

    fetchLegalTypes()
  }, [client, setValue])

  // Watch billing address fields to sync with service address
  const billingFields = watch([
    "billingAddressLine1",
    "billingAddressLine2",
    "billingCity",
    "billingProvince",
    "billingPostalCode",
  ])

  // Watch RNC for validation
  const rnc = watch("rnc")
  const legalTypeId = watch("legalTypeId")

  // Update selected legal type when legalTypeId changes
  useEffect(() => {
    if (legalTypeId) {
      const type = legalTypes.find((lt) => lt.id === legalTypeId)
      setSelectedLegalType(type || null)
    }
  }, [legalTypeId, legalTypes])

  // Validate RNC based on legal type
  useEffect(() => {
    if (selectedLegalType?.requiresRnc) {
      if (!rnc || rnc.trim() === "") {
        setError("rnc", { type: "manual", message: "RNC is required for this legal type" })
      } else if (!rncRegex.test(rnc)) {
        setError("rnc", { type: "manual", message: "RNC must be 9 or 11 digits" })
      } else {
        clearErrors("rnc")
      }
    } else {
      if (rnc && rnc.trim() !== "" && !rncRegex.test(rnc)) {
        setError("rnc", { type: "manual", message: "RNC must be 9 or 11 digits" })
      } else {
        clearErrors("rnc")
      }
    }
  }, [rnc, selectedLegalType, setError, clearErrors])

  // Sync service address with billing when checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      setValue("serviceAddressLine1", billingFields[0] || "")
      setValue("serviceAddressLine2", billingFields[1] || "")
      setValue("serviceCity", billingFields[2] || "")
      setValue("serviceProvince", billingFields[3] || "")
      setValue("servicePostalCode", billingFields[4] || "")
    }
  }, [sameAsBilling, billingFields, setValue])

  const handleFormSubmit = async (data: ClientFormData) => {
    // Additional RNC validation
    if (selectedLegalType?.requiresRnc && (!data.rnc || data.rnc.trim() === "")) {
      setError("rnc", { type: "manual", message: "RNC is required for this legal type" })
      return
    }

    const submitData: CreateClientRequest | UpdateClientRequest = {
      name: data.name,
      legalName: data.legalName || undefined,
      legalTypeId: data.legalTypeId,
      rnc: data.rnc || undefined,
      primaryEmail: data.primaryEmail || undefined,
      secondaryEmail: data.secondaryEmail || undefined,
      primaryPhone: data.primaryPhone || undefined,
      secondaryPhone: data.secondaryPhone || undefined,
      contactPerson: data.contactPerson || undefined,
      billingAddressLine1: data.billingAddressLine1 || undefined,
      billingAddressLine2: data.billingAddressLine2 || undefined,
      billingCity: data.billingCity || undefined,
      billingProvince: data.billingProvince || undefined,
      billingPostalCode: data.billingPostalCode || undefined,
      serviceAddressLine1: data.serviceAddressLine1 || undefined,
      serviceAddressLine2: data.serviceAddressLine2 || undefined,
      serviceCity: data.serviceCity || undefined,
      serviceProvince: data.serviceProvince || undefined,
      servicePostalCode: data.servicePostalCode || undefined,
      notes: data.notes || undefined,
    }

    if (isEditing && data.status) {
      ;(submitData as UpdateClientRequest).status = data.status as ClientStatus
    }

    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-1">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Client name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input id="legalName" placeholder="Legal business name" {...register("legalName")} />
              {errors.legalName && <p className="text-sm text-destructive">{errors.legalName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalTypeId">Legal Type *</Label>
              {loadingLegalTypes ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading legal types...</span>
                </div>
              ) : (
                <Select value={watch("legalTypeId")} onValueChange={(value) => setValue("legalTypeId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select legal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {legalTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.legalTypeId && <p className="text-sm text-destructive">{errors.legalTypeId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rnc">
                RNC (Tax ID) {selectedLegalType?.requiresRnc && <span className="text-destructive">*</span>}
              </Label>
              <Input id="rnc" placeholder="9 or 11 digits" maxLength={11} {...register("rnc")} />
              {errors.rnc && <p className="text-sm text-destructive">{errors.rnc.message}</p>}
              <p className="text-xs text-muted-foreground">
                Dominican RNC: 9 digits for businesses, 11 for individuals
              </p>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={watch("status")} onValueChange={(value) => setValue("status", value as ClientStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes about the client..." rows={4} {...register("notes")} />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
            </div>
          </TabsContent>

          {/* Contact Info Tab */}
          <TabsContent value="contact" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input id="contactPerson" placeholder="Primary contact name" {...register("contactPerson")} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryEmail">Primary Email</Label>
                <Input id="primaryEmail" type="email" placeholder="email@example.com" {...register("primaryEmail")} />
                {errors.primaryEmail && <p className="text-sm text-destructive">{errors.primaryEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryEmail">Secondary Email</Label>
                <Input
                  id="secondaryEmail"
                  type="email"
                  placeholder="alternate@example.com"
                  {...register("secondaryEmail")}
                />
                {errors.secondaryEmail && <p className="text-sm text-destructive">{errors.secondaryEmail.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryPhone">Primary Phone</Label>
                <Input id="primaryPhone" type="tel" placeholder="809-555-1234" {...register("primaryPhone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                <Input id="secondaryPhone" type="tel" placeholder="809-555-5678" {...register("secondaryPhone")} />
              </div>
            </div>
          </TabsContent>

          {/* Billing Address Tab */}
          <TabsContent value="billing" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="billingAddressLine1">Address Line 1</Label>
              <Input id="billingAddressLine1" placeholder="Street address" {...register("billingAddressLine1")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAddressLine2">Address Line 2</Label>
              <Input
                id="billingAddressLine2"
                placeholder="Apartment, suite, etc."
                {...register("billingAddressLine2")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingCity">City</Label>
                <Input id="billingCity" placeholder="City" {...register("billingCity")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingProvince">Province</Label>
                <Input id="billingProvince" placeholder="Province" {...register("billingProvince")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingPostalCode">Postal Code</Label>
              <Input id="billingPostalCode" placeholder="Postal code" {...register("billingPostalCode")} />
            </div>
          </TabsContent>

          {/* Service Address Tab */}
          <TabsContent value="service" className="space-y-4 mt-0">
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="sameAsBilling"
                checked={sameAsBilling}
                onCheckedChange={(checked) => setSameAsBilling(checked === true)}
              />
              <Label htmlFor="sameAsBilling" className="text-sm font-normal cursor-pointer">
                Same as billing address
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAddressLine1">Address Line 1</Label>
              <Input
                id="serviceAddressLine1"
                placeholder="Street address"
                disabled={sameAsBilling}
                {...register("serviceAddressLine1")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAddressLine2">Address Line 2</Label>
              <Input
                id="serviceAddressLine2"
                placeholder="Apartment, suite, etc."
                disabled={sameAsBilling}
                {...register("serviceAddressLine2")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceCity">City</Label>
                <Input id="serviceCity" placeholder="City" disabled={sameAsBilling} {...register("serviceCity")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceProvince">Province</Label>
                <Input
                  id="serviceProvince"
                  placeholder="Province"
                  disabled={sameAsBilling}
                  {...register("serviceProvince")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicePostalCode">Postal Code</Label>
              <Input
                id="servicePostalCode"
                placeholder="Postal code"
                disabled={sameAsBilling}
                {...register("servicePostalCode")}
              />
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || loadingLegalTypes}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Client" : "Create Client"}
        </Button>
      </div>
    </form>
  )
}
