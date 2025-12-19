"use client"
import { MoreHorizontal, Eye, RefreshCw, Plus, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PermissionGate } from "@/components/common/permission-gate"
import { EmptyState } from "@/components/common/empty-state"
import { PaymentStatusBadge } from "./payment-status-badge"
import { formatDate, formatCurrency } from "@/lib/utils/formatters"
import type { Payment, Client } from "@/types/business"
import type { PaginatedResponse } from "@/types"

interface PaymentsDataTableProps {
  payments: PaginatedResponse<Payment> | null
  clients: Client[]
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  clientFilter: string
  onClientFilterChange: (clientId: string) => void
  startDate: string
  onStartDateChange: (date: string) => void
  endDate: string
  onEndDateChange: (date: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  onRecordPayment: () => void
  onViewPayment: (payment: Payment) => void
}

export function PaymentsDataTable({
  payments,
  clients,
  isLoading,
  page,
  onPageChange,
  clientFilter,
  onClientFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onRefresh,
  isRefreshing,
  onRecordPayment,
  onViewPayment,
}: PaymentsDataTableProps) {
  const totalPages = payments?.totalPages ?? 0
  const totalElements = payments?.totalElements ?? 0
  const content = payments?.content ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              {totalElements} payment{totalElements !== 1 ? "s" : ""} total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <PermissionGate permission="BUSINESS_PAYMENT_CREATE">
              <Button onClick={onRecordPayment}>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </PermissionGate>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="client-filter" className="text-sm text-muted-foreground">
              Client
            </Label>
            <Select value={clientFilter} onValueChange={onClientFilterChange}>
              <SelectTrigger id="client-filter" className="mt-1">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start-date" className="text-sm text-muted-foreground">
              From
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="mt-1 w-[150px]"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-sm text-muted-foreground">
              To
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="mt-1 w-[150px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Allocated</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Unallocated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 ml-auto" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24">
                    <EmptyState
                      icon={Receipt}
                      title="No payments found"
                      description={
                        clientFilter !== "all" || startDate || endDate
                          ? "Try adjusting your filters"
                          : "Record your first payment to get started"
                      }
                      action={
                        clientFilter === "all" &&
                        !startDate &&
                        !endDate && (
                          <PermissionGate permission="BUSINESS_PAYMENT_CREATE">
                            <Button onClick={onRecordPayment}>
                              <Plus className="mr-2 h-4 w-4" />
                              Record Payment
                            </Button>
                          </PermissionGate>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                content.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewPayment(payment)}
                  >
                    <TableCell className="font-mono font-medium">{payment.paymentNumber}</TableCell>
                    <TableCell className="font-medium">{payment.clientName}</TableCell>
                    <TableCell className="hidden md:table-cell">{payment.paymentTypeName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {formatCurrency(payment.amountAllocated, payment.currency)}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {formatCurrency(payment.amountUnallocated, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewPayment(payment)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
