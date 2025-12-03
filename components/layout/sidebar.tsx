"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Shield, User, Settings, LogOut, ChevronLeft, Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/lib/store/auth-store"
import { PermissionGate } from "@/components/common/permission-gate"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissions: [],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    permissions: ["AUTH_USER_LIST", "READ_USER"],
  },
  {
    title: "Roles",
    href: "/roles",
    icon: Shield,
    permissions: ["AUTH_ROLE_READ", "MANAGE_ROLES"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    permissions: [],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["SUPERADMIN"],
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="rounded-lg bg-sidebar-primary p-1.5">
                <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">RBAC Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const NavLink = (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isCollapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              )

              // Wrap with permission gate if needed
              if (item.permissions && item.permissions.length > 0) {
                return (
                  <PermissionGate key={item.href} permissions={item.permissions}>
                    {NavLink}
                  </PermissionGate>
                )
              }

              if ((item as { roles?: string[] }).roles) {
                return (
                  <PermissionGate key={item.href} roles={(item as { roles?: string[] }).roles}>
                    {NavLink}
                  </PermissionGate>
                )
              }

              return NavLink
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {!isCollapsed && user && (
            <div className="mb-3 rounded-lg bg-sidebar-accent px-3 py-2">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={logout}
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive",
                  isCollapsed && "justify-center px-2",
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
