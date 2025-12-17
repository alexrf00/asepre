"use client"

// ===== Set Global Price Dialog =====

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CurrencyInput } from "@/components/business/common/currency-input"
import { cn } from "@/lib/utils"
import { setGlobalPriceSchema, type SetGlobalPriceFormData } from "@/lib/validations/business"
import { setGlobalPrice, getGlobalPrice } from "@/lib/api/business/pricing"
import { formatDOP } from "@/lib/utils/business"
import type { ServiceCatalog, GlobalServicePrice } from "@/lib/types/business"
import { useEffect } from "react"

interface SetPriceDialogProps {
  service: ServiceCatalog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SetPriceDialog({ service, open, onOpenChange, onSuccess }: SetPriceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<GlobalServicePrice | null>(null)

  const form = useForm<SetGlobalPriceFormData>({
    resolver: zodResolver(setGlobalPriceSchema),
    defaultValues: {
      serviceId: service?.id || "",
      price: 0,
      effectiveFrom: new Date().toISOString().split("T")[0],
    },
  })

  useEffect(() => {
    if (service && open) {
      form.setValue("serviceId", service.id)
      // Load current price
      getGlobalPrice(service.id)
        .then((price) => {
          setCurrentPrice(price)
          if (price) {
            form.setValue("price", price.price)
          }
        })
        .catch(() => setCurrentPrice(null))
    }
  }, [service, open, form])

  async function handleSubmit(data: SetGlobalPriceFormData) {
    setIsLoading(true)
    try {
      const response = await setGlobalPrice(data)
      if (response.success) {
        toast.success("Precio actualizado exitosamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.message || "Error al actualizar precio")
      }
    } catch {
      toast.error("Error al actualizar precio")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Establecer Precio Global</DialogTitle>
          <DialogDescription>
            {service && (
              <>
                Servicio: <strong>{service.name}</strong> ({service.code})
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {currentPrice && (
          <div className="rounded-lg bg-muted p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Precio actual</p>
            <p className="text-xl font-bold">{formatDOP(currentPrice.price)}</p>
            <p className="text-xs text-muted-foreground">
              Vigente desde: {format(new Date(currentPrice.effectiveFrom), "dd/MM/yyyy", { locale: es })}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo precio *</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>Precio por {service?.billingUnitName}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de vigencia *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split("T")[0])}
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>El nuevo precio entrará en vigencia a partir de esta fecha</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar precio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
