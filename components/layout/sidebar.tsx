"use client"

import type React from "react"
import Image from "next/image"

import {
  Home,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  UserCheck,
  LayoutDashboard,
  Package,
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  Briefcase,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/lib/store/auth-store"
import { PermissionGate } from "@/components/common/permission-gate"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { useNavBadges } from "@/hooks/use-nav-badges"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
]

const adminNavItems = [
  {
    title: "Users",
    href: "/users",
    icon: Users,
    permissions: ["AUTH_USER_READ", "VIEW_USERS"],
  },
  {
    title: "Roles",
    href: "/roles",
    icon: Shield,
    permissions: ["AUTH_ROLE_READ", "VIEW_ROLES"],
  },
  {
    title: "User Approval",
    href: "/admin/user-approval",
    icon: UserCheck,
    permissions: ["AUTH_USER_APPROVE", "AUTH_USER_ACTIVATE"],
  },
  {
    title: "Invite Management",
    href: "/admin/invites",
    icon: Mail,
    permissions: ["AUTH_INVITE_LIST", "AUTH_INVITE_READ"],
  },
]

const businessNavItems = [
  {
    title: "Dashboard",
    href: "/business",
    icon: LayoutDashboard,
    permissions: [], // Accessible to all authenticated users
  },
  {
    title: "Clients",
    href: "/business/clients",
    icon: Users,
    permissions: ["BUSINESS_CLIENT_READ"],
  },
  {
    title: "Services",
    href: "/business/services",
    icon: Package,
    permissions: ["BUSINESS_SERVICE_READ"],
  },
  {
    title: "Pricing",
    href: "/business/pricing",
    icon: DollarSign,
    permissions: ["BUSINESS_PRICE_READ"],
  },
  {
    title: "Contracts",
    href: "/business/contracts",
    icon: FileText,
    permissions: ["BUSINESS_CONTRACT_READ"],
  },
  {
    title: "Invoices",
    href: "/business/invoices",
    icon: Receipt,
    permissions: ["BUSINESS_INVOICE_READ"],
  },
  {
    title: "Payments",
    href: "/business/payments",
    icon: CreditCard,
    permissions: ["BUSINESS_PAYMENT_READ"],
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const [businessOpen, setBusinessOpen] = useState(pathname.startsWith("/business"))
  const { overdueInvoices, pendingApprovals } = useNavBadges()

  const NavItem = ({
    item,
    isActive,
    badge,
  }: {
    item: { title: string; href: string; icon: React.ElementType }
    isActive: boolean
    badge?: { count: number; variant: "destructive" | "default" }
  }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-2",
      )}
    >
      <span className="relative">
        <item.icon className="h-4 w-4 shrink-0" />
        {isCollapsed && badge && badge.count > 0 && (
          <Badge
            variant={badge.variant}
            className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
          >
            {badge.count > 99 ? "99+" : badge.count}
          </Badge>
        )}
      </span>
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {badge && badge.count > 0 && (
            <Badge variant={badge.variant} className="h-5 min-w-5 px-1.5 text-xs">
              {badge.count > 99 ? "99+" : badge.count}
            </Badge>
          )}
        </>
      )}
    </Link>
  )

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/images/asepre-logo.png" alt="ASEPRE" width={36} height={36} className="object-contain" />
            <span className="font-bold">ASEPRE</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn(isCollapsed && "mx-auto")}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Main</p>
            )}
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} isActive={pathname === item.href} />
            ))}
          </div>

          <div className="space-y-1">
            {!isCollapsed ? (
              <Collapsible open={businessOpen} onOpenChange={setBusinessOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      Business
                    </span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", businessOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {businessNavItems.map((item) => {
                    const badge =
                      item.href === "/business/invoices" && overdueInvoices > 0
                        ? { count: overdueInvoices, variant: "destructive" as const }
                        : undefined

                    return item.permissions.length > 0 ? (
                      <PermissionGate key={item.href} permissions={item.permissions}>
                        <NavItem item={item} isActive={pathname === item.href} badge={badge} />
                      </PermissionGate>
                    ) : (
                      <NavItem key={item.href} item={item} isActive={pathname === item.href} badge={badge} />
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                href="/business"
                className={cn(
                  "flex items-center justify-center rounded-lg px-2 py-2 text-sm transition-colors",
                  pathname.startsWith("/business")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Briefcase className="h-4 w-4 shrink-0" />
              </Link>
            )}
          </div>

          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Administration</p>
            )}
            {adminNavItems.map((item) => {
              const badge =
                item.href === "/admin/user-approval" && pendingApprovals > 0
                  ? { count: pendingApprovals, variant: "default" as const }
                  : undefined

              return (
                <PermissionGate key={item.href} permissions={item.permissions}>
                  <NavItem item={item} isActive={pathname === item.href} badge={badge} />
                </PermissionGate>
              )
            })}
          </div>
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
            isCollapsed && "justify-center px-2",
          )}
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}
