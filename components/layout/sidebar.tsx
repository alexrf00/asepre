"use client"

import type React from "react"

import {
  Home,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCheck,
  Mail,
  LayoutDashboard,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/lib/store/auth-store"
import { PermissionGate } from "@/components/common/permission-gate"
import Image from "next/image"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

// Main navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
]

// Admin navigation items
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
    title: "Overview",
    href: "/business",
    icon: LayoutDashboard,
    permissions: ["BUSINESS_CLIENT_READ"],
  },
  {
    title: "Clients",
    href: "/business/clients",
    icon: Building2,
    permissions: ["BUSINESS_CLIENT_READ"],
  },
  {
    title: "Services",
    href: "/business/services",
    icon: Briefcase,
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
  {
    title: "Reports",
    href: "/business/reports",
    icon: BarChart3,
    permissions: ["BUSINESS_REPORT_READ"],
  },
  {
    title: "Settings",
    href: "/business/settings",
    icon: Settings,
    permissions: ["BUSINESS_CONFIG_MANAGE"],
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const logout = useAuthStore((state) => state.logout)

  const NavItem = ({
    item,
    isActive,
  }: {
    item: { title: string; href: string; icon: React.ElementType }
    isActive: boolean
  }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-2",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{item.title}</span>}
    </Link>
  )

  const isPathActive = (href: string) => {
    if (href === "/business") {
      return pathname === "/business"
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header - Updated to use ASEPRE logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/images/asepre-logo.png" alt="ASEPRE" width={40} height={40} className="rounded-lg" />
            <span className="font-bold">ASEPRE</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Image src="/images/asepre-logo.png" alt="ASEPRE" width={32} height={32} className="rounded-lg" />
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn(isCollapsed && "hidden")}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {/* Main */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Main</p>
            )}
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} isActive={pathname === item.href} />
            ))}
          </div>

          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Business</p>
            )}
            {businessNavItems.map((item) => (
              <PermissionGate key={item.href} permissions={item.permissions}>
                <NavItem item={item} isActive={isPathActive(item.href)} />
              </PermissionGate>
            ))}
          </div>

          {/* Administration */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Administration</p>
            )}
            {adminNavItems.map((item) => (
              <PermissionGate key={item.href} permissions={item.permissions}>
                <NavItem item={item} isActive={pathname === item.href} />
              </PermissionGate>
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
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
