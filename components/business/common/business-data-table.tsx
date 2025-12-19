"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PageInfo } from "@/types"
import type { LucideIcon } from "lucide-react"

interface Column<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  className?: string
}

interface BusinessDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageInfo?: PageInfo
  onPageChange?: (page: number) => void
  isLoading?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (item: T) => void
  rowClassName?: (item: T) => string
}

export function BusinessDataTable<T extends { id: string }>({
  columns,
  data,
  pageInfo,
  onPageChange,
  isLoading = false,
  emptyIcon: EmptyIcon,
  emptyTitle = "No data",
  emptyDescription = "No items found.",
  onRowClick,
  rowClassName,
}: BusinessDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {EmptyIcon && (
            <div className="rounded-full bg-muted p-4">
              <EmptyIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(onRowClick && "cursor-pointer hover:bg-muted/50", rowClassName?.(item))}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageInfo && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pageInfo.number * pageInfo.size + 1} to{" "}
            {Math.min((pageInfo.number + 1) * pageInfo.size, pageInfo.totalElements)} of {pageInfo.totalElements}{" "}
            results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageInfo.number - 1)}
              disabled={pageInfo.first}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageInfo.number + 1} of {pageInfo.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageInfo.number + 1)}
              disabled={pageInfo.last}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
