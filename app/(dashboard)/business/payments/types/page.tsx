"use client"

// ===== Payment Types Management Page (SUPERADMIN Only) =====

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Plus, RefreshCw, Check, X, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { ProtectedRoute } from "@/components/common/protected-route"
import { getPaymentTypes, createPaymentType, updatePaymentType, deletePaymentType } from "@/lib/api/business/payments"
import type { PaymentType, CreatePaymentTypeRequest } from "@/lib/types/business"
import { Loader2 } from "lucide-react"

export default function PaymentTypesPage() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<PaymentType | null>(null)
  const [deletingType, setDeletingType] = useState<PaymentType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreatePaymentTypeRequest>({
    code: "",
    name: "",
    description: "",
    requiresReference: false,
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const types = await getPaymentTypes()
      setPaymentTypes(types)
    } catch {
      toast.error("Error al cargar tipos de pago")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleOpenDialog(type?: PaymentType) {
    if (type) {
      setEditingType(type)
      setFormData({
        code: type.code,
        name: type.name,
        description: type.description || "",
        requiresReference: type.requiresReference,
      })
    } else {
      setEditingType(null)
      setFormData({
        code: "",
        name: "",
        description: "",
        requiresReference: false,
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.code || !formData.name) {
      toast.error("Código y nombre son requeridos")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingType) {
        const response = await updatePaymentType(editingType.id, formData)
        if (response.success) {
          toast.success("Tipo de pago actualizado")
          loadData()
          setIsDialogOpen(false)
        } else {
          toast.error(response.message || "Error al actualizar")
        }
      } else {
        const response = await createPaymentType(formData)
        if (response.success) {
          toast.success("Tipo de pago creado")
          loadData()
          setIsDialogOpen(false)
        } else {
          toast.error(response.message || "Error al crear")
        }
      }
    } catch {
      toast.error("Error al guardar tipo de pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingType) return

    setIsDeleting(true)
    try {
      const response = await deletePaymentType(deletingType.id)
      if (response.success) {
        toast.success("Tipo de pago eliminado")
        loadData()
      } else {
        toast.error(response.message || "Error al eliminar")
      }
    } catch {
      toast.error("Error al eliminar tipo de pago")
    } finally {
      setIsDeleting(false)
      setDeletingType(null)
    }
  }

  return (
    <ProtectedRoute permissions={["BUSINESS_PAYMENT_TYPE_MANAGE"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Pago</h1>
            <p className="text-muted-foreground">Configure los métodos de pago aceptados</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Button>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>Defina los tipos de pago que pueden registrarse en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : paymentTypes.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Sin tipos de pago"
                description="Configure los métodos de pago aceptados"
                action={
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Tipo de Pago
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Req. Referencia</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-mono font-medium">{type.code}</TableCell>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="text-muted-foreground">{type.description || "-"}</TableCell>
                      <TableCell className="text-center">
                        {type.requiresReference ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={type.active ? "default" : "secondary"}>
                          {type.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(type)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingType(type)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? "Editar Tipo de Pago" : "Nuevo Tipo de Pago"}</DialogTitle>
              <DialogDescription>
                {editingType
                  ? "Modifique la configuración del método de pago"
                  : "Configure un nuevo método de pago aceptado"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    placeholder="TRANSFER"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    disabled={!!editingType}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Transferencia Bancaria"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Descripción opcional del método de pago"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Requiere Referencia</Label>
                  <p className="text-sm text-muted-foreground">
                    El usuario deberá ingresar un número de referencia al registrar pagos
                  </p>
                </div>
                <Switch
                  checked={formData.requiresReference}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresReference: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingType ? "Guardar Cambios" : "Crear Tipo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deletingType}
          onOpenChange={(open) => !open && setDeletingType(null)}
          title="Eliminar Tipo de Pago"
          description={`¿Está seguro de eliminar el tipo de pago "${deletingType?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      </div>
    </ProtectedRoute>
  )
}
