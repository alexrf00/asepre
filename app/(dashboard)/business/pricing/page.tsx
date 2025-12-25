"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGate } from "@/components/common/permission-gate"
import { GlobalPricesTable } from "@/components/business/pricing/global-prices-table"
import { ClientPricesTable } from "@/components/business/pricing/client-prices-table"
import { PriceLookupTool } from "@/components/business/pricing/price-lookup-tool"

export default function PricingPage() {
  return (
    <PermissionGate permission="PRICING_READ" showAccessDenied>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
          <p className="text-muted-foreground">Manage global and client-specific service prices</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="global" className="space-y-6">
          <TabsList>
            <TabsTrigger value="global">Global Prices</TabsTrigger>
            <TabsTrigger value="client">Client-Specific</TabsTrigger>
            <TabsTrigger value="lookup">Price Lookup</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-6">
            <GlobalPricesTable />
          </TabsContent>

          <TabsContent value="client" className="space-y-6">
            <ClientPricesTable />
          </TabsContent>

          <TabsContent value="lookup" className="space-y-6">
            <PriceLookupTool />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGate>
  )
}