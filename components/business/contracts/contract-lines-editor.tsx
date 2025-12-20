"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getActiveServices, getBillingUnits } from "@/lib/api/services"
import { resolvePrice } from "@/lib/api/pricing"
import type { ServiceCatalog, BillingUnit, CreateContractLineRequest, PriceSource } from "@/types/business"

interface ContractLineItem extends CreateContractLineRequest {
  id: string
  serviceName?: string
  billingUnitName?: string
  resolvedPrice?: number
  priceSource?: PriceSource
  lineTotal?: number
}

interface ContractLinesEditorProps {
  clientId: string
  lines: ContractLineItem[]
  onChange: (lines: ContractLineItem[]) => void
  readOnly?: boolean
}

export function ContractLinesEditor({ clientId, lines, onChange, readOnly = false }: ContractLinesEditorProps) {
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [billingUnits, setBillingUnits] = useState<BillingUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingPrice, setResolvingPrice] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, unitsRes] = await Promise.all([getActiveServices(), getBillingUnits()])
        if (servicesRes.success && servicesRes.data) {
          setServices(servicesRes.data)
        }
        if (unitsRes.success && unitsRes.data) {
          setBillingUnits(unitsRes.data.filter((u) => u.active))
        }
      } catch (error) {
        console.error("Failed to fetch services/units:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const addLine = () => {
    const newLine: ContractLineItem = {
      id: crypto.randomUUID(),
      serviceId: "",
      quantity: 1,
      billingUnitId: "",
      itbisApplicable: true,
      scheduleNotes: "",
    }
    onChange([...lines, newLine])
  }

  const removeLine = (id: string) => {
    onChange(lines.filter((line) => line.id !== id))
  }

  const updateLine = async (id: string, field: keyof ContractLineItem, value: unknown) => {
    const updatedLines = lines.map((line) => {
      if (line.id !== id) return line

      const updated = { ...line, [field]: value }

      // If service changed, update defaults and resolve price
      if (field === "serviceId") {
        const service = services.find((s) => s.id === value)
        if (service) {
          updated.serviceName = service.name
          updated.billingUnitId = service.billingUnitId
          updated.billingUnitName = service.billingUnitName
          updated.itbisApplicable = service.itbisApplicable
        }
      }

      // If billing unit changed, update name
      if (field === "billingUnitId") {
        const unit = billingUnits.find((u) => u.id === value)
        if (unit) {
          updated.billingUnitName = unit.name
        }
      }

      // Calculate line total
      const price = updated.manualUnitPrice ?? updated.resolvedPrice ?? 0
      updated.lineTotal = (updated.quantity || 0) * price

      // Update price source
      if (updated.manualUnitPrice !== undefined) {
        updated.priceSource = "MANUAL"
      }

      return updated
    })

    onChange(updatedLines)

    // Resolve price when service changes
    if (field === "serviceId" && value && clientId) {
      setResolvingPrice(id)
      try {
        const priceRes = await resolvePrice(value as string, clientId)
        if (priceRes.success && priceRes.data) {
          onChange(
            updatedLines.map((line) => {
              if (line.id !== id) return line
              const resolvedPrice = priceRes.data!.price
              const price = line.manualUnitPrice ?? resolvedPrice
              const priceSource = line.manualUnitPrice !== undefined ? "MANUAL" : priceRes.data!.source
              return {
                ...line,
                resolvedPrice,
                priceSource: priceSource as PriceSource,
                lineTotal: (line.quantity || 0) * price,
              }
            }),
          )
        }
      } catch (error) {
        console.error("Failed to resolve price:", error)
      } finally {
        setResolvingPrice(null)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount)
  }

  const contractTotal = lines.reduce((sum, line) => sum + (line.lineTotal || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No service lines added yet</p>
            {!readOnly && (
              <Button onClick={addLine} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Service Line
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Service</TableHead>
                  <TableHead className="min-w-[100px]">Quantity</TableHead>
                  <TableHead className="min-w-[150px]">Billing Unit</TableHead>
                  <TableHead className="min-w-[150px]">Unit Price</TableHead>
                  <TableHead className="min-w-[80px]">ITBIS</TableHead>
                  <TableHead className="min-w-[120px] text-right">Line Total</TableHead>
                  {!readOnly && <TableHead className="w-[60px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {readOnly ? (
                        <span>{line.serviceName || "—"}</span>
                      ) : (
                        <Select
                          value={line.serviceId}
                          onValueChange={(value) => updateLine(line.id, "serviceId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.code} - {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{line.quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, "quantity", Number.parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{line.billingUnitName || "—"}</span>
                      ) : (
                        <Select
                          value={line.billingUnitId}
                          onValueChange={(value) => updateLine(line.id, "billingUnitId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {billingUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {formatCurrency(line.manualUnitPrice ?? line.resolvedPrice ?? 0)}
                          </span>
                          {line.priceSource && line.priceSource !== "GLOBAL" && (
                            <Badge variant="outline" className="text-xs">
                              {line.priceSource}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={line.resolvedPrice ? formatCurrency(line.resolvedPrice) : "0.00"}
                            value={line.manualUnitPrice ?? ""}
                            onChange={(e) =>
                              updateLine(
                                line.id,
                                "manualUnitPrice",
                                e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              )
                            }
                            className="w-32"
                          />
                          {resolvingPrice === line.id && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Resolving...
                            </div>
                          )}
                          {line.resolvedPrice && !line.manualUnitPrice && (
                            <p className="text-xs text-muted-foreground">
                              {line.priceSource === "CLIENT" ? "Client" : "Global"}:{" "}
                              {formatCurrency(line.resolvedPrice)}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{line.itbisApplicable ? "Yes" : "No"}</span>
                      ) : (
                        <Checkbox
                          checked={line.itbisApplicable}
                          onCheckedChange={(checked) => updateLine(line.id, "itbisApplicable", checked === true)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(line.lineTotal || 0)}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            {!readOnly && (
              <Button onClick={addLine} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            )}
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Contract Total</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(contractTotal)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
