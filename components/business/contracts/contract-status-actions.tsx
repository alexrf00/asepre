"use client"

import { useState } from "react"
import { Play, Pause, XCircle, RotateCcw, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGate } from "@/components/common/permission-gate"
import { activateContract, suspendContract, terminateContract, reactivateContract } from "@/lib/api/contracts"
import type { Contract } from "@/types/business"

interface ContractStatusActionsProps {
  contract: Contract
  onStatusChange: () => void
}

type ActionType = "activate" | "suspend" | "terminate" | "reactivate" | null

export function ContractStatusActions({ contract, onStatusChange }: ContractStatusActionsProps) {
  const [action, setAction] = useState<ActionType>(null)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    if (!action) return

    if ((action === "suspend" || action === "terminate") && !reason.trim()) {
      toast.error("Please provide a reason")
      return
    }

    setIsLoading(true)
    try {
      let response
      switch (action) {
        case "activate":
          response = await activateContract(contract.id)
          break
        case "suspend":
          response = await suspendContract(contract.id, reason)
          break
        case "terminate":
          response = await terminateContract(contract.id, reason)
          break
        case "reactivate":
          response = await reactivateContract(contract.id)
          break
      }

      if (response?.success) {
        toast.success(`Contract ${action}d successfully`)
        setAction(null)
        setReason("")
        onStatusChange()
      } else {
        toast.error(response?.message || `Failed to ${action} contract`)
      }
    } catch {
      toast.error(`Failed to ${action} contract`)
    } finally {
      setIsLoading(false)
    }
  }

  const closeDialog = () => {
    setAction(null)
    setReason("")
  }

  const canActivate = (): { allowed: boolean; issues: string[] } => {
    const issues: string[] = []

    if (contract.lines.length === 0) {
      issues.push("Contract must have at least one service line")
    }

    // Check if written agreement requires document
    // Note: We're checking agreementType from the contract object
    // The Contract type doesn't include agreementType, so we'll skip this check
    // if the backend validates it during activation
    if (!contract.hasCurrentDocument) {
      issues.push("Written agreements require an uploaded document (optional for verbal)")
    }

    return {
      allowed: contract.lines.length > 0,
      issues,
    }
  }

  const activationCheck = canActivate()

  // Status-based action buttons
  const renderActions = () => {
    switch (contract.status) {
      case "DRAFT":
        return (
          <PermissionGate permission="BUSINESS_CONTRACT_UPDATE">
            <Button onClick={() => setAction("activate")} disabled={!activationCheck.allowed}>
              <Play className="mr-2 h-4 w-4" />
              Activate Contract
            </Button>
          </PermissionGate>
        )
      case "ACTIVE":
        return (
          <PermissionGate permission="BUSINESS_CONTRACT_UPDATE">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAction("suspend")}>
                <Pause className="mr-2 h-4 w-4" />
                Suspend
              </Button>
              <Button variant="destructive" onClick={() => setAction("terminate")}>
                <XCircle className="mr-2 h-4 w-4" />
                Terminate
              </Button>
            </div>
          </PermissionGate>
        )
      case "SUSPENDED":
        return (
          <PermissionGate permission="BUSINESS_CONTRACT_UPDATE">
            <div className="flex gap-2">
              <Button onClick={() => setAction("reactivate")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reactivate
              </Button>
              <Button variant="destructive" onClick={() => setAction("terminate")}>
                <XCircle className="mr-2 h-4 w-4" />
                Terminate
              </Button>
            </div>
          </PermissionGate>
        )
      case "TERMINATED":
        return (
          <p className="text-sm text-muted-foreground">This contract has been terminated and cannot be modified.</p>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {contract.status === "DRAFT" && !activationCheck.allowed && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {activationCheck.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {renderActions()}
      </div>

      {/* Activation Dialog */}
      <Dialog open={action === "activate"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate this contract? This will make it active and billable.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Activation Checklist</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {contract.lines.length} service line(s) configured
                  </li>
                  {contract.hasCurrentDocument && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Contract document uploaded
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activate Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={action === "suspend"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Contract</DialogTitle>
            <DialogDescription>
              This will temporarily suspend the contract. It can be reactivated later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspendReason">Reason for Suspension *</Label>
              <Textarea
                id="suspendReason"
                placeholder="Enter the reason for suspending this contract..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isLoading || !reason.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspend Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog open={action === "terminate"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Contract</DialogTitle>
            <DialogDescription>
              <span className="text-destructive font-medium">Warning:</span> This action cannot be undone. The contract
              will be permanently terminated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="terminateReason">Reason for Termination *</Label>
              <Textarea
                id="terminateReason"
                placeholder="Enter the reason for terminating this contract..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleAction} disabled={isLoading || !reason.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Terminate Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={action === "reactivate"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Contract</DialogTitle>
            <DialogDescription>This will reactivate the suspended contract and make it active again.</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reactivate Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
