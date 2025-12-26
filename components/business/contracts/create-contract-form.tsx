"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ChevronRight, ChevronLeft, Check, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContractLinesEditor } from "./contract-lines-editor"
import { getActiveClients } from "@/lib/api/clients"
import { createContract } from "@/lib/api/contracts"
import type {
  Client,
  CreateContractRequest,
  CreateContractLineRequest,
  BillingIntervalUnit,
  AgreementType,
  TermType,
  BillingType,
  InvoiceTiming,
  ProrationPolicy,
} from "@/types/business"

// Form schema with enhanced billing configuration per Enterprise B2B spec
const contractFormSchema = z
  .object({
    // Step 1: Client & Basic Info
    clientId: z.string().min(1, "Client is required"),
    agreementType: z.enum(["WRITTEN", "VERBAL"]),
    notes: z.string().optional(),

    // Step 2: Contract Term
    termType: z.enum(["EVERGREEN", "FIXED_TERM", "AUTO_RENEW"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),

    // Step 3: Billing Configuration
    billingType: z.enum(["RECURRING", "ONE_TIME"]),
    billingIntervalUnit: z.enum(["DAY", "WEEK", "MONTH", "YEAR"]),
    billingIntervalCount: z.number().min(1, "Must be at least 1"),
    billingDayOfMonth: z.number().min(1).max(31).optional(),
    autoInvoicingEnabled: z.boolean(),
    invoiceTiming: z.enum(["ADVANCE", "ARREARS"]),
    prorationPolicy: z.enum(["PRORATED", "FULL_PERIOD", "NO_CHARGE"]),

    // Legacy fields
    terms: z.string().optional(),
  })
  .refine(
    (data) => {
      // End date required for FIXED_TERM and AUTO_RENEW
      if ((data.termType === "FIXED_TERM" || data.termType === "AUTO_RENEW") && !data.endDate) {
        return false
      }
      return true
    },
    {
      message: "End date is required for fixed-term and auto-renew contracts",
      path: ["endDate"],
    }
  )
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
    }
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
      agreementType: "WRITTEN",
      notes: "",
      termType: "EVERGREEN",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      billingType: "RECURRING",
      billingIntervalUnit: "MONTH",
      billingIntervalCount: 1,
      autoInvoicingEnabled: true,
      invoiceTiming: "ADVANCE",
      prorationPolicy: "PRORATED",
      terms: "",
    },
  })

  const clientId = watch("clientId")
  const agreementType = watch("agreementType")
  const termType = watch("termType")
  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const billingType = watch("billingType")
  const billingIntervalUnit = watch("billingIntervalUnit")
  const billingIntervalCount = watch("billingIntervalCount")
  const billingDayOfMonth = watch("billingDayOfMonth")
  const invoiceTiming = watch("invoiceTiming")
  const autoInvoicingEnabled = watch("autoInvoicingEnabled")

  // Selected client details
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === clientId)
  }, [clients, clientId])

  // Billing interval display text
  const billingIntervalDisplay = useMemo(() => {
    const count = billingIntervalCount || 1
    const unitLabel = {
      DAY: count === 1 ? "day" : "days",
      WEEK: count === 1 ? "week" : "weeks",
      MONTH: count === 1 ? "month" : "months",
      YEAR: count === 1 ? "year" : "years",
    }
    return `Every ${count} ${unitLabel[billingIntervalUnit]}`
  }, [billingIntervalUnit, billingIntervalCount])

  // Compute billing preview dates
  const billingPreview = useMemo(() => {
    if (!startDate || billingType === "ONE_TIME") return null

    const start = new Date(startDate)
    const dates: Date[] = []
    let current = new Date(start)

    // Calculate anchor day for monthly/yearly billing
    const anchorDay = billingDayOfMonth || start.getDate()

    // Adjust to anchor day for MONTH/YEAR
    if (billingIntervalUnit === "MONTH" || billingIntervalUnit === "YEAR") {
      const targetDay = Math.min(anchorDay, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate())
      current = new Date(current.getFullYear(), current.getMonth(), targetDay)
      if (current < start) {
        current = billingIntervalUnit === "YEAR" ? addYears(current, 1) : addMonths(current, 1)
        const newTargetDay = Math.min(anchorDay, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate())
        current = new Date(current.getFullYear(), current.getMonth(), newTargetDay)
      }
    }

    // For ARREARS billing, add one period
    if (invoiceTiming === "ARREARS") {
      switch (billingIntervalUnit) {
        case "DAY": current = addDays(current, billingIntervalCount); break
        case "WEEK": current = addWeeks(current, billingIntervalCount); break
        case "MONTH": current = addMonths(current, billingIntervalCount); break
        case "YEAR": current = addYears(current, billingIntervalCount); break
      }
    }

    // Generate first 3 invoice dates
    for (let i = 0; i < 3; i++) {
      if (endDate && current > new Date(endDate)) break
      dates.push(new Date(current))
      switch (billingIntervalUnit) {
        case "DAY": current = addDays(current, billingIntervalCount); break
        case "WEEK": current = addWeeks(current, billingIntervalCount); break
        case "MONTH": current = addMonths(current, billingIntervalCount); break
        case "YEAR": current = addYears(current, billingIntervalCount); break
      }
    }

    return { dates, firstInvoiceDate: dates[0] }
  }, [startDate, endDate, billingType, billingIntervalUnit, billingIntervalCount, billingDayOfMonth, invoiceTiming])

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
    switch (currentStep) {
      case 1:
        return await trigger(["clientId", "agreementType"])
      case 2:
        return await trigger(["termType", "startDate", "endDate"])
      case 3:
        return await trigger(["billingType", "billingIntervalUnit", "billingIntervalCount", "invoiceTiming", "prorationPolicy"])
      case 4:
        if (lines.length === 0) {
          toast.error("At least one service line is required")
          return false
        }
        const invalidLines = lines.filter((line) => !line.serviceId || !line.billingUnitId || !line.quantity)
        if (invalidLines.length > 0) {
          toast.error("All service lines must have service, quantity, and billing unit")
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = async () => {
    const valid = await validateStep(step)
    if (valid && step < 5) {
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
        // Enhanced billing configuration fields
        termType: data.termType,
        billingType: data.billingType,
        invoiceTiming: data.invoiceTiming,
        prorationPolicy: data.prorationPolicy,
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
    { number: 1, title: "Client & Basic Info" },
    { number: 2, title: "Contract Term" },
    { number: 3, title: "Billing" },
    { number: 4, title: "Services" },
    { number: 5, title: "Review" },
  ]

  // Show billing day only for MONTH/YEAR intervals
  const showBillingDay = billingIntervalUnit === "MONTH" || billingIntervalUnit === "YEAR"

  // Calculate monthly total from lines
  const monthlyTotal = useMemo(() => {
    return lines.reduce((sum, line) => sum + (line.lineTotal || 0), 0)
  }, [lines])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
      {/* Step Indicator - Compact for narrow sheets */}
      <div className="flex items-center justify-center gap-1 mb-4 px-2 flex-shrink-0">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                step > s.number
                  ? "bg-primary text-primary-foreground"
                  : step === s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.number ? <Check className="h-3 w-3" /> : s.number}
            </div>
            {index < steps.length - 1 && <ChevronRight className="mx-1 h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>
      {/* Current step title */}
      <div className="text-center mb-4 flex-shrink-0">
        <span className="text-sm font-medium">{steps[step - 1]?.title}</span>
        <span className="text-sm text-muted-foreground"> (Step {step} of {steps.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {/* Step 1: Client & Basic Info */}
        {step === 1 && (
          <div className="space-y-4 pb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Client Selection</CardTitle>
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
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {client.primaryEmail || client.rnc || "No contact info"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
                </div>

                {/* Selected Client Summary */}
                {selectedClient && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 space-y-1">
                      <p className="font-medium">{selectedClient.name}</p>
                      {selectedClient.primaryEmail && (
                        <p className="text-sm text-muted-foreground">{selectedClient.primaryEmail}</p>
                      )}
                      {selectedClient.rnc && (
                        <p className="text-sm text-muted-foreground">RNC: {selectedClient.rnc}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Agreement Type *</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setValue("agreementType", "WRITTEN")}
                      onKeyDown={(e) => e.key === "Enter" && setValue("agreementType", "WRITTEN")}
                      className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${agreementType === "WRITTEN" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <div className={`mt-1 aspect-square size-4 shrink-0 rounded-full border shadow-xs ${agreementType === "WRITTEN" ? "border-primary bg-primary" : "border-input"}`}>
                        {agreementType === "WRITTEN" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Written</span>
                        <p className="text-xs text-muted-foreground">Requires uploaded document</p>
                      </div>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setValue("agreementType", "VERBAL")}
                      onKeyDown={(e) => e.key === "Enter" && setValue("agreementType", "VERBAL")}
                      className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${agreementType === "VERBAL" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <div className={`mt-1 aspect-square size-4 shrink-0 rounded-full border shadow-xs ${agreementType === "VERBAL" ? "border-primary bg-primary" : "border-input"}`}>
                        {agreementType === "VERBAL" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Verbal</span>
                        <p className="text-xs text-muted-foreground">No document required</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" placeholder="Additional notes..." rows={2} {...register("notes")} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Contract Term */}
        {step === 2 && (
          <div className="space-y-4 pb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Term Type *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue("termType", "EVERGREEN")}
                    onKeyDown={(e) => e.key === "Enter" && setValue("termType", "EVERGREEN")}
                    className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${termType === "EVERGREEN" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className={`aspect-square size-4 shrink-0 rounded-full border shadow-xs ${termType === "EVERGREEN" ? "border-primary bg-primary" : "border-input"}`}>
                      {termType === "EVERGREEN" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">Evergreen</span>
                      <span className="text-xs text-muted-foreground ml-2">No end date</span>
                    </div>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue("termType", "FIXED_TERM")}
                    onKeyDown={(e) => e.key === "Enter" && setValue("termType", "FIXED_TERM")}
                    className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${termType === "FIXED_TERM" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className={`aspect-square size-4 shrink-0 rounded-full border shadow-xs ${termType === "FIXED_TERM" ? "border-primary bg-primary" : "border-input"}`}>
                      {termType === "FIXED_TERM" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">Fixed-Term</span>
                      <span className="text-xs text-muted-foreground ml-2">Expires on end date</span>
                    </div>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue("termType", "AUTO_RENEW")}
                    onKeyDown={(e) => e.key === "Enter" && setValue("termType", "AUTO_RENEW")}
                    className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${termType === "AUTO_RENEW" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className={`aspect-square size-4 shrink-0 rounded-full border shadow-xs ${termType === "AUTO_RENEW" ? "border-primary bg-primary" : "border-input"}`}>
                      {termType === "AUTO_RENEW" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">Auto-Renew</span>
                      <span className="text-xs text-muted-foreground ml-2">Renews unless cancelled</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contract Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-sm">Start Date *</Label>
                    <Input type="date" id="startDate" {...register("startDate")} />
                    {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-sm">End Date {termType !== "EVERGREEN" && "*"}</Label>
                    <Input type="date" id="endDate" {...register("endDate")} disabled={termType === "EVERGREEN"} />
                    {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Billing Configuration */}
        {step === 3 && (
          <div className="space-y-4 pb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Billing Type *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Billing Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue("billingType", "RECURRING")}
                    onKeyDown={(e) => e.key === "Enter" && setValue("billingType", "RECURRING")}
                    className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${billingType === "RECURRING" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className={`aspect-square size-4 shrink-0 rounded-full border shadow-xs ${billingType === "RECURRING" ? "border-primary bg-primary" : "border-input"}`}>
                      {billingType === "RECURRING" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                    </div>
                    <span className="font-medium text-sm">Recurring</span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue("billingType", "ONE_TIME")}
                    onKeyDown={(e) => e.key === "Enter" && setValue("billingType", "ONE_TIME")}
                    className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${billingType === "ONE_TIME" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className={`aspect-square size-4 shrink-0 rounded-full border shadow-xs ${billingType === "ONE_TIME" ? "border-primary bg-primary" : "border-input"}`}>
                      {billingType === "ONE_TIME" && <div className="w-full h-full flex items-center justify-center"><div className="size-2 rounded-full bg-primary-foreground" /></div>}
                    </div>
                    <span className="font-medium text-sm">One-Time</span>
                  </div>
                </div>

                {/* Recurring billing options */}
                {billingType === "RECURRING" && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-sm">Invoice every *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          className="w-16"
                          {...register("billingIntervalCount", { valueAsNumber: true })}
                        />
                        <Select
                          value={billingIntervalUnit}
                          onValueChange={(value) => setValue("billingIntervalUnit", value as BillingIntervalUnit)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DAY">Day(s)</SelectItem>
                            <SelectItem value="WEEK">Week(s)</SelectItem>
                            <SelectItem value="MONTH">Month(s)</SelectItem>
                            <SelectItem value="YEAR">Year(s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {showBillingDay && (
                      <div className="space-y-1">
                        <Label className="text-sm">Anchor Day</Label>
                        <Select
                          value={billingDayOfMonth?.toString() || ""}
                          onValueChange={(value) => setValue("billingDayOfMonth", value ? parseInt(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day === 1 ? "1st" : day === 2 ? "2nd" : day === 3 ? "3rd" : `${day}th`}
                              </SelectItem>
                            ))}
                            <SelectItem value="31">Last day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="autoInvoicingEnabled"
                        checked={autoInvoicingEnabled}
                        onCheckedChange={(checked) => setValue("autoInvoicingEnabled", checked === true)}
                      />
                      <Label htmlFor="autoInvoicingEnabled" className="text-sm font-normal">Auto-generate invoices</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Timing</Label>
                        <Select
                          value={invoiceTiming}
                          onValueChange={(value) => setValue("invoiceTiming", value as InvoiceTiming)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADVANCE">Advance</SelectItem>
                            <SelectItem value="ARREARS">Arrears</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Proration</Label>
                        <Select
                          value={watch("prorationPolicy")}
                          onValueChange={(value) => setValue("prorationPolicy", value as ProrationPolicy)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRORATED">Prorated</SelectItem>
                            <SelectItem value="FULL_PERIOD">Full period</SelectItem>
                            <SelectItem value="NO_CHARGE">No charge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Preview */}
                {billingType === "RECURRING" && billingPreview && billingPreview.dates.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      First invoice: {format(billingPreview.dates[0], "MMM d, yyyy")}
                    </p>
                    {billingPreview.dates.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Then: {billingPreview.dates.slice(1).map((d) => format(d, "MMM d")).join(", ")}...
                      </p>
                    )}
                  </div>
                )}

                {billingType === "ONE_TIME" && (
                  <p className="text-xs text-muted-foreground">Single invoice on activation</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Services & Pricing */}
        {step === 4 && (
          <div className="space-y-4 pb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Services & Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                {!clientId ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Select a client first</p>
                ) : (
                  <ContractLinesEditor clientId={clientId} lines={lines} onChange={setLines} />
                )}
              </CardContent>
            </Card>

            {lines.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium">{billingType === "RECURRING" ? "Monthly:" : "Total:"}</span>
                <span className="font-bold">DOP {monthlyTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review & Create */}
        {step === 5 && (
          <div className="space-y-3 pb-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Client</CardTitle>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep(1)}>Edit</Button>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedClient && (
                  <p className="text-sm font-medium">{selectedClient.name}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Term</CardTitle>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep(2)}>Edit</Button>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                <p>{termType} · {agreementType} · {startDate && format(new Date(startDate), "MMM d, yyyy")}{endDate && ` → ${format(new Date(endDate), "MMM d, yyyy")}`}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Billing</CardTitle>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep(3)}>Edit</Button>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                {billingType === "RECURRING" ? (
                  <p>{billingIntervalDisplay} · {invoiceTiming} · {autoInvoicingEnabled ? "Auto" : "Manual"}</p>
                ) : (
                  <p>One-time invoice</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Services ({lines.length})</CardTitle>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep(4)}>Edit</Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {lines.slice(0, 3).map((line) => (
                    <div key={line.id} className="flex justify-between text-xs">
                      <span className="truncate flex-1 mr-2">{line.serviceName} ({line.quantity}x)</span>
                      <span>DOP {(line.lineTotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {lines.length > 3 && <p className="text-xs text-muted-foreground">+{lines.length - 3} more...</p>}
                  <div className="border-t pt-1 mt-1 flex justify-between text-sm font-medium">
                    <span>Total:</span>
                    <span>DOP {monthlyTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {agreementType === "WRITTEN" && (
              <p className="text-xs text-amber-600">⚠ Requires document upload to activate</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-2 pt-4 border-t mt-2 flex-shrink-0">
        <div>
          {step > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={prevStep}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {step < 5 ? (
            <Button type="button" size="sm" onClick={nextStep}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}