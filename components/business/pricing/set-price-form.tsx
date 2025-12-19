"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getActiveServices } from "@/lib/api/services"
import { getActiveClients } from "@/lib/api/clients"
import type { SetGlobalPriceRequest, SetClientPriceRequest } from "@/types/business"

const setPriceSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  clientId: z.string().optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  effectiveFrom: z.date().optional(),
  notes: z.string().optional(),
})

type SetPriceFormData = z.infer<typeof setPriceSchema>

interface SetPriceFormProps {
  mode: "global" | "client"
  /** Pre-selected client ID for client mode */
  clientId?: string
  onSubmit: (data: SetGlobalPriceRequest | SetClientPriceRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SetPriceForm({ mode, clientId, onSubmit, onCancel, isLoading }: SetPriceFormProps) {
  const { data: servicesResponse, isLoading: isLoadingServices } = useSWR("active-services", () => getActiveServices())
  const { data: clientsResponse, isLoading: isLoadingClients } = useSWR(
    mode === "client" ? "active-clients" : null,
    () => getActiveClients(),
  )

  const services = servicesResponse?.data ?? []
  const clients = clientsResponse?.data ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetPriceFormData>({
    resolver: zodResolver(setPriceSchema),
    defaultValues: {
      serviceId: "",
      clientId: clientId ?? "",
      price: undefined,
      effectiveFrom: undefined,
      notes: "",
    },
  })

  const selectedDate = watch("effectiveFrom")
  const selectedServiceId = watch("serviceId")

  // Pre-fill clientId when provided
  useEffect(() => {
    if (clientId) {
      setValue("clientId", clientId)
    }
  }, [clientId, setValue])

  const handleFormSubmit = async (data: SetPriceFormData) => {
    const payload: SetGlobalPriceRequest | SetClientPriceRequest = {
      serviceId: data.serviceId,
      price: data.price,
      effectiveFrom: data.effectiveFrom?.toISOString(),
      notes: data.notes || undefined,
      ...(mode === "client" && { clientId: data.clientId }),
    }
    await onSubmit(payload as SetGlobalPriceRequest | SetClientPriceRequest)
  }

  const formatCurrency = (value: string) => {
    const num = value.replace(/[^0-9.]/g, "")
    return num
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Service Selector */}
      <div className="space-y-2">
        <Label htmlFor="serviceId">
          Service <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedServiceId} onValueChange={(val) => setValue("serviceId", val)}>
          <SelectTrigger className={errors.serviceId ? "border-destructive" : ""}>
            <SelectValue placeholder={isLoadingServices ? "Loading services..." : "Select a service"} />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <span className="font-mono text-xs mr-2">{service.code}</span>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId.message}</p>}
      </div>

      {/* Client Selector (only for client mode without pre-selected client) */}
      {mode === "client" && !clientId && (
        <div className="space-y-2">
          <Label htmlFor="clientId">
            Client <span className="text-destructive">*</span>
          </Label>
          <Select value={watch("clientId")} onValueChange={(val) => setValue("clientId", val)}>
            <SelectTrigger className={errors.clientId ? "border-destructive" : ""}>
              <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
        </div>
      )}

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="price">
          Price (DOP) <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className={cn("pl-7", errors.price ? "border-destructive" : "")}
            {...register("price", {
              setValueAs: (v) => (v === "" ? undefined : Number.parseFloat(v)),
            })}
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value)
              e.target.value = formatted
            }}
          />
        </div>
        {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
      </div>

      {/* Effective From Date */}
      <div className="space-y-2">
        <Label>Effective From</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Now (immediate)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setValue("effectiveFrom", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">Leave empty to apply immediately</p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Optional notes about this price..." rows={3} {...register("notes")} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Set Price
        </Button>
      </div>
    </form>
  )
}
