"use client"

import { useEffect, useState } from "react"
import { Loader2, Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getBillingUnits } from "@/lib/api/services"
import type { BillingUnit } from "@/types/business"

export function BillingUnitsCard() {
  const [billingUnits, setBillingUnits] = useState<BillingUnit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBillingUnits = async () => {
      try {
        const response = await getBillingUnits()
        if (response.success && response.data) {
          setBillingUnits(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch billing units:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillingUnits()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Billing Units Reference</CardTitle>
        </div>
        <CardDescription>Available units for service billing</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : billingUnits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No billing units available</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {unit.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {unit.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
