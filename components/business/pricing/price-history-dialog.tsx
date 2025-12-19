"use client"

import { format } from "date-fns"
import useSWR from "swr"
import { History } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { getGlobalPriceHistory } from "@/lib/api/pricing"
import type { Price } from "@/types/business"

interface PriceHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  serviceName: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function PriceHistoryDialog({ open, onOpenChange, serviceId, serviceName }: PriceHistoryDialogProps) {
  const { data: response, isLoading } = useSWR(open && serviceId ? `price-history-${serviceId}` : null, () =>
    getGlobalPriceHistory(serviceId),
  )

  const history: Price[] = response?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Price History</DialogTitle>
          <DialogDescription>
            Historical prices for <span className="font-semibold">{serviceName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Version</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                  </TableRow>
                ))
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24">
                    <EmptyState
                      icon={History}
                      title="No price history"
                      description="This service has no previous prices"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                history.map((price, index) => (
                  <TableRow key={price.id}>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>v{price.version}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(price.price)}</TableCell>
                    <TableCell>{format(new Date(price.effectiveFrom), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {price.effectiveTo ? (
                        format(new Date(price.effectiveTo), "MMM d, yyyy")
                      ) : (
                        <span className="text-muted-foreground">Current</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {price.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
