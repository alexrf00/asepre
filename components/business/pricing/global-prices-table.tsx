"use client"

import { useState } from "react"
import { format } from "date-fns"
import { History, MoreHorizontal, DollarSign, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/common/permission-gate"
import { EmptyState } from "@/components/common/empty-state"
import { SetPriceForm } from "./set-price-form"
import { PriceHistoryDialog } from "./price-history-dialog"
import { getActiveGlobalPrices, setGlobalPrice } from "@/lib/api/pricing"
import type { Price, SetGlobalPriceRequest } from "@/types/business"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function GlobalPricesTable() {
  const { data: response, isLoading, mutate: refreshPrices } = useSWR("global-prices", getActiveGlobalPrices)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Dialog states
  const [setPriceDialogOpen, setSetPriceDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const prices: Price[] = response?.data ?? []

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshPrices()
    setIsRefreshing(false)
  }

  const handleSetGlobalPrice = async (data: SetGlobalPriceRequest) => {
    setIsSubmitting(true)
    try {
      const response = await setGlobalPrice(data)
      if (response.success) {
        toast.success("Global price set successfully")
        setSetPriceDialogOpen(false)
        refreshPrices()
        // Also invalidate active services cache if needed
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

  const handleViewHistory = (price: Price) => {
    setSelectedPrice(price)
    setHistoryDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Global Prices</CardTitle>
              <CardDescription>
                {prices.length} active global price{prices.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <PermissionGate permission="BUSINESS_PRICE_GLOBAL_MANAGE">
                <Button onClick={() => setSetPriceDialogOpen(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Set Global Price
                </Button>
              </PermissionGate>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden md:table-cell">Effective From</TableHead>
                  <TableHead className="hidden lg:table-cell w-16">Version</TableHead>
                  <TableHead className="hidden xl:table-cell">Notes</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
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
                        <Skeleton className="h-5 w-8" />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : prices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24">
                      <EmptyState
                        icon={DollarSign}
                        title="No global prices set"
                        description="Set global prices for services to define default pricing"
                        action={
                          <PermissionGate permission="BUSINESS_PRICE_GLOBAL_MANAGE">
                            <Button onClick={() => setSetPriceDialogOpen(true)}>Set Global Price</Button>
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
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary">v{price.version}</Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                        {price.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewHistory(price)}>
                              <History className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Set Global Price Dialog */}
      <Dialog open={setPriceDialogOpen} onOpenChange={setSetPriceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Global Price</DialogTitle>
            <DialogDescription>
              Set the default price for a service. This will apply to all clients without a specific price.
            </DialogDescription>
          </DialogHeader>
          <SetPriceForm
            mode="global"
            onSubmit={handleSetGlobalPrice}
            onCancel={() => setSetPriceDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      {selectedPrice && (
        <PriceHistoryDialog
          open={historyDialogOpen}
          onOpenChange={(open) => {
            setHistoryDialogOpen(open)
            if (!open) setSelectedPrice(null)
          }}
          serviceId={selectedPrice.serviceId}
          serviceName={selectedPrice.serviceName}
        />
      )}
    </>
  )
}
