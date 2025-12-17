"use client"

// ===== Pricing Management Page =====

import { useState } from "react"
import { DollarSign, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlobalPricesTable } from "@/components/business/pricing/global-prices-table"
import { PriceCalculator } from "@/components/business/pricing/price-calculator"
import { SetPriceDialog } from "@/components/business/pricing/set-price-dialog"
import { PriceHistorySheet } from "@/components/business/pricing/price-history-sheet"
import type { ServiceCatalog } from "@/lib/types/business"

export default function PricingPage() {
  const [key, setKey] = useState(0) // Force re-render
  const [pricingService, setPricingService] = useState<ServiceCatalog | null>(null)
  const [historyService, setHistoryService] = useState<ServiceCatalog | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Precios</h1>
          <p className="text-muted-foreground">Configure precios globales y por cliente</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setKey((k) => k + 1)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global">Precios Globales</TabsTrigger>
          <TabsTrigger value="calculator">Calculadora</TabsTrigger>
        </TabsList>

        {/* Global Prices Tab */}
        <TabsContent value="global">
          <GlobalPricesTable
            key={key}
            onSetPrice={(service) => setPricingService(service)}
            onViewHistory={(service) => setHistoryService(service)}
          />
        </TabsContent>

        {/* Price Calculator Tab */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Calculadora de Precios
              </CardTitle>
              <CardDescription>
                Calcule el precio final para un cliente y servicio específico, incluyendo ITBIS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriceCalculator key={key} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SetPriceDialog
        service={pricingService}
        open={!!pricingService}
        onOpenChange={(open) => !open && setPricingService(null)}
        onSuccess={() => setKey((k) => k + 1)}
      />

      <PriceHistorySheet
        service={historyService}
        open={!!historyService}
        onOpenChange={(open) => !open && setHistoryService(null)}
      />
    </div>
  )
}
