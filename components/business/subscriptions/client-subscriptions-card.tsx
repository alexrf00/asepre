"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Calendar, DollarSign, MoreHorizontal, Pause, Play, X } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { SubscriptionStatusBadge } from "./subscription-status-badge"
import { QuickServiceAssignment } from "./quick-service-assignment"
import { formatCurrency } from "@/lib/utils/formatters"
import { PermissionGate } from "@/components/common/permission-gate"
import {
  getActiveSubscriptionsByClient,
  suspendSubscription,
  reactivateSubscription,
  cancelSubscription,
} from "@/lib/api/subscriptions"
import type { ClientSubscription } from "@/types/business"

interface ClientSubscriptionsCardProps {
  clientId: string
  clientName: string
}

export function ClientSubscriptionsCard({ clientId, clientName }: ClientSubscriptionsCardProps) {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [actionDialog, setActionDialog] = useState<{
    type: "suspend" | "reactivate" | "cancel"
    subscription: ClientSubscription
  } | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const subscriptions = await getActiveSubscriptionsByClient(clientId)
      setSubscriptions(subscriptions ?? [])
    } catch (error) {
      console.error("Failed to load subscriptions:", error)
      toast.error("Failed to load subscriptions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [clientId])

  const handleAction = async () => {
    if (!actionDialog) return

    setIsProcessing(true)
    try {
      switch (actionDialog.type) {
        case "suspend":
          await suspendSubscription(actionDialog.subscription.id, actionReason)
          toast.success("Subscription suspended")
          break
        case "reactivate":
          await reactivateSubscription(actionDialog.subscription.id)
          toast.success("Subscription reactivated")
          break
        case "cancel":
          await cancelSubscription(actionDialog.subscription.id, actionReason)
          toast.success("Subscription cancelled")
          break
      }
      setActionDialog(null)
      setActionReason("")
      loadSubscriptions()
    } catch (error: any) {
      console.error("Action failed:", error)
      toast.error(error.response?.data?.message || "Action failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const totalMonthly = subscriptions
    .filter((s) => s.status === "ACTIVE" && s.chargeType === "RECURRING")
    .reduce((sum, s) => sum + s.lineTotal, 0)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Active Services</CardTitle>
            <CardDescription>
              {subscriptions.length} active subscription{subscriptions.length !== 1 ? "s" : ""} 
              {totalMonthly > 0 && ` · ${formatCurrency(totalMonthly, "DOP")}/month`}
            </CardDescription>
          </div>
          <PermissionGate permission="SUBSCRIPTIONS_WRITE">
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active services assigned to this client.</p>
              <p className="text-sm mt-1">Use "Add Service" for quick service assignment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{subscription.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.quantity}x {subscription.billingUnitName}
                        </p>
                        {subscription.hasContract && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Contract: {subscription.contractNumber}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={subscription.chargeType === "RECURRING" ? "default" : "secondary"}>
                          {subscription.chargeType}
                        </Badge>
                        {subscription.chargeType === "RECURRING" && (
                          <span className="text-xs text-muted-foreground">
                            {subscription.billingFrequency}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(subscription.lineTotal, subscription.currency)}
                    </TableCell>
                    <TableCell>
                      {subscription.nextBillingDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(subscription.nextBillingDate), "MMM d, yyyy")}
                        </div>
                      ) : subscription.chargeType !== "RECURRING" ? (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={subscription.status} />
                    </TableCell>
                    <TableCell>
                      <PermissionGate permission="SUBSCRIPTIONS_WRITE">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {subscription.status === "ACTIVE" && (
                              <DropdownMenuItem
                                onClick={() => setActionDialog({ type: "suspend", subscription })}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {subscription.status === "SUSPENDED" && (
                              <DropdownMenuItem
                                onClick={() => setActionDialog({ type: "reactivate", subscription })}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            {subscription.status !== "CANCELLED" && (
                              <DropdownMenuItem
                                onClick={() => setActionDialog({ type: "cancel", subscription })}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>
              Quickly assign a service to {clientName}
            </DialogDescription>
          </DialogHeader>
          <QuickServiceAssignment
            preSelectedClientId={clientId}
            onSuccess={() => {
              setShowAddDialog(false)
              loadSubscriptions()
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === "suspend" && "Suspend Subscription"}
              {actionDialog?.type === "reactivate" && "Reactivate Subscription"}
              {actionDialog?.type === "cancel" && "Cancel Subscription"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === "suspend" && "This will pause billing for this subscription."}
              {actionDialog?.type === "reactivate" && "This will resume billing for this subscription."}
              {actionDialog?.type === "cancel" && "This will permanently cancel this subscription. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {(actionDialog?.type === "suspend" || actionDialog?.type === "cancel") && (
            <div className="space-y-2 py-4">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionDialog?.type === "cancel" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog?.type === "suspend" && "Suspend"}
              {actionDialog?.type === "reactivate" && "Reactivate"}
              {actionDialog?.type === "cancel" && "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}