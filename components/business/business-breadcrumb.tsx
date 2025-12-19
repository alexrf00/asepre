"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const businessRoutes: Record<string, string> = {
  "/business": "Dashboard",
  "/business/clients": "Clients",
  "/business/services": "Services",
  "/business/pricing": "Pricing",
  "/business/contracts": "Contracts",
  "/business/invoices": "Invoices",
  "/business/payments": "Payments",
}

export function BusinessBreadcrumb() {
  const pathname = usePathname()
  const currentPage = businessRoutes[pathname] || "Business"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {pathname === "/business" ? (
            <BreadcrumbPage>Business</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/business">Business</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {pathname !== "/business" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
