"use client"

import { useState } from "react"
import {
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileText,
  AlertCircle,
} from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PermissionGate } from "@/components/common/permission-gate"
import { activateContract, suspendContract, terminateContract, reactivateContract } from "@/lib/api/contracts"
import type { ContractDto } from "@/types/business"

interface ContractStatusActionsProps {
  contract: ContractDto
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

  // Activation requirements based on backend rules
  const canActivate = (): { allowed: boolean; issues: string[]; warnings: string[] } => {
    const issues: string[] = []
    const warnings: string[] = []

    // Must have at least one service line
    if (contract.lines.length === 0) {
      issues.push("Contract must have at least one service line")
    }

    // WRITTEN agreements require an uploaded document of type EXECUTED
    if (contract.agreementType === "WRITTEN" && !contract.hasCurrentDocument) {
      issues.push("Written agreements require an uploaded EXECUTED document to activate")
    }

    // VERBAL agreements can activate without document but may want one
    if (contract.agreementType === "VERBAL" && !contract.hasCurrentDocument) {
      warnings.push("Verbal agreement - document is optional but recommended")
    }

    return {
      allowed: issues.length === 0,
      issues,
      warnings,
    }
  }

  const activationCheck = canActivate()
  const isEditable = contract.status === "DRAFT"

  // Status-based action buttons
  const renderActions = () => {
    switch (contract.status) {
      case "DRAFT":
        return (
          <PermissionGate permission="BUSINESS_CONTRACT_UPDATE">
            <div className="space-y-4">
              {!activationCheck.allowed && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cannot Activate</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2">
                      {activationCheck.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {activationCheck.warnings.length > 0 && activationCheck.allowed && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {activationCheck.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={() => setAction("activate")}
                disabled={!activationCheck.allowed}
                className="w-full sm:w-auto"
              >
                <Play className="mr-2 h-4 w-4" />
                Activate Contract
              </Button>
            </div>
          </PermissionGate>
        )
      case "ACTIVE":
        return (
          <PermissionGate permission="BUSINESS_CONTRACT_UPDATE">
            <div className="flex flex-col sm:flex-row gap-2">
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
            <div className="flex flex-col sm:flex-row gap-2">
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
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertTitle>Contract Terminated</AlertTitle>
            <AlertDescription>This contract has been terminated and cannot be modified.</AlertDescription>
          </Alert>
        )
      case "EXPIRED":
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Contract Expired</AlertTitle>
            <AlertDescription>This contract has expired and is no longer active.</AlertDescription>
          </Alert>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">{renderActions()}</div>

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
                  <li className="flex items-center gap-2">
                    {contract.hasCurrentDocument ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <FileText className="h-3 w-3 text-muted-foreground" />
                    )}
                    {contract.hasCurrentDocument
                      ? "Contract document uploaded"
                      : contract.agreementType === "VERBAL"
                        ? "Document optional (verbal agreement)"
                        : "Document required (written agreement)"}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Agreement type: {contract.agreementType}
                  </li>
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
