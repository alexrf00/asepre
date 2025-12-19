"use client"

import type { ReactNode } from "react"
import { BusinessBreadcrumb } from "@/components/business/business-breadcrumb"

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <BusinessBreadcrumb />
      {children}
    </div>
  )
}
