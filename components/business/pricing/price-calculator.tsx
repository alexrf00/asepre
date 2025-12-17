"use client"

// ===== Price Calculator Component =====

import { useState } from "react"
import { Calculator } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientSelector } from "@/components/business/common/client-selector"
import { ServiceSelector } from "@/components/business/common/service-selector"
import { MoneyDisplay } from "@/components/business/common/money-display"
import { Badge } from "@/components/ui/badge"
import { resolvePrice } from "@/lib/api/business/pricing"
import { calculateLineTotal } from "@/lib/utils/business"
import type { ResolvedPrice, ServiceCatalog } from "@/lib/types/business"

export function PriceCalculator() {
  const [clientId, setClientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [resolvedPrice, setResolvedPrice] = useState<ResolvedPrice | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  async function handleCalculate() {
    if (!clientId || !serviceId) {
      toast.error("Seleccione un cliente y un servicio")
      return
    }

    setIsCalculating(true)
    try {
      const price = await resolvePrice(serviceId, clientId)
      setResolvedPrice(price)
    } catch {
      toast.error("Error al calcular precio")
    } finally {
      setIsCalculating(false)
    }
  }

  const calculation =
    resolvedPrice && selectedService
      ? calculateLineTotal(quantity, resolvedPrice.price, selectedService.itbisApplicable)
      : null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <ClientSelector value={clientId} onValueChange={setClientId} />
        </div>
        <div className="space-y-2">
          <Label>Servicio</Label>
          <ServiceSelector
            value={serviceId}
            onValueChange={(id, service) => {
              setServiceId(id)
              setSelectedService(service || null)
            }}
          />
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-2 flex-1 max-w-[200px]">
          <Label>Cantidad</Label>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <Button onClick={handleCalculate} disabled={isCalculating || !clientId || !serviceId}>
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? "Calculando..." : "Calcular"}
        </Button>
      </div>

      {resolvedPrice && calculation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Precio resuelto desde:{" "}
              <Badge variant={resolvedPrice.source === "CLIENT" ? "default" : "secondary"}>
                {resolvedPrice.source === "CLIENT" ? "Precio de Cliente" : "Precio Global"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Precio unitario</p>
                <MoneyDisplay amount={resolvedPrice.price} className="text-lg font-medium" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cantidad</p>
                <p className="text-lg font-medium">
                  {quantity} {selectedService?.billingUnitName}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <MoneyDisplay amount={calculation.subtotal} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ITBIS (18%)</span>
                <MoneyDisplay amount={calculation.itbis} />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <MoneyDisplay amount={calculation.total} size="lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
