"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, RefreshCw, Plus, FileText, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/common/permission-gate"
import { EmptyState } from "@/components/common/empty-state"
import { ContractStatusBadge } from "./contract-status-badge"
import { CreateContractForm } from "./create-contract-form"
import { ContractDetailSheet } from "./contract-detail-sheet"
import { formatDate } from "@/lib/utils/formatters"
import type { Contract, ContractStatus, Client } from "@/types/business"
import type { PaginatedResponse } from "@/types"

interface ContractsDataTableProps {
  contracts: PaginatedResponse<Contract> | null
  clients: Client[]
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  statusFilter: ContractStatus | "all"
  onStatusFilterChange: (status: ContractStatus | "all") => void
  clientFilter: string
  onClientFilterChange: (clientId: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

const billingFrequencyLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
  ONE_TIME: "One-time",
}

export function ContractsDataTable({
  contracts,
  clients,
  isLoading,
  page,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  clientFilter,
  onClientFilterChange,
  onRefresh,
  isRefreshing,
}: ContractsDataTableProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)

  const handleRowClick = (contract: Contract) => {
    setSelectedContractId(contract.id)
    setDetailSheetOpen(true)
  }

  const handleCreateSuccess = () => {
    setCreateSheetOpen(false)
    onRefresh()
  }

  const totalPages = contracts?.totalPages ?? 0
  const totalElements = contracts?.totalElements ?? 0
  const content = contracts?.content ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>
                {totalElements} contract{totalElements !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <PermissionGate permission="BUSINESS_CONTRACT_CREATE">
                <Button onClick={() => setCreateSheetOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Contract
                </Button>
              </PermissionGate>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={clientFilter} onValueChange={onClientFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as ContractStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="hidden md:table-cell">End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Billing</TableHead>
                  <TableHead className="hidden sm:table-cell">Document</TableHead>
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
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24">
                      <EmptyState
                        icon={FileText}
                        title="No contracts found"
                        description={
                          statusFilter !== "all" || clientFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Get started by creating your first contract"
                        }
                        action={
                          statusFilter === "all" &&
                          clientFilter === "all" && (
                            <PermissionGate permission="BUSINESS_CONTRACT_CREATE">
                              <Button onClick={() => setCreateSheetOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Contract
                              </Button>
                            </PermissionGate>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  content.map((contract) => (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(contract)}
                    >
                      <TableCell className="font-mono font-medium">{contract.contractNumber}</TableCell>
                      <TableCell className="font-medium">{contract.clientName}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(contract.startDate)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(contract.endDate)}</TableCell>
                      <TableCell>
                        <ContractStatusBadge status={contract.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {billingFrequencyLabels[contract.billingFrequency] || contract.billingFrequency}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {contract.hasCurrentDocument ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
                                handleRowClick(contract)
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

      {/* Create Contract Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>Create New Contract</SheetTitle>
            <SheetDescription>Set up a new service contract for a client</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden py-4">
            <CreateContractForm onSuccess={handleCreateSuccess} onCancel={() => setCreateSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Contract Detail Sheet */}
      <ContractDetailSheet
        contractId={selectedContractId}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open)
          if (!open) setSelectedContractId(null)
        }}
        onRefresh={onRefresh}
      />
    </>
  )
}
