"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { addDays, format } from "date-fns"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClientSelector } from "@/components/business/common/client-selector"
import { generateFromContract } from "@/lib/api/invoices"
import { getActiveContractsByClient } from "@/lib/api/contracts"
import { formatCurrency } from "@/lib/utils/formatters"
import type { Contract } from "@/types/business"

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  contractId: z.string().min(1, "Contract is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  periodDescription: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface GenerateFromContractFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function GenerateFromContractForm({ onSuccess, onCancel }: GenerateFromContractFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

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
      contractId: "",
      issueDate: today,
      dueDate: defaultDueDate,
      periodDescription: "",
    },
  })

  const clientId = watch("clientId")
  const contractId = watch("contractId")

  // Fetch contracts for selected client
  const { data: contractsRes, isLoading: loadingContracts } = useSWR(
    clientId ? `active-contracts-${clientId}` : null,
    () => getActiveContractsByClient(clientId),
  )

  const contracts = contractsRes?.data ?? []

  // Update selected contract when contractId changes
  useEffect(() => {
    if (contractId) {
      const contract = contracts.find((c) => c.id === contractId)
      setSelectedContract(contract || null)
    } else {
      setSelectedContract(null)
    }
  }, [contractId, contracts])

  // Reset contract when client changes
  useEffect(() => {
    setValue("contractId", "")
    setSelectedContract(null)
  }, [clientId, setValue])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await generateFromContract(data.contractId, {
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        periodDescription: data.periodDescription || undefined,
      })

      if (result.success) {
        toast.success("Invoice generated from contract")
        onSuccess()
      } else {
        toast.error(result.error || "Failed to generate invoice")
      }
    } catch {
      toast.error("An error occurred while generating the invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate contract total
  const contractTotal = selectedContract?.lines.reduce((sum, line) => sum + line.lineTotal, 0) ?? 0

  return (
    <ScrollArea className="h-full pr-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label>Client *</Label>
          <ClientSelector value={clientId} onChange={(value) => setValue("clientId", value || "")} />
          {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
        </div>

        {/* Contract Selection */}
        <div className="space-y-2">
          <Label>Contract *</Label>
          {!clientId ? (
            <p className="text-sm text-muted-foreground">Select a client first</p>
          ) : loadingContracts ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading contracts...
            </div>
          ) : contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active contracts for this client</p>
          ) : (
            <Select value={contractId} onValueChange={(value) => setValue("contractId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.contractNumber} ({contract.billingFrequency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.contractId && <p className="text-sm text-destructive">{errors.contractId.message}</p>}
        </div>

        {/* Contract Preview */}
        {selectedContract && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Contract Lines Preview</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedContract.lines
                      .filter((line) => line.active)
                      .map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.serviceName}</p>
                              <p className="text-xs text-muted-foreground">{line.serviceCode}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {line.quantity} {line.billingUnitCode}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(line.unitPrice, line.currency)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(line.lineTotal, line.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Contract Total (before ITBIS)</p>
                  <p className="text-xl font-bold font-mono">{formatCurrency(contractTotal, "DOP")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Period Description */}
        <div className="space-y-2">
          <Label htmlFor="periodDescription">Period Description</Label>
          <Input
            id="periodDescription"
            placeholder="e.g., Services for January 2024"
            {...register("periodDescription")}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedContract}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Invoice
          </Button>
        </div>
      </form>
    </ScrollArea>
  )
}
