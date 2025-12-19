"use client"

import { useState } from "react"
import { format } from "date-fns"
import { DollarSign, RefreshCw, Users } from "lucide-react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/common/permission-gate"
import { EmptyState } from "@/components/common/empty-state"
import { SetPriceForm } from "./set-price-form"
import { getActiveClients } from "@/lib/api/clients"
import { getActiveClientPrices, setClientPrice } from "@/lib/api/pricing"
import type { Price, SetClientPriceRequest, Client } from "@/types/business"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function ClientPricesTable() {
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Dialog state
  const [setPriceDialogOpen, setSetPriceDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch active clients
  const { data: clientsResponse, isLoading: isLoadingClients } = useSWR("active-clients", getActiveClients)
  const clients: Client[] = clientsResponse?.data ?? []

  // Fetch client-specific prices when a client is selected
  const {
    data: pricesResponse,
    isLoading: isLoadingPrices,
    mutate: refreshPrices,
  } = useSWR(selectedClientId ? `client-prices-${selectedClientId}` : null, () =>
    getActiveClientPrices(selectedClientId),
  )
  const prices: Price[] = pricesResponse?.data ?? []

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const handleRefresh = async () => {
    if (!selectedClientId) return
    setIsRefreshing(true)
    await refreshPrices()
    setIsRefreshing(false)
  }

  const handleSetClientPrice = async (data: SetClientPriceRequest) => {
    setIsSubmitting(true)
    try {
      const response = await setClientPrice(data as SetClientPriceRequest)
      if (response.success) {
        toast.success("Client price set successfully")
        setSetPriceDialogOpen(false)
        refreshPrices()
        mutate("active-services")
      } else {
        toast.error(response.message || "Failed to set price")
      }
    } catch {
      toast.error("Failed to set price")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client-Specific Prices</CardTitle>
              <CardDescription>Custom pricing overrides for individual clients</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedClientId && (
                <>
                  <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                  <PermissionGate permission="BUSINESS_PRICE_CLIENT_MANAGE">
                    <Button onClick={() => setSetPriceDialogOpen(true)}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Set Client Price
                    </Button>
                  </PermissionGate>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Selector */}
          <div className="max-w-md">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client to view prices"} />
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

          {/* Prices Table or Empty State */}
          {!selectedClientId ? (
            <div className="py-12">
              <EmptyState
                icon={Users}
                title="Select a client"
                description="Choose a client from the dropdown to view their custom prices"
              />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="hidden md:table-cell">Effective From</TableHead>
                    <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPrices ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : prices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24">
                        <EmptyState
                          icon={DollarSign}
                          title="No custom prices"
                          description={`${selectedClient?.name ?? "This client"} has no custom price overrides. Global prices will apply.`}
                          action={
                            <PermissionGate permission="BUSINESS_PRICE_CLIENT_MANAGE">
                              <Button onClick={() => setSetPriceDialogOpen(true)}>Set Client Price</Button>
                            </PermissionGate>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    prices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {price.serviceCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{price.serviceName}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(price.price)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {format(new Date(price.effectiveFrom), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                          {price.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set Client Price Dialog */}
      <Dialog open={setPriceDialogOpen} onOpenChange={setSetPriceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Client Price</DialogTitle>
            <DialogDescription>
              Set a custom price for <span className="font-semibold">{selectedClient?.name}</span>. This will override
              the global price.
            </DialogDescription>
          </DialogHeader>
          <SetPriceForm
            mode="client"
            clientId={selectedClientId}
            onSubmit={handleSetClientPrice}
            onCancel={() => setSetPriceDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
