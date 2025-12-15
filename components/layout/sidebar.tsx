// ===== FILE: components/layout/sidebar.tsx (additions) =====
// Add these menu items to your existing sidebar navigation

/*
 * IMPORTANT: Add these new navigation items to your sidebar's admin section.
 * The exact implementation depends on your current sidebar structure.
 * Below are the menu items to add.
 */

// Navigation item for Invite Management
const inviteManagementItem = {
  title: "Invite Management",
  href: "/admin/invites",
  icon: "Mail", // lucide-react Mail icon
  permissions: ["AUTH_INVITE_LIST", "AUTH_INVITE_READ"],
}

// Navigation item for User Approval
const userApprovalItem = {
  title: "User Approval",
  href: "/admin/user-approval", 
  icon: "UserCheck", // lucide-react UserCheck icon
  permissions: ["AUTH_USER_APPROVE", "AUTH_USER_ACTIVATE"],
}

/*
 * Example integration into existing sidebar structure:
 * 
 * const adminMenuItems = [
 *   {
 *     title: "Dashboard",
 *     href: "/dashboard",
 *     icon: Home,
 *   },
 *   {
 *     title: "Users",
 *     href: "/users",
 *     icon: Users,
 *     permissions: ["AUTH_USER_READ", "VIEW_USERS"],
 *   },
 *   {
 *     title: "Roles",
 *     href: "/roles", 
 *     icon: Shield,
 *     permissions: ["AUTH_ROLE_READ", "VIEW_ROLES"],
 *   },
 *   // ADD THESE NEW ITEMS:
 *   {
 *     title: "User Approval",
 *     href: "/admin/user-approval",
 *     icon: UserCheck,
 *     permissions: ["AUTH_USER_APPROVE", "AUTH_USER_ACTIVATE"],
 *   },
 *   {
 *     title: "Invite Management",
 *     href: "/admin/invites",
 *     icon: Mail,
 *     permissions: ["AUTH_INVITE_LIST", "AUTH_INVITE_READ"],
 *   },
 * ]
 */

// ===== FULL SIDEBAR EXAMPLE WITH NEW ITEMS =====

import { 
  Home, 
  Users, 
  Shield, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  User,
  Activity,
  Mail,          // Add this import
  UserCheck,     // Add this import
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/lib/store/auth-store"
import { PermissionGate } from "@/components/common/permission-gate"

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
  // NEW: User Approval
  {
    title: "User Approval",
    href: "/admin/user-approval",
    icon: UserCheck,
    permissions: ["AUTH_USER_APPROVE", "AUTH_USER_ACTIVATE"],
  },
  // NEW: Invite Management
  {
    title: "Invite Management",
    href: "/admin/invites",
    icon: Mail,
    permissions: ["AUTH_INVITE_LIST", "AUTH_INVITE_READ"],
  },
  {
    title: "Activity Log",
    href: "/activity",
    icon: Activity,
    permissions: ["AUTH_ACTIVITY_READ", "VIEW_ACTIVITY"],
  },
]

// Settings items
const settingsNavItems = [
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

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
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{item.title}</span>}
    </Link>
  )

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">RBAC Admin</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {/* Main */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Main
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Administration */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            )}
            {adminNavItems.map((item) => (
              <PermissionGate key={item.href} permissions={item.permissions}>
                <NavItem item={item} isActive={pathname === item.href} />
              </PermissionGate>
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Settings
              </p>
            )}
            {settingsNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
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
            isCollapsed && "justify-center px-2"
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