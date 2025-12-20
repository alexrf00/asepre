"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Play, Loader2, CalendarClock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { runRecurringInvoicing } from "@/lib/api/invoices"

interface RecurringInvoicingCardProps {
  onSuccess: () => void
}

export function RecurringInvoicingCard({ onSuccess }: RecurringInvoicingCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [maxCatchUp, setMaxCatchUp] = useState(3)
  const [result, setResult] = useState<{ invoicesCreated: number; date: string } | null>(null)

  const handleRun = async () => {
    setIsRunning(true)
    setResult(null)
    try {
      const response = await runRecurringInvoicing({
        date: date || undefined,
        maxCatchUpPerContract: maxCatchUp,
      })

      if (response.success && response.data) {
        setResult({
          invoicesCreated: response.data.invoicesCreated,
          date: response.data.date,
        })
        toast.success(`Created ${response.data.invoicesCreated} invoice(s)`)
        onSuccess()
      } else {
        toast.error(response.error || "Failed to run recurring invoicing")
      }
    } catch {
      toast.error("An error occurred while running recurring invoicing")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Recurring Invoicing</CardTitle>
                  <CardDescription>Generate invoices for contracts with automatic billing enabled</CardDescription>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will generate invoices for all active contracts that have automatic invoicing enabled and are due for
              billing based on their billing frequency and billing day of month.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingDate">Billing Date</Label>
                <Input type="date" id="billingDate" value={date} onChange={(e) => setDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">The date to use for determining which invoices are due</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCatchUp">Max Catch-up Per Contract</Label>
                <Input
                  type="number"
                  id="maxCatchUp"
                  min={1}
                  max={12}
                  value={maxCatchUp}
                  onChange={(e) => setMaxCatchUp(Number.parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of missed invoices to generate per contract
                </p>
              </div>
            </div>

            {result && (
              <Alert>
                <AlertTitle>Recurring Invoicing Complete</AlertTitle>
                <AlertDescription>
                  Created {result.invoicesCreated} invoice(s) for billing date{" "}
                  {format(new Date(result.date), "MMM d, yyyy")}.
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleRun} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Recurring Invoicing
                </>
              )}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
