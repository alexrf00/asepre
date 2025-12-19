"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Loader2, RefreshCw, CreditCard, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { getPaymentTypes, createPaymentType } from "@/lib/api/payments"

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  requiresReference: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export function PaymentTypesTable() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: paymentTypesRes, isLoading, mutate } = useSWR("payment-types-all", () => getPaymentTypes())
  const paymentTypes = paymentTypesRes?.data ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      requiresReference: false,
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await createPaymentType({
        code: values.code.toUpperCase(),
        name: values.name,
        description: values.description || undefined,
        requiresReference: values.requiresReference,
      })

      if (result.success) {
        toast.success("Payment type created successfully")
        setCreateDialogOpen(false)
        form.reset()
        mutate()
      } else {
        toast.error(result.error || "Failed to create payment type")
      }
    } catch {
      toast.error("An error occurred")
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
              <CardTitle>Payment Types</CardTitle>
              <CardDescription>Manage payment methods available for recording payments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Requires Ref</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paymentTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24">
                      <EmptyState
                        icon={CreditCard}
                        title="No payment types"
                        description="Add your first payment type to get started"
                        action={
                          <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Type
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentTypes.map((pt) => (
                    <TableRow key={pt.id}>
                      <TableCell className="font-mono font-medium">{pt.code}</TableCell>
                      <TableCell className="font-medium">{pt.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {pt.description || "—"}
                      </TableCell>
                      <TableCell>
                        {pt.requiresReference ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pt.active ? "default" : "secondary"}>{pt.active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Type</DialogTitle>
            <DialogDescription>Create a new payment method</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., TRANSFER"
                {...form.register("code")}
                onChange={(e) => form.setValue("code", e.target.value.toUpperCase())}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g., Bank Transfer" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                rows={2}
                {...form.register("description")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresReference"
                checked={form.watch("requiresReference")}
                onCheckedChange={(checked) => form.setValue("requiresReference", !!checked)}
              />
              <Label htmlFor="requiresReference" className="font-normal">
                Requires reference number
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
