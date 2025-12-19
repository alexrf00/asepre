"use client"

import { useState } from "react"
import { Search, DollarSign, CheckCircle2 } from "lucide-react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getActiveServices } from "@/lib/api/services"
import { getActiveClients } from "@/lib/api/clients"
import { resolvePrice } from "@/lib/api/pricing"
import type { ResolvedPrice } from "@/types/business"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function PriceLookupTool() {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [resolvedPrice, setResolvedPrice] = useState<ResolvedPrice | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Fetch services and clients
  const { data: servicesResponse, isLoading: isLoadingServices } = useSWR("active-services", getActiveServices)
  const { data: clientsResponse, isLoading: isLoadingClients } = useSWR("active-clients", getActiveClients)

  const services = servicesResponse?.data ?? []
  const clients = clientsResponse?.data ?? []

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const handleResolvePrice = async () => {
    if (!selectedServiceId || !selectedClientId) return

    setIsResolving(true)
    setHasSearched(true)
    try {
      const response = await resolvePrice(selectedServiceId, selectedClientId)
      if (response.success && response.data) {
        setResolvedPrice(response.data)
      } else {
        setResolvedPrice(null)
      }
    } catch {
      setResolvedPrice(null)
    } finally {
      setIsResolving(false)
    }
  }

  const canResolve = selectedServiceId && selectedClientId

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Price Lookup Tool
        </CardTitle>
        <CardDescription>Quickly check what price a client would receive for a service</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lookup-service">Service</Label>
            <Select
              value={selectedServiceId}
              onValueChange={(val) => {
                setSelectedServiceId(val)
                setResolvedPrice(null)
                setHasSearched(false)
              }}
            >
              <SelectTrigger id="lookup-service">
                <SelectValue placeholder={isLoadingServices ? "Loading..." : "Select a service"} />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="lookup-client">Client</Label>
            <Select
              value={selectedClientId}
              onValueChange={(val) => {
                setSelectedClientId(val)
                setResolvedPrice(null)
                setHasSearched(false)
              }}
            >
              <SelectTrigger id="lookup-client">
                <SelectValue placeholder={isLoadingClients ? "Loading..." : "Select a client"} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resolve Button */}
        <Button onClick={handleResolvePrice} disabled={!canResolve || isResolving} className="w-full sm:w-auto">
          {isResolving ? (
            <>Resolving...</>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Resolve Price
            </>
          )}
        </Button>

        {/* Results */}
        {hasSearched && !isResolving && (
          <div className="rounded-lg border bg-muted/30 p-6">
            {resolvedPrice ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Price resolved successfully
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {selectedService?.name} for {selectedClient?.name}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold tracking-tight">{formatCurrency(resolvedPrice.price)}</span>
                    <span className="text-muted-foreground">{resolvedPrice.currency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={resolvedPrice.source === "CLIENT" ? "default" : "secondary"}>
                    <DollarSign className="mr-1 h-3 w-3" />
                    {resolvedPrice.source === "CLIENT" ? "Client-Specific Price" : "Global Price"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Source ID: <span className="font-mono">{resolvedPrice.sourceId}</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <DollarSign className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No price found for this service/client combination.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure a global or client-specific price is set.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
