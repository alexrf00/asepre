"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Power, Search, RefreshCw, Package } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/common/permission-gate"
import { EmptyState } from "@/components/common/empty-state"
import { ServiceForm } from "./service-form"
import { createService, updateService, deactivateService } from "@/lib/api/services"
import type { CreateServiceRequest, ServiceCatalog, UpdateServiceRequest } from "@/types/business"
import type { PaginatedResponse } from "@/types"

interface ServicesDataTableProps {
  services: PaginatedResponse<ServiceCatalog> | null
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  showInactive: boolean
  onShowInactiveChange: (show: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function ServicesDataTable({
  services,
  isLoading,
  page,
  onPageChange,
  showInactive,
  onShowInactiveChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
}: ServicesDataTableProps) {
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)

  // Selected service for operations
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const handleCreateService = async (data: CreateServiceRequest | UpdateServiceRequest) => {
    setIsSubmitting(true)
    try {
      const response = await createService(data as CreateServiceRequest)
      if (response.success) {
        toast.success("Service created successfully")
        setCreateDialogOpen(false)
        onRefresh()
      } else {
        toast.error(response.message || "Failed to create service")
      }
    } catch {
      toast.error("Failed to create service")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateService = async (data: CreateServiceRequest | UpdateServiceRequest) => {
    if (!selectedService) return

    setIsSubmitting(true)
    try {
      const response = await updateService(selectedService.id, data as UpdateServiceRequest)
      if (response.success) {
        toast.success("Service updated successfully")
        setEditDialogOpen(false)
        setSelectedService(null)
        onRefresh()
      } else {
        toast.error(response.message || "Failed to update service")
      }
    } catch {
      toast.error("Failed to update service")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivateService = async () => {
    if (!selectedService) return

    setIsDeactivating(true)
    try {
      const response = await deactivateService(selectedService.id)
      if (response.success) {
        toast.success("Service deactivated successfully")
        setDeactivateDialogOpen(false)
        setSelectedService(null)
        onRefresh()
      } else {
        toast.error(response.message || "Failed to deactivate service")
      }
    } catch {
      toast.error("Failed to deactivate service")
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleEdit = (service: ServiceCatalog) => {
    setSelectedService(service)
    setEditDialogOpen(true)
  }

  const handleDeactivate = (service: ServiceCatalog) => {
    setSelectedService(service)
    setDeactivateDialogOpen(true)
  }

  const totalPages = services?.totalPages ?? 0
  const totalElements = services?.totalElements ?? 0
  const content = services?.content ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services Catalog</CardTitle>
              <CardDescription>
                {totalElements} service{totalElements !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <PermissionGate permission="SERVICES_WRITE">
                <Button onClick={() => setCreateDialogOpen(true)}>Add Service</Button>
              </PermissionGate>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, or description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={onShowInactiveChange} />
              <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
                Show inactive services
              </Label>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Billing Unit</TableHead>
                  <TableHead className="hidden sm:table-cell">ITBIS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-5 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24">
                      <EmptyState
                        icon={Package}
                        title="No services found"
                        description={
                          searchQuery || showInactive
                            ? "Try adjusting your search or filters"
                            : "Get started by adding your first service"
                        }
                        action={
                          !searchQuery && (
                            <PermissionGate permission="SERVICES_WRITE">
                              <Button onClick={() => setCreateDialogOpen(true)}>Add Service</Button>
                            </PermissionGate>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  content.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {service.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-sm text-muted-foreground">{service.billingUnitCode}</span>
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <span className="text-sm">{service.billingUnitName}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {service.itbisApplicable ? (
                          <Badge variant="secondary">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
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
                            <PermissionGate permission="SERVICES_WRITE">
                              <DropdownMenuItem onClick={() => handleEdit(service)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            {service.active && (
                              <PermissionGate permission="SERVICES_DELETE">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeactivate(service)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              </PermissionGate>
                            )}
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

      {/* Create Service Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a new service in the catalog.</DialogDescription>
          </DialogHeader>
          <ServiceForm
            onSubmit={handleCreateService}
            onCancel={() => setCreateDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service information.</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <ServiceForm
              service={selectedService}
              onSubmit={handleUpdateService}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedService(null)
              }}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Service</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to deactivate <span className="font-semibold">{selectedService?.name}</span>?
              </p>
              <p className="text-amber-600 dark:text-amber-500">
                Warning: This service cannot be deactivated if it has an active global price or is used in active
                contracts.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeactivateDialogOpen(false)
                setSelectedService(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateService}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}