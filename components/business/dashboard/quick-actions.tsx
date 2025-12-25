"use client"

import { useState } from "react"
import Link from "next/link"
import { UserPlus, Receipt, CreditCard, CalendarClock, Loader2, Play } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { PermissionGate } from "@/components/common/permission-gate"
import { runRecurringInvoicing } from "@/lib/api/invoices"
import { useAuthStore } from "@/lib/store/auth-store"

interface QuickActionsProps {
  onRecurringInvoicingSuccess: () => void
}

export function QuickActions({ onRecurringInvoicingSuccess }: QuickActionsProps) {
  const { user } = useAuthStore()
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const isSuperAdmin = user?.roles?.includes("SUPERADMIN")

  const handleRunRecurringInvoicing = async () => {
    setIsRunning(true)
    try {
      const response = await runRecurringInvoicing()
      if (response.success && response.data) {
        toast.success(`Created ${response.data.invoicesCreated} invoice(s)`)
        onRecurringInvoicingSuccess()
      } else {
        toast.error(response.error || "Failed to run recurring invoicing")
      }
    } catch {
      toast.error("An error occurred while running recurring invoicing")
    } finally {
      setIsRunning(false)
      setRecurringDialogOpen(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PermissionGate permission="CLIENTS_WRITE">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/business/clients?action=create">
                <UserPlus className="mr-2 h-4 w-4" />
                New Client
              </Link>
            </Button>
          </PermissionGate>

          <PermissionGate permission="INVOICES_WRITE">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/business/invoices?action=create">
                <Receipt className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </PermissionGate>

          <PermissionGate permission="PAYMENTS_WRITE">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/business/payments?action=record">
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          </PermissionGate>

          {isSuperAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => setRecurringDialogOpen(true)}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="mr-2 h-4 w-4" />
              )}
              Run Recurring Invoicing
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recurring Invoicing Confirmation Dialog */}
      <AlertDialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Recurring Invoicing</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate invoices for all active contracts with automatic invoicing enabled that are due for
              billing. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRunRecurringInvoicing} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}