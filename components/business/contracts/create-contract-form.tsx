"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ContractLinesEditor } from "./contract-lines-editor"
import { getActiveClients } from "@/lib/api/clients"
import { createContract } from "@/lib/api/contracts"
import type {
  Client,
  CreateContractRequest,
  CreateContractLineRequest,
  BillingIntervalUnit,
  AgreementType,
} from "@/types/business"

// Form schema with flexible billing system
const contractFormSchema = z
  .object({
    clientId: z.string().min(1, "Client is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    agreementType: z.enum(["WRITTEN", "VERBAL"]).default("WRITTEN"),
    terms: z.string().optional(),
    notes: z.string().optional(),
    billingIntervalUnit: z.enum(["DAY", "WEEK", "MONTH", "YEAR"]).default("MONTH"),
    billingIntervalCount: z.number().min(1, "Must be at least 1").default(1),
    billingDayOfMonth: z.number().min(1).max(31).optional(),
    autoInvoicingEnabled: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate)
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )

type ContractFormData = z.infer<typeof contractFormSchema>

interface ContractLineItem extends CreateContractLineRequest {
  id: string
  serviceName?: string
  billingUnitName?: string
  resolvedPrice?: number
  lineTotal?: number
}

interface CreateContractFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateContractForm({ onSuccess, onCancel }: CreateContractFormProps) {
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lines, setLines] = useState<ContractLineItem[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientId: "",
      startDate: "",
      endDate: "",
      agreementType: "WRITTEN",
      terms: "",
      notes: "",
      billingIntervalUnit: "MONTH",
      billingIntervalCount: 1,
      autoInvoicingEnabled: false,
    },
  })

  const clientId = watch("clientId")
  const agreementType = watch("agreementType")
  const billingIntervalUnit = watch("billingIntervalUnit")

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await getActiveClients()
        if (response.success && response.data) {
          setClients(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const validateStep = async (currentStep: number): Promise<boolean> => {
    if (currentStep === 1) {
      return await trigger(["clientId", "startDate", "endDate", "agreementType"])
    }
    if (currentStep === 2) {
      return await trigger(["billingIntervalUnit", "billingIntervalCount", "billingDayOfMonth"])
    }
    return true
  }

  const nextStep = async () => {
    const valid = await validateStep(step)
    if (valid && step < 3) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onSubmit = async (data: ContractFormData) => {
    if (lines.length === 0) {
      toast.error("At least one service line is required")
      return
    }

    // Validate all lines have required fields
    const invalidLines = lines.filter((line) => !line.serviceId || !line.billingUnitId || !line.quantity)
    if (invalidLines.length > 0) {
      toast.error("All service lines must have service, quantity, and billing unit")
      return
    }

    setIsSubmitting(true)
    try {
      const contractData: CreateContractRequest = {
        clientId: data.clientId,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        terms: data.terms || undefined,
        notes: data.notes || undefined,
        billingIntervalUnit: data.billingIntervalUnit,
        billingIntervalCount: data.billingIntervalCount,
        billingDayOfMonth: data.billingDayOfMonth,
        agreementType: data.agreementType,
        autoInvoicingEnabled: data.autoInvoicingEnabled,
        lines: lines.map((line) => ({
          serviceId: line.serviceId,
          quantity: line.quantity,
          billingUnitId: line.billingUnitId,
          manualUnitPrice: line.manualUnitPrice,
          itbisApplicable: line.itbisApplicable,
          scheduleNotes: line.scheduleNotes,
        })),
      }

      const response = await createContract(contractData)
      if (response.success) {
        toast.success("Contract created successfully")
        onSuccess()
      } else {
        toast.error(response.message || "Failed to create contract")
      }
    } catch {
      toast.error("Failed to create contract")
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Basic Info" },
    { number: 2, title: "Billing" },
    { number: 3, title: "Services" },
  ]

  // Show billing day only for MONTH/YEAR intervals
  const showBillingDay = billingIntervalUnit === "MONTH" || billingIntervalUnit === "YEAR"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 px-4">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step > s.number
                  ? "bg-primary text-primary-foreground"
                  : step === s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.number ? <Check className="h-4 w-4" /> : s.number}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${step >= s.number ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s.title}
            </span>
            {index < steps.length - 1 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <ScrollArea className="flex-1 px-1">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Details</CardTitle>
                <CardDescription>Enter the basic contract information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  {loadingClients ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading clients...</span>
                    </div>
                  ) : (
                    <Select value={clientId} onValueChange={(value) => setValue("clientId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input type="date" id="startDate" {...register("startDate")} />
                    {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input type="date" id="endDate" {...register("endDate")} />
                    <p className="text-xs text-muted-foreground">Optional - leave empty for open-ended contracts</p>
                    {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Agreement Type *</Label>
                  <RadioGroup
                    value={agreementType}
                    onValueChange={(value) => setValue("agreementType", value as AgreementType)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="WRITTEN" id="written" />
                      <Label htmlFor="written" className="font-normal">
                        Written
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="VERBAL" id="verbal" />
                      <Label htmlFor="verbal" className="font-normal">
                        Verbal
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {agreementType === "WRITTEN"
                      ? "Written agreements require an uploaded document to activate"
                      : "Verbal agreements can be activated without a document"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Terms</Label>
                  <Textarea id="terms" placeholder="Contract terms and conditions..." rows={3} {...register("terms")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional notes..." rows={2} {...register("notes")} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Billing Configuration */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Configuration</CardTitle>
                <CardDescription>Set up billing frequency and options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingIntervalUnit">Billing Interval Unit</Label>
                    <Select
                      value={billingIntervalUnit}
                      onValueChange={(value) => setValue("billingIntervalUnit", value as BillingIntervalUnit)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAY">Day(s)</SelectItem>
                        <SelectItem value="WEEK">Week(s)</SelectItem>
                        <SelectItem value="MONTH">Month(s)</SelectItem>
                        <SelectItem value="YEAR">Year(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingIntervalCount">Interval Count</Label>
                    <Input
                      type="number"
                      id="billingIntervalCount"
                      min={1}
                      placeholder="e.g., 1, 3, 6"
                      {...register("billingIntervalCount", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      e.g., 1 Month = Monthly, 3 Months = Quarterly, 6 Months = Semi-annually
                    </p>
                    {errors.billingIntervalCount && (
                      <p className="text-sm text-destructive">{errors.billingIntervalCount.message}</p>
                    )}
                  </div>
                </div>

                {showBillingDay && (
                  <div className="space-y-2">
                    <Label htmlFor="billingDayOfMonth">Billing Day of Month</Label>
                    <Input
                      type="number"
                      id="billingDayOfMonth"
                      min={1}
                      max={28}
                      placeholder="1-31"
                      {...register("billingDayOfMonth", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">Day of month to generate invoices (1-31)</p>
                    {errors.billingDayOfMonth && (
                      <p className="text-sm text-destructive">{errors.billingDayOfMonth.message}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="autoInvoicingEnabled"
                    checked={watch("autoInvoicingEnabled")}
                    onCheckedChange={(checked) => setValue("autoInvoicingEnabled", checked === true)}
                  />
                  <Label htmlFor="autoInvoicingEnabled" className="font-normal">
                    Enable automatic invoicing
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, invoices will be automatically generated based on the billing schedule
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Contract Lines (Services) */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Lines</CardTitle>
                <CardDescription>Add services to this contract (at least one required)</CardDescription>
              </CardHeader>
              <CardContent>
                {!clientId ? (
                  <p className="text-muted-foreground text-center py-4">Please select a client first to add services</p>
                ) : (
                  <ContractLinesEditor clientId={clientId} lines={lines} onChange={setLines} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </ScrollArea>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-2 pt-4 border-t mt-4">
        <div>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contract
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
