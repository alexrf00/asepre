"use client"
import { Calendar, Building, Clock, Loader2 } from "lucide-react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ContractStatusBadge } from "./contract-status-badge"
import { ContractDocuments } from "./contract-documents"
import { ContractStatusActions } from "./contract-status-actions"
import { getContract } from "@/lib/api/contracts"
import { formatDate, formatDateTime } from "@/lib/utils/formatters"

interface ContractDetailSheetProps {
  contractId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

const billingFrequencyLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
  ONE_TIME: "One-time",
}

export function ContractDetailSheet({ contractId, open, onOpenChange, onRefresh }: ContractDetailSheetProps) {
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR(contractId && open ? `contract-${contractId}` : null, () => getContract(contractId!))

  const contract = response?.data

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount)
  }

  const handleStatusChange = () => {
    mutate()
    onRefresh()
  }

  const isDraft = contract?.status === "DRAFT"
  const isTerminated = contract?.status === "TERMINATED"

  const contractTotal = contract?.lines.reduce((sum, line) => sum + line.lineTotal, 0) || 0

  if (!contractId) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading contract...</span>
            </div>
          ) : contract ? (
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">Contract #{contract.contractNumber}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <Building className="h-4 w-4" />
                  {contract.clientName}
                </SheetDescription>
              </div>
              <ContractStatusBadge status={contract.status} />
            </div>
          ) : null}
        </SheetHeader>

        {contract && (
          <ScrollArea className="flex-1">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(contract.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(contract.endDate)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Billing Frequency</p>
                        <p className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {billingFrequencyLabels[contract.billingFrequency] || contract.billingFrequency}
                        </p>
                      </div>
                      {contract.billingDayOfMonth && (
                        <div>
                          <p className="text-sm text-muted-foreground">Billing Day</p>
                          <p className="font-medium">Day {contract.billingDayOfMonth}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm text-muted-foreground">Contract Total</p>
                      <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(contractTotal)}</p>
                      <p className="text-xs text-muted-foreground">per billing period</p>
                    </div>

                    {contract.terms && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Terms</p>
                          <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
                        </div>
                      </>
                    )}

                    {contract.notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{formatDateTime(contract.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Updated</p>
                        <p>{formatDateTime(contract.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Lines</CardTitle>
                    <CardDescription>
                      {contract.lines.length} service{contract.lines.length !== 1 ? "s" : ""} in this contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contract.lines.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No service lines in this contract</p>
                    ) : (
                      <div className="rounded-lg border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Service</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>ITBIS</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contract.lines.map((line) => (
                              <TableRow key={line.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{line.serviceName}</p>
                                    <p className="text-xs text-muted-foreground">{line.serviceCode}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{line.quantity}</TableCell>
                                <TableCell>{line.billingUnitName}</TableCell>
                                <TableCell className="font-mono">
                                  {formatCurrency(line.unitPrice)}
                                  {line.priceSource !== "RESOLVED" && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {line.priceSource}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {line.itbisApplicable ? (
                                    <Badge variant="secondary">Yes</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">No</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  {formatCurrency(line.lineTotal)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Contract Total</p>
                        <p className="text-2xl font-bold font-mono">{formatCurrency(contractTotal)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-0">
                <ContractDocuments
                  contractId={contract.id}
                  hasCurrentDocument={contract.hasCurrentDocument}
                  readOnly={isTerminated}
                />
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Actions</CardTitle>
                    <CardDescription>Manage the lifecycle of this contract</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContractStatusActions contract={contract} onStatusChange={handleStatusChange} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}
