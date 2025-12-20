"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Trash2, Loader2, Check, ChevronsUpDown, Globe, User, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { CurrencyInput } from "@/components/business/common/currency-input"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { getActiveServices, getBillingUnits } from "@/lib/api/services"
import { resolvePrice } from "@/lib/api/pricing"
import { cn } from "@/lib/utils"
import type { ServiceCatalog, BillingUnit } from "@/types/business"

const ITBIS_RATE = 0.18

export interface InvoiceLineInput {
  tempId: string
  serviceId: string
  serviceName?: string
  description: string
  quantity: number
  billingUnitId: string
  billingUnitName?: string
  unitPrice: number
  itbisApplicable: boolean
  priceSource?: "GLOBAL" | "CLIENT" | "MANUAL"
  lineSubtotal: number
  itbisAmount: number
  lineTotal: number
}

interface InvoiceLinesEditorProps {
  clientId: string | null
  lines: InvoiceLineInput[]
  onChange: (lines: InvoiceLineInput[]) => void
  disabled?: boolean
}

export function InvoiceLinesEditor({ clientId, lines, onChange, disabled = false }: InvoiceLinesEditorProps) {
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [billingUnits, setBillingUnits] = useState<BillingUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingPrices, setResolvingPrices] = useState<Set<string>>(new Set())
  const [openServicePopovers, setOpenServicePopovers] = useState<Set<string>>(new Set())

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

  const calculateLineTotals = useCallback((line: InvoiceLineInput): InvoiceLineInput => {
    const lineSubtotal = (line.quantity || 0) * (line.unitPrice || 0)
    const itbisAmount = line.itbisApplicable ? lineSubtotal * ITBIS_RATE : 0
    const lineTotal = lineSubtotal + itbisAmount
    return { ...line, lineSubtotal, itbisAmount, lineTotal }
  }, [])

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => ({
        subtotal: acc.subtotal + (line.lineSubtotal || 0),
        itbis: acc.itbis + (line.itbisAmount || 0),
        total: acc.total + (line.lineTotal || 0),
      }),
      { subtotal: 0, itbis: 0, total: 0 },
    )
  }, [lines])

  const addLine = () => {
    const newLine: InvoiceLineInput = {
      tempId: crypto.randomUUID(),
      serviceId: "",
      description: "",
      quantity: 1,
      billingUnitId: "",
      unitPrice: 0,
      itbisApplicable: true,
      lineSubtotal: 0,
      itbisAmount: 0,
      lineTotal: 0,
    }
    onChange([...lines, newLine])
  }

  const removeLine = (tempId: string) => {
    onChange(lines.filter((line) => line.tempId !== tempId))
  }

  const updateLine = async (tempId: string, field: keyof InvoiceLineInput, value: unknown) => {
    const updatedLines = lines.map((line) => {
      if (line.tempId !== tempId) return line

      const updated = { ...line, [field]: value }

      // If service changed, update defaults from service
      if (field === "serviceId") {
        const service = services.find((s) => s.id === value)
        if (service) {
          updated.serviceName = service.name
          updated.description = service.description || service.name
          updated.billingUnitId = service.billingUnitId
          updated.billingUnitName = service.billingUnitName
          updated.itbisApplicable = service.itbisApplicable
          updated.unitPrice = 0
          updated.priceSource = undefined
        }
      }

      // If unit price is manually changed, mark as manual
      if (field === "unitPrice") {
        updated.priceSource = "MANUAL"
      }

      return calculateLineTotals(updated)
    })

    onChange(updatedLines)

    // Resolve price when service changes and clientId is available
    if (field === "serviceId" && value && clientId) {
      setResolvingPrices((prev) => new Set(prev).add(tempId))
      try {
        const priceRes = await resolvePrice(value as string, clientId)
        if (priceRes.success && priceRes.data) {
          onChange(
            updatedLines.map((line) => {
              if (line.tempId !== tempId) return line
              const updated = {
                ...line,
                unitPrice: priceRes.data!.price,
                priceSource: priceRes.data!.source,
              }
              return calculateLineTotals(updated)
            }),
          )
        }
      } catch (error) {
        console.error("Failed to resolve price:", error)
      } finally {
        setResolvingPrices((prev) => {
          const next = new Set(prev)
          next.delete(tempId)
          return next
        })
      }
    }
  }

  const toggleServicePopover = (tempId: string, open: boolean) => {
    setOpenServicePopovers((prev) => {
      const next = new Set(prev)
      if (open) {
        next.add(tempId)
      } else {
        next.delete(tempId)
      }
      return next
    })
  }

  const hasValidationErrors = lines.some((line) => !line.serviceId || line.quantity <= 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base font-medium">Invoice Lines</CardTitle>
        {!disabled && (
          <Button onClick={addLine} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-t">
            <p className="text-muted-foreground mb-4">No lines added. Click &apos;+ Add&apos; to add invoice lines.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Service</TableHead>
                    <TableHead className="min-w-[180px]">Description</TableHead>
                    <TableHead className="w-[80px] text-right">Qty</TableHead>
                    <TableHead className="w-[140px] text-right">Price</TableHead>
                    <TableHead className="w-[70px] text-center">ITBIS</TableHead>
                    <TableHead className="w-[100px] text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.tempId}>
                      {/* Service combobox */}
                      <TableCell>
                        <Popover
                          open={openServicePopovers.has(line.tempId)}
                          onOpenChange={(open) => toggleServicePopover(line.tempId, open)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal h-9 text-sm",
                                !line.serviceId && "text-muted-foreground",
                              )}
                              disabled={disabled}
                            >
                              <span className="truncate">
                                {line.serviceId
                                  ? services.find((s) => s.id === line.serviceId)?.code || line.serviceName
                                  : "Select..."}
                              </span>
                              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search services..." />
                              <CommandList>
                                <CommandEmpty>No service found.</CommandEmpty>
                                <CommandGroup>
                                  {services.map((service) => (
                                    <CommandItem
                                      key={service.id}
                                      value={`${service.code} ${service.name}`}
                                      onSelect={() => {
                                        updateLine(line.tempId, "serviceId", service.id)
                                        toggleServicePopover(line.tempId, false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          line.serviceId === service.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{service.code}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                          {service.name}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {/* Inline validation error */}
                        {!line.serviceId && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Required
                          </p>
                        )}
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Input
                          placeholder="Description..."
                          value={line.description || ""}
                          onChange={(e) => updateLine(line.tempId, "description", e.target.value)}
                          disabled={disabled}
                          className="h-9"
                        />
                      </TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantity || ""}
                          onChange={(e) => updateLine(line.tempId, "quantity", Number.parseFloat(e.target.value) || 0)}
                          disabled={disabled}
                          className="h-9 text-right w-20"
                        />
                      </TableCell>

                      {/* Unit Price with source indicator */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="relative flex-1">
                            <CurrencyInput
                              value={line.unitPrice}
                              onChange={(val) => updateLine(line.tempId, "unitPrice", val || 0)}
                              disabled={disabled}
                              className="h-9"
                            />
                            {resolvingPrices.has(line.tempId) && (
                              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          {line.priceSource && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="shrink-0">
                                    {line.priceSource === "GLOBAL" && (
                                      <Globe className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    {line.priceSource === "CLIENT" && <User className="h-4 w-4 text-blue-500" />}
                                    {line.priceSource === "MANUAL" && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        M
                                      </Badge>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {line.priceSource === "GLOBAL" && "Global price"}
                                  {line.priceSource === "CLIENT" && "Client-specific price"}
                                  {line.priceSource === "MANUAL" && "Manually entered"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>

                      {/* ITBIS checkbox */}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={line.itbisApplicable}
                          onCheckedChange={(checked) => updateLine(line.tempId, "itbisApplicable", checked === true)}
                          disabled={disabled}
                        />
                      </TableCell>

                      {/* Line total */}
                      <TableCell className="text-right font-medium">
                        <MoneyDisplay amount={line.lineTotal || 0} />
                      </TableCell>

                      {/* Remove button */}
                      <TableCell>
                        {!disabled && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(line.tempId)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right text-muted-foreground">
                      Subtotal:
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <MoneyDisplay amount={totals.subtotal} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right text-muted-foreground">
                      ITBIS (18%):
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <MoneyDisplay amount={totals.itbis} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      <MoneyDisplay amount={totals.total} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="md:hidden space-y-3 p-4 border-t">
              {lines.map((line, index) => (
                <Card key={line.tempId} className="relative">
                  <CardContent className="pt-4 pb-3">
                    <Badge variant="secondary" className="absolute -top-2 left-3 text-xs">
                      Line {index + 1}
                    </Badge>

                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.tempId)}
                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="grid gap-3 pr-10">
                      {/* Service */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Service</label>
                        <Popover
                          open={openServicePopovers.has(`mobile-${line.tempId}`)}
                          onOpenChange={(open) => toggleServicePopover(`mobile-${line.tempId}`, open)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal bg-transparent"
                              disabled={disabled}
                            >
                              {line.serviceId
                                ? services.find((s) => s.id === line.serviceId)?.name || line.serviceName
                                : "Select service..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search services..." />
                              <CommandList>
                                <CommandEmpty>No service found.</CommandEmpty>
                                <CommandGroup>
                                  {services.map((service) => (
                                    <CommandItem
                                      key={service.id}
                                      value={`${service.code} ${service.name}`}
                                      onSelect={() => {
                                        updateLine(line.tempId, "serviceId", service.id)
                                        toggleServicePopover(`mobile-${line.tempId}`, false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          line.serviceId === service.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{service.code}</span>
                                        <span className="text-sm text-muted-foreground">{service.name}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Description</label>
                        <Input
                          placeholder="Line description..."
                          value={line.description || ""}
                          onChange={(e) => updateLine(line.tempId, "description", e.target.value)}
                          disabled={disabled}
                        />
                      </div>

                      {/* Qty and Price */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Quantity</label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.quantity || ""}
                            onChange={(e) =>
                              updateLine(line.tempId, "quantity", Number.parseFloat(e.target.value) || 0)
                            }
                            disabled={disabled}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Price</label>
                            {line.priceSource && (
                              <Badge variant="outline" className="text-xs">
                                {line.priceSource === "GLOBAL" && "Global"}
                                {line.priceSource === "CLIENT" && "Client"}
                                {line.priceSource === "MANUAL" && "Manual"}
                              </Badge>
                            )}
                          </div>
                          <div className="relative">
                            <CurrencyInput
                              value={line.unitPrice}
                              onChange={(val) => updateLine(line.tempId, "unitPrice", val || 0)}
                              disabled={disabled}
                            />
                            {resolvingPrices.has(line.tempId) && (
                              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ITBIS and totals */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`itbis-mobile-${line.tempId}`}
                            checked={line.itbisApplicable}
                            onCheckedChange={(checked) => updateLine(line.tempId, "itbisApplicable", checked === true)}
                            disabled={disabled}
                          />
                          <label htmlFor={`itbis-mobile-${line.tempId}`} className="text-sm cursor-pointer">
                            ITBIS (18%)
                          </label>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            <MoneyDisplay amount={line.lineTotal || 0} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Mobile totals card */}
              <Card className="bg-muted/30">
                <CardContent className="py-4">
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <div className="flex justify-between w-full">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <MoneyDisplay amount={totals.subtotal} className="font-medium" />
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="text-muted-foreground">ITBIS (18%):</span>
                      <MoneyDisplay amount={totals.itbis} className="font-medium" />
                    </div>
                    <div className="flex justify-between w-full pt-2 border-t mt-1">
                      <span className="font-semibold">Total:</span>
                      <MoneyDisplay amount={totals.total} className="font-bold text-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
