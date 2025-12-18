"use client"

import React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode | EmptyStateAction
  className?: string
}
type LinkAction = { label: string; href: string }
type ClickAction = { label: string; onClick: () => void }
type EmptyStateAction = LinkAction | ClickAction

function isEmptyStateAction(value: unknown): value is EmptyStateAction {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>

  const hasLabel = typeof v.label === "string"
  const hasHref = typeof v.href === "string"
  const hasOnClick = typeof v.onClick === "function"

  // label + exactly one of href/onClick
  return hasLabel && ((hasHref && !hasOnClick) || (hasOnClick && !hasHref))
}


export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  let actionNode: React.ReactNode = null

  if (action) {
    if (React.isValidElement(action)) {
      actionNode = action
    } else if (isEmptyStateAction(action)) {
      const button = (
        <Button onClick={"onClick" in action ? action.onClick : undefined}>
          {action.label}
        </Button>
      )

      if ("href" in action) {
  actionNode = <Link href={action.href}>{button}</Link>
} else {
  actionNode = button
}
    } else if (typeof action === "string" || typeof action === "number") {
      actionNode = <span>{action}</span>
    } else {
      // Unknown shape: fail closed (don’t render) instead of crashing the page
      actionNode = null
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionNode && <div className="mt-6">{actionNode}</div>}
    </div>
  )
}
