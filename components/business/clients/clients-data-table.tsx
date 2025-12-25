"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2, Eye, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/common/permission-gate"
import { EmptyState } from "@/components/common/empty-state"
import { ClientStatusBadge } from "./client-status-badge"
import { ClientForm } from "./client-form"
import { ClientDetailSheet } from "./client-detail-sheet"
import { DeleteClientDialog } from "./delete-client-dialog"
import { createClient, updateClient, deleteClient } from "@/lib/api/clients"
import type { Client, ClientStatus, CreateClientRequest, UpdateClientRequest } from "@/types/business"
import type { PaginatedResponse } from "@/types"
import { Users } from "lucide-react"

interface ClientsDataTableProps {
  clients: PaginatedResponse<Client> | null
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  statusFilter: ClientStatus | "all"
  onStatusFilterChange: (status: ClientStatus | "all") => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function ClientsDataTable({
  clients,
  isLoading,
  page,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
}: ClientsDataTableProps) {
  // Sheet states
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Selected client for operations
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreateClient = async (data: CreateClientRequest | UpdateClientRequest) => {
    setIsSubmitting(true)
    try {
      const response = await createClient(data as CreateClientRequest)
      if (response.success) {
        toast.success("Client created successfully")
        setCreateSheetOpen(false)
        onRefresh()
      } else {
        toast.error(response.message || "Failed to create client")
      }
    } catch {
      toast.error("Failed to create client")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateClient = async (data: CreateClientRequest | UpdateClientRequest) => {
    if (!selectedClient) return

    setIsSubmitting(true)
    try {
      const response = await updateClient(selectedClient.id, data as UpdateClientRequest)
      if (response.success) {
        toast.success("Client updated successfully")
        setEditSheetOpen(false)
        setSelectedClient(null)
        onRefresh()
      } else {
        toast.error(response.message || "Failed to update client")
      }
    } catch {
      toast.error("Failed to update client")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return

    setIsDeleting(true)
    try {
      const response = await deleteClient(selectedClient.id)
      if (response.success) {
        toast.success("Client deleted successfully")
        setDeleteDialogOpen(false)
        setSelectedClient(null)
        onRefresh()
      } else {
        toast.error(response.message || "Failed to delete client")
      }
    } catch {
      toast.error("Failed to delete client")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRowClick = (client: Client) => {
    setSelectedClient(client)
    setDetailSheetOpen(true)
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setEditSheetOpen(true)
  }

  const handleDelete = (client: Client) => {
    setSelectedClient(client)
    setDeleteDialogOpen(true)
  }

  const totalPages = clients?.totalPages ?? 0
  const totalElements = clients?.totalElements ?? 0
  const content = clients?.content ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                {totalElements} client{totalElements !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <PermissionGate permission="CLIENTS_WRITE">
                <Button onClick={() => setCreateSheetOpen(true)}>Add Client</Button>
              </PermissionGate>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, RNC, or email..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as ClientStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Legal Name</TableHead>
                  <TableHead className="hidden lg:table-cell">RNC</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-5 w-36" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-5 w-28" />
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
                    <TableCell colSpan={7} className="h-24">
                      <EmptyState
                        icon={Users}
                        title="No clients found"
                        description={
                          searchQuery || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Get started by adding your first client"
                        }
                        action={
                          !searchQuery &&
                          statusFilter === "all" && (
                            <PermissionGate permission="CLIENTS_WRITE">
                              <Button onClick={() => setCreateSheetOpen(true)}>Add Client</Button>
                            </PermissionGate>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  content.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(client)}
                    >
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {client.legalName || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-sm">
                        {client.rnc || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {client.primaryEmail || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {client.primaryPhone || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <ClientStatusBadge status={client.status} />
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
                                handleRowClick(client)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <PermissionGate permission="CLIENTS_WRITE">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(client)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate permission="CLIENTS_DELETE">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(client)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </PermissionGate>
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

      {/* Create Client Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>Add New Client</SheetTitle>
            <SheetDescription>Create a new client record. Fill in the required information below.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden py-4">
            <ClientForm
              onSubmit={handleCreateClient}
              onCancel={() => setCreateSheetOpen(false)}
              isLoading={isSubmitting}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Client Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
            <SheetDescription>Update the client information. Changes will be saved immediately.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden py-4">
            {selectedClient && (
              <ClientForm
                client={selectedClient}
                onSubmit={handleUpdateClient}
                onCancel={() => {
                  setEditSheetOpen(false)
                  setSelectedClient(null)
                }}
                isLoading={isSubmitting}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Client Detail Sheet */}
      <ClientDetailSheet
        client={selectedClient}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open)
          if (!open) setSelectedClient(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteClientDialog
        client={selectedClient}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setSelectedClient(null)
        }}
        onConfirm={handleDeleteClient}
        isLoading={isDeleting}
      />
    </>
  )
}